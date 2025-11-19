---
title: "ECR Permissions in AWS"
date: 2025-08-31 12:00:00 -0500
categories: [Learnings, AWS]
tags: [ECR, permissions, troubleshooting, learning, security]
pin: false
---

I recently encountered a situation where I had a team member facing an issue pushing an image to ECR (Elastic Container Registry) in AWS. After some investigation, I noticed that permissions for pushing images in the ECR policy were not set at the repository level. This is something I actually knew, so it took me a few moments to realize the oversight.

Here are the steps I took:

First, I navigated to the ECR console in AWS and noticed that the repository policy did not have the necessary permissions for the user to push images. Since the user needed to push images, I decided to replicate the behavior the user was experiencing by testing the push myself.

I made sure that I was logged into the correct account:
```
aws sso login --profile <account_name>
```

Then I authenticated Docker with ECR:
```
aws ecr get-login-password --region us-east-1 --profile <account_name> \
  | docker login --username AWS --password-stdin <account_id>.dkr.ecr.us-east-1.amazonaws.com
```

Next, I prepared a test image to push:
```
# Pull a small test image
docker pull alpine:latest

# Tag it for the ECR repository
docker tag alpine:latest <account_id>.dkr.ecr.us-east-1.amazonaws.com/IMAGENAME:latest

# Attempt to push the image
docker push <account_id>.dkr.ecr.us-east-1.amazonaws.com/IMAGENAME:latest
```

The output showed a `403 Forbidden` error, indicating that the user did not have permission to push images to the repository.

This error showed that there was a lack of necessary permissions in the ECR repository policy.

My next step was to navigate to the ECR repository and check if there were any statements allowing the user to push images. I found that none were set, causing the `403 Forbidden` error.

My next step was to set a policy that would allow me to push the image to the repository. 

The policy I set was as follows:

```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPushFromOtherAccount",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:sts::<account_id>:assumed-role/AWSReservedSSO_AdministratorAccess_103f597743d50aa5/<user_name>"
      },
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:CompleteLayerUpload",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart"
      ]
    }
  ]
}
```

I then ran the same push command again, and this time the image was successfully pushed to the ECR repository. After confirming with the user that they were now able to push their images, I realized that the policy I created was too specific - it only worked for that particular user's assumed role. I needed to create a more general policy so that anyone from the account with the appropriate permissions could push images to the ECR repository.

I replaced the specific policy with this more general policy that allows any user from the AWS account:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPushFromAccount",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<account_id>:root"
      },
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:CompleteLayerUpload",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart",
        "ecr:BatchGetImage"
      ]
    }
  ]
}
```

The key difference between the two policies:
1. **Specific user policy**: Grants access to a particular assumed role ARN
2. **Account-wide policy**: Grants access to any user in the AWS account (using `:root`)

Note that `ecr:GetAuthorizationToken` is not included in these repository policies because it's an account-level permission that users need separately to authenticate with ECR.

## Lessons Learned
What I learned is that replicating an issue can really make a difference when troubleshooting permissions issues in AWS. By actually testing the push operation myself, I could see the exact error and understand what permissions were missing.

I learned that sometimes navigating the AWS console reveals settings that aren't immediately obvious through CLI or SDKs, particularly for repository-level policies and permissions.

