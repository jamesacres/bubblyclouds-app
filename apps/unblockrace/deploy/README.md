# Unblock Race Deploy

AWS CDK stack that creates the infrastructure for deploying the Unblock Race
web app as a fully static site.

## Infrastructure

- **S3 Bucket** - Hosts the static build output
- **CloudFront Distribution** - CDN with custom domain and SSL certificate
- **CloudFront Function** - Rewrites URLs (e.g. `/puzzle` to `/puzzle.html`) for
  clean Next.js static export routes

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js and npm
- An ACM certificate in `us-east-1` for your domain

## Setup

1. Copy `.env.example` to `.env` and fill in the values:

   ```
   AWS_ACCOUNT_ID=123456789012
   AWS_DEFAULT_REGION=us-east-1
   CERTIFICATE_ARN=arn:aws:acm:us-east-1:...
   DOMAIN_NAME=example.com
   SUBDOMAIN=unblockrace
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Deploy the CDK stack (one-time, or when infrastructure changes):

   ```bash
   npm run cdk:deploy
   ```

4. After deploying, note the S3 bucket name and CloudFront distribution ID from
   the stack outputs and add them to `.env`:

   ```
   BUCKET_NAME=appstack-staticsites3bucket...
   DISTRIBUTION_ID=E1234567890ABC
   ```

## Deploying Updates

After building the app (`pnpm run build:unblockrace` from the repo root), sync
the static output to S3 and invalidate the CloudFront cache:

```bash
npm run sync-s3
```

This uploads the contents of `../out/` to S3 and creates a CloudFront cache
invalidation.

## Useful Commands

- `npm run cdk:deploy` - Deploy the stack to AWS
- `npm run cdk:diff` - Compare deployed stack with current state
- `npm run cdk:synth` - Emit the synthesized CloudFormation template
- `npm run sync-s3` - Upload static files and invalidate CloudFront
- `npm run test` - Run the CDK snapshot tests
