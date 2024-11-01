import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import { errorHandler, getHeaders, logger } from '@shared';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { config } from '@config';
import { ValidationError } from '@errors/validation-error';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import { getResultUseCase } from '@use-cases/get-result';

const tracer = new Tracer();
const metrics = new Metrics();

const stage = config.get('stage');

export const getResultAdapter = async ({
  pathParameters,
}: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = pathParameters?.id;
    const customerId = pathParameters?.customerId;

    if (!id) throw new ValidationError('Id is required');
    if (!customerId) throw new ValidationError('CustomerId is required');

    const result = await getResultUseCase(id, customerId);

    metrics.addMetric('SuccessfulGetResult', MetricUnit.Count, 1);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
      headers: getHeaders(stage),
    };
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) errorMessage = error.message;
    logger.error(errorMessage);

    metrics.addMetric('GetResultError', MetricUnit.Count, 1);

    return errorHandler(error);
  }
};

export const handler = middy(getResultAdapter)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics))
  .use(httpErrorHandler());
