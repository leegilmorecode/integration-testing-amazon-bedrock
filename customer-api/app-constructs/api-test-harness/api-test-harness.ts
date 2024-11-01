import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';

import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface ApiTestHarnessConstructProps {
  stage: string;
}

export class ApiTestHarnessConstruct extends Construct {
  public readonly dynamoDbTable: dynamodb.Table;
  constructor(
    scope: Construct,
    id: string,
    props: ApiTestHarnessConstructProps,
  ) {
    super(scope, id);

    this.dynamoDbTable = new dynamodb.Table(this, id + 'DynamoDbTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.NUMBER },
      tableName: `api-test-harness-table-${props.stage}`,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // add our lambda config
    const lambdaConfig = {
      LOG_LEVEL: 'DEBUG',
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
      POWERTOOLS_TRACE_ENABLED: 'true',
      POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: 'true',
      POWERTOOLS_SERVICE_NAME: `api-test-harness-service-${props.stage}`,
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
      POWERTOOLS_METRICS_NAMESPACE: `api-test-harness-${props.stage}`,
    };

    const apiTestHarnessLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'ApiTestHarnessLambda', {
        functionName: `api-test-harness-${props.stage}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          './src/adapters/primary/api-test-harness.adapter.ts',
        ),
        memorySize: 1024,
        handler: 'handler',
        description: 'api test harness service lambdalith',
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          minify: true,
        },
        environment: {
          ...lambdaConfig,
          TABLE_NAME: this.dynamoDbTable.tableName,
        },
      });

    apiTestHarnessLambda.addPermission('ResourcePolicy', {
      principal: new iam.AnyPrincipal(),
      action: 'lambda:InvokeFunctionUrl',
      functionUrlAuthType: lambda.FunctionUrlAuthType.NONE,
    });
    this.dynamoDbTable.grantReadWriteData(apiTestHarnessLambda);

    // we add the function url for our internal lambdalith
    const apiTestHarnessUrl = apiTestHarnessLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      invokeMode: lambda.InvokeMode.BUFFERED,
      cors: {
        allowedOrigins: ['*'],
      },
    });

    // export the function url
    new cdk.CfnOutput(this, 'ApiTestHarnessUrl', {
      value: apiTestHarnessUrl.url,
      exportName: `api-test-harness-url-${props.stage}`,
    });

    // export the function url to ssm
    new ssm.StringParameter(this, 'ApiTestHarnessUrlParam', {
      parameterName: `/${props.stage}/api-test-harness-url`,
      stringValue: apiTestHarnessUrl.url,
    });
  }
}
