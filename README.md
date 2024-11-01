# e2e Testing Amazon Bedrock Responses using AI

We cover seamless e2e testing of AI responses using an Amazon Bedrock test framework for confidence, tone and testing assertions, with examples written in Typescript and the AWS CDK.

![image](./docs/images/header.png)

> Note: If you choose to deploy these resources you may be charged for usage.

You can find the associated article here: https://blog.serverlessadvocate.com/how-to-e2e-test-ai-responses-using-ai-8c22367c76d6

### Deploying the Solution

To deploy the solution in e2e test mode (using our api test harness) we must do the following which will deploy the `test` stage stack:

1. In the `garage-api` folder run the following `npm run deploy:test`.
2. In the `customer-api` folder run the following `npm run deploy:test`.

To deploy the solution outside of e2e test mode we must do the following which will deploy the `develop` stack:

1. In the `garage-api` folder run the following `npm run deploy:develop`.
2. In the `customer-api` folder run the following `npm run deploy:develop`.
