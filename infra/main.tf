terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# --- Variables ---
variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "Target AWS Region"
}

variable "key_name" {
  type        = string
  description = "Name of the existing EC2 Key Pair for SSH access"
}

# --- Networking ---
resource "aws_vpc" "studyhive_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "studyhive-vpc"
  }
}

resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.studyhive_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "studyhive-public-subnet"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.studyhive_vpc.id

  tags = {
    Name = "studyhive-igw"
  }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.studyhive_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "studyhive-public-rt"
  }
}

resource "aws_route_table_association" "public_rt_assoc" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# --- Security Groups ---
resource "aws_security_group" "sg_studyhive" {
  name        = "studyhive-server-sg"
  description = "Security Group for StudyHive Jenkins, K3s, and Monitoring"
  vpc_id      = aws_vpc.studyhive_vpc.id

  # SSH Access
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Restrict to your public IP in production!
  }

  # Jenkins Web Console
  ingress {
    description = "Jenkins Web UI"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Required for GitHub Webhook callbacks
  }

  # K3s Application Port (Exposed via Klipper ServiceLB)
  ingress {
    description = "HTTP application ingress"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Grafana Dashboard (Exposed via Klipper ServiceLB)
  ingress {
    description = "Grafana Web Dashboard"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound Rules (Allow all internet traffic)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "studyhive-security-group"
  }
}

# --- AMI Data Source ---
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical
}

# --- EC2 Instance Provisioning ---
resource "aws_instance" "studyhive_host" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "c7i-flex.large" # 2 vCPUs, 8 GB RAM - Perfect for K3s+Jenkins+Docker builds
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.sg_studyhive.id]
  subnet_id              = aws_subnet.public_subnet.id

  # Injecting the bootstrap shell script
  user_data = file("${path.module}/bootstrap.sh")

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = {
    Name = "StudyHive-Jenkins-K3s-Host"
  }
}

# --- Elastic IP allocation ---
resource "aws_eip" "eip_studyhive" {
  instance = aws_instance.studyhive_host.id
  domain   = "vpc"

  tags = {
    Name = "studyhive-static-ip"
  }
}

# --- Outputs ---
output "instance_public_ip" {
  value       = aws_eip.eip_studyhive.public_ip
  description = "Use this IP to access Jenkins on 8080, Grafana on 3000, and the app on 80"
}
