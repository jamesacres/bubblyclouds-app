import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';
import { aws_cloudfront } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';

export interface JamesAcresAppStackProps extends cdk.StackProps {
  certificateArn: string;
  domainName: string;
  subdomain?: string;
}

// (Note planetacres was done manually in portal, redirect to jamesacres is done with a s3 bucket for with and without www, static website redirect, but https doesnt work)

export class JamesAcresAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: JamesAcresAppStackProps) {
    super(scope, id, props);
    const { certificateArn, domainName, subdomain } = props;

    const certificate = Certificate.fromCertificateArn(
      this,
      'Certificate',
      certificateArn
    );

    const rewriteFunction = new aws_cloudfront.Function(
      this,
      'RewriteFunction',
      {
        code: aws_cloudfront.FunctionCode.fromInline(`
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // If the URI is '/', serve index.html
    if (uri === '/') {
        request.uri = '/index.html';
    }
    // If URI doesn't end with .html and isn't a file (doesn't contain a dot), append .html
    else if (uri.slice(-5) !== '.html' && uri.indexOf('.') === -1) {
        request.uri = uri + '.html';
    }

    return request;
}
        `),
      }
    );

    new CloudFrontToS3(this, 'StaticSite', {
      cloudFrontDistributionProps: {
        certificate,
        domainNames: [
          ...(subdomain
            ? [`${subdomain}.${domainName}`]
            : [domainName, `www.${domainName}`]),
        ],
        defaultBehavior: {
          functionAssociations: [
            {
              function: rewriteFunction,
              eventType: aws_cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
        },
      },
    });
  }
}
