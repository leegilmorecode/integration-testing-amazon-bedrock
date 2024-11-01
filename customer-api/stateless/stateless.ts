import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';

import { Construct } from 'constructs';
import { ApiTestHarnessConstruct } from '../app-constructs/api-test-harness';
import { Stage } from '../types';

export interface CustomerApiStatelessStackProps extends cdk.StackProps {
  shared: {
    stage: Stage;
    serviceName: string;
    metricNamespace: string;
    logging: {
      logLevel: 'DEBUG' | 'INFO' | 'ERROR';
      logEvent: 'true' | 'false';
    };
  };
  env: {
    account: string;
    region: string;
  };
  stateless: {
    runtimes: lambda.Runtime;
  };
}

export class CustomerApiStatelessStack extends cdk.Stack {
  private api: apigw.RestApi;

  constructor(
    scope: Construct,
    id: string,
    props: CustomerApiStatelessStackProps,
  ) {
    super(scope, id, props);

    const {
      shared: {
        stage,
        serviceName,
        metricNamespace,
        logging: { logLevel, logEvent },
      },
      stateless: { runtimes },
      env: { account, region },
    } = props;

    const lambdaConfig = {
      LOG_LEVEL: logLevel,
      POWERTOOLS_LOGGER_LOG_EVENT: logEvent,
      POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
      POWERTOOLS_TRACE_ENABLED: 'true',
      POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: 'true',
      POWERTOOLS_SERVICE_NAME: serviceName,
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
      POWERTOOLS_METRICS_NAMESPACE: metricNamespace,
    };

    // we create the api test harness only in lower environments
    if (stage !== Stage.prod && stage !== Stage.staging) {
      new ApiTestHarnessConstruct(this, 'ApiTestHarness', {
        stage: stage,
      });
    }

    // create a basic lambda function for returning car results
    const getResultsLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'GetResultsLambda', {
        functionName: `get-results-lambda-${stage}`,
        runtime: runtimes,
        entry: path.join(
          __dirname,
          './src/adapters/primary/get-result/get-result.adapter.ts',
        ),
        memorySize: 1024,
        handler: 'handler',
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          ...lambdaConfig,
          STAGE: stage,
          POWERTOOLS_PARAMETERS_MAX_AGE: stage === Stage.test ? '0' : '120', // ensure we dont cache in test stage
        },
        bundling: {
          minify: true,
          externalModules: ['@aws-sdk/*'],
        },
      });

    // ensure the function can access param store for config
    getResultsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [`arn:aws:ssm:${region}:${account}:parameter/*`],
      }),
    );

    // ensure the function can access bedrock for the text summary
    getResultsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'bedrock:RetrieveAndGenerate',
          'bedrock:Retrieve',
          'bedrock:InvokeModel',
        ],
        resources: ['*'],
      }),
    );

    // create our api for our garage mot results per customer
    this.api = new apigw.RestApi(this, 'Api', {
      description: `(${stage}) gilmore customer api`,
      restApiName: `${stage}-customer-service-api`,
      deploy: true,
      deployOptions: {
        stageName: 'api',
        loggingLevel: apigw.MethodLoggingLevel.INFO,
      },
    });

    const root: apigw.Resource = this.api.root.addResource('v1');
    const customers: apigw.Resource = root.addResource('customers');
    const customerById: apigw.Resource = customers.addResource('{customerId}');
    const results: apigw.Resource = customerById.addResource('results');
    const motResultById: apigw.Resource = results.addResource('{id}');

    // point the api resource to the lambda function
    motResultById.addMethod(
      'GET',
      new apigw.LambdaIntegration(getResultsLambda, {
        proxy: true,
      }),
    );

    // we push this api url to ssm so we can use it in our e2e tests
    new ssm.StringParameter(this, 'GarageApiUrl', {
      parameterName: `/${stage}/customer-api-url`,
      stringValue: this.api.url,
    });
  }
}
