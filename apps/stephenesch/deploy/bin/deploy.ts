#!/usr/bin/env node

require('dotenv').config();
import * as cdk from 'aws-cdk-lib';
import { StephenEschAppStack } from '../lib/app-stack';

if (
  !(
    process.env.AWS_ACCOUNT_ID &&
    process.env.AWS_DEFAULT_REGION &&
    process.env.CERTIFICATE_ARN &&
    process.env.DOMAIN_NAME &&
    ['dev', 'prod'].includes(process.env.ENV!)
  )
) {
  throw Error('Missing env, use npm run cdk:xxx and populate .env');
}

const app = new cdk.App();
new StephenEschAppStack(app, 'StephenEschAppStack', {
  env: {
    account: process.env.AWS_ACCOUNT_ID,
    region: process.env.AWS_DEFAULT_REGION,
  },
  certificateArn: process.env.CERTIFICATE_ARN,
  domainName: process.env.DOMAIN_NAME,
  subdomain: process.env.SUBDOMAIN || undefined,
});
