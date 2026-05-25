# StudyHive Academic Portal

StudyHive is a responsive, computer science academic portal designed with industry-grade React standards, 100% offline portability, and interactive visual simulators focusing on Computer Science topics.

## 🚀 Cloud Architecture & CI/CD Pipeline

This repository is configured with an automated DevSecOps CI/CD pipeline and monitoring stack deployed on a K3s Kubernetes cluster in AWS EC2.

### Architectural Workflow

1. **Push to main**: Developer pushes code to the `main` branch on GitHub.
2. **Webhook Trigger**: GitHub triggers a webhook to the Jenkins server.
3. **NPM Security Audit**: Jenkins audits dependencies for vulnerabilities.
4. **Docker Build**: Jenkins builds a Docker container using the multi-stage [Dockerfile](Dockerfile).
5. **Trivy Vulnerability Scan**: Jenkins scans the container image for high/critical security issues.
6. **Docker Hub Push**: The verified image is pushed to Docker Hub (`aradhyabhardwaj/study-hive`).
7. **K3s Deployment**: Jenkins updates Kubernetes manifests and performs a rolling update.
8. **Observability Stack**: Prometheus scrapes application metrics (via Nginx sidecar exporter) and host metrics (via Node Exporter), visualized via Grafana.

---

## 📂 Project Structure

- `/infra`: Terraform configuration (`main.tf` & `bootstrap.sh`) to provision AWS resources.
- `/k8s`: Kubernetes manifests for the application and monitoring stack (Prometheus & Grafana).
- `Dockerfile`: Multi-stage build process.
- `nginx.conf`: Nginx configuration for serving built static files and exporting metrics.
- `Jenkinsfile`: Jenkins declarative pipeline configuration.
