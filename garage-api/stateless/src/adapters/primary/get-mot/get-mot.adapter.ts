import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import { errorHandler, getHeaders, logger } from '@shared';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { config } from '@config';
import { MotResult } from '@dto/mot-result';
import { ValidationError } from '@errors/validation-error';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import { getMotUseCase } from '@use-cases/get-mot';

const tracer = new Tracer();
const metrics = new Metrics();

const stage = config.get('stage');

export const getMotAdapter = async ({
  pathParameters,
}: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = pathParameters?.id;

    if (!id) throw new ValidationError('Id is required');

    const motResult: MotResult = await getMotUseCase(id);

    metrics.addMetric('SuccessfulGetMot', MetricUnit.Count, 1);

    return {
      statusCode: 200,
      body: JSON.stringify(motResult),
      headers: getHeaders(stage),
    };
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) errorMessage = error.message;
    logger.error(errorMessage);

    metrics.addMetric('GetMotError', MetricUnit.Count, 1);

    return errorHandler(error);
  }
};

export const handler = middy(getMotAdapter)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics))
  .use(httpErrorHandler());
