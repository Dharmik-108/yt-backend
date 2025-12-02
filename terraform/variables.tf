
variable "aws_region" {
  description = "AWS region"
  type = string
  default = "eu-north-1"
}

variable "app_name" {
  type = string
  default = "yt-backend"
}

variable "task_cpu" {
  type = number
  default = 256
}

variable "task_memory" {
  type = number
  default = 512
}

variable "desired_count" {
  type = number
  default = 1
}
