#!/bin/bash
set -e

# Redirect script output to log file for debugging and auditing
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "=================== STARTING BOOTSTRAP INITIALIZATION ==================="

# 1. Update OS Package Index
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# Install common utilities
apt-get install -y curl wget git apt-transport-https gnupg lsb-release ca-certificates

# 2. Install Node.js (v22.x) & npm (using modern NodeSource structure)
echo ">>> Installing Node.js and NPM..."
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
apt-get update -y
apt-get install -y nodejs

# 3. Install Docker CE
echo ">>> Installing Docker..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl start docker
systemctl enable docker

# 4. Install Jenkins
echo ">>> Installing Jenkins (Java JDK 21)..."
apt-get install -y openjdk-21-jdk openjdk-21-jre

wget -O /usr/share/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | tee /etc/apt/sources.list.d/jenkins.list > /dev/null

apt-get update -y
apt-get install -y jenkins

systemctl start jenkins
systemctl enable jenkins

# 5. Install Trivy (Container Vulnerability Scanner)
echo ">>> Installing Trivy..."
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor | tee /usr/share/keyrings/trivy.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/trivy.list
apt-get update -y
apt-get install -y trivy

# 6. Install K3s (Lightweight Kubernetes Control Plane)
echo ">>> Installing K3s..."
# Disable Traefik Ingress Controller to conserve RAM and rely on Klipper ServiceLB for static Port 80/3000 binding
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" sh -

# 7. Configure System permissions & Integrations
echo ">>> Configuring System Permissions..."

# Add Jenkins user to the docker group so it can build images without sudo
usermod -aG docker jenkins

# Configure Kubeconfig for the Jenkins user
mkdir -p /var/lib/jenkins/.kube

# Wait until K3s cluster is fully initialized and configuration file exists
until [ -f /etc/rancher/k3s/k3s.yaml ]; do
  echo "Waiting for /etc/rancher/k3s/k3s.yaml file..."
  sleep 2
done

# Copy kubeconfig to Jenkins home folder and grant owner permissions
cp /etc/rancher/k3s/k3s.yaml /var/lib/jenkins/.kube/config
chown -R jenkins:jenkins /var/lib/jenkins/.kube
chmod 600 /var/lib/jenkins/.kube/config

# Also expose kubectl to default ubuntu user for manual administration/debugging
mkdir -p /home/ubuntu/.kube
cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
chown -R ubuntu:ubuntu /home/ubuntu/.kube
chmod 600 /home/ubuntu/.kube/config

# Restart Jenkins and Docker daemon to ensure group memberships take effect immediately
systemctl restart docker
systemctl restart jenkins

echo "=================== BOOTSTRAP INITIALIZATION COMPLETE ==================="
