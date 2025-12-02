# Terraform + ECS Fargate deployment for yt-backend

How to use (short):
1. Create an AWS user with permissions for ECR, ECS, IAM, ELB, VPC, CloudWatch.
2. Configure AWS credentials locally: `aws configure` or set env vars.
3. Build and push image to ECR with GitHub Actions (workflow provided) OR build locally and push.
4. Terraform init & apply:
   ```bash
   cd terraform
   terraform init
   terraform apply -var 'aws_region=ap-south-1' -auto-approve
   ```
5. After apply, note the ALB DNS output and open it in browser.

This repo provides:
- Terraform to create VPC, ECR, ECS cluster, Task, Service, ALB (minimal example).
- GitHub Actions workflow to build Docker image and push to ECR on push to main.
