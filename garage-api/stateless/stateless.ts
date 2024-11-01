import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';

import { Construct } from 'constructs';
import { Stage } from '../types';

export interface GarageApiStatelessStackProps extends cdk.StackProps {
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

export class GarageApiStatelessStack extends cdk.Stack {
  private api: apigw.RestApi;

  constructor(
    scope: Construct,
    id: string,
    props: GarageApiStatelessStackProps,
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

    // create a basic lambda function for returning car MOT results in raw JSON
    const getMotResultsLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'GetMotResultsLambda', {
        functionName: `get-mot-results-lambda-${stage}`,
        runtime: runtimes,
        entry: path.join(
          __dirname,
          './src/adapters/primary/get-mot/get-mot.adapter.ts',
        ),
        memorySize: 1024,
        handler: 'handler',
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          ...lambdaConfig,
        },
        bundling: {
          minify: true,
          externalModules: ['@aws-sdk/*'],
        },
      });

    // create our api for our garage mot results
    this.api = new apigw.RestApi(this, 'Api', {
      description: `(${stage}) gilmore garage api`,
      restApiName: `${stage}-garage-service-api`,
      deploy: true,
      deployOptions: {
        stageName: 'api',
        loggingLevel: apigw.MethodLoggingLevel.INFO,
      },
    });

    const root: apigw.Resource = this.api.root.addResource('v1');
    const results: apigw.Resource = root.addResource('results');
    const motResultById: apigw.Resource = results.addResource('{id}');

    // point the api resource to the lambda function
    motResultById.addMethod(
      'GET',
      new apigw.LambdaIntegration(getMotResultsLambda, {
        proxy: true,
      }),
    );

    // we push this to ssm so we can use it in our other service
    new ssm.StringParameter(this, 'GarageApiUrl', {
      parameterName: `/${stage}/garage-api-url`,
      stringValue: this.api.url,
    });
  }
}
