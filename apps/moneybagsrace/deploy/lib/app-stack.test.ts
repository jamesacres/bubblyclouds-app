import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MoneyBagsRaceAppStack } from './app-stack';

describe('AppStack', () => {
  it('should match the snapshot', () => {
    const app = new App();
    const appStack = new MoneyBagsRaceAppStack(app, 'MoneyBagsRaceAppStack', {
      env: {
        account: '12345678012',
        region: 'eu-west-2',
      },
      certificateArn:
        'arn:aws:acm:us-east-1:12345678012:certificate/00000000-0000-0000-0000-0000000000000',
      domainName: 'jest.test',
      subdomain: undefined,
    });
    const template = Template.fromStack(appStack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
