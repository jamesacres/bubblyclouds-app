import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { UnblockRaceAppStack } from './app-stack';

describe('AppStack', () => {
  const buildTemplate = () => {
    const app = new App();
    const appStack = new UnblockRaceAppStack(app, 'UnblockRaceAppStack', {
      env: {
        account: '12345678012',
        region: 'eu-west-2',
      },
      certificateArn:
        'arn:aws:acm:us-east-1:12345678012:certificate/00000000-0000-0000-0000-0000000000000',
      domainName: 'jest.test',
      subdomain: undefined,
    });
    return Template.fromStack(appStack);
  };

  it('should match the snapshot', () => {
    const template = buildTemplate();
    expect(template.toJSON()).toMatchSnapshot();
  });

  it('should block all public access on every S3 bucket', () => {
    const template = buildTemplate();
    template.allResourcesProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('should require TLS 1.2 and redirect viewers to HTTPS on the CloudFront distribution', () => {
    const template = buildTemplate();
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        ViewerCertificate: {
          MinimumProtocolVersion: 'TLSv1.2_2021',
        },
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: 'redirect-to-https',
        },
      },
    });
  });
});
