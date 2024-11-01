import { getParameter } from '@aws-lambda-powertools/parameters/ssm';
import { logger } from '@shared';
import { Stage } from '../../../types';

// a function to ensure that in the test stage we use the api test harness
export async function getRestEndpoint(stage: Stage): Promise<string> {
  const restEndpoint =
    stage === Stage.test
      ? ((await getParameter(`/${stage}/api-test-harness-url`)) as string)
      : ((await getParameter(`/${stage}/garage-api-url`)) as string);

  logger.info(`using api url: ${restEndpoint}`);

  return restEndpoint;
}
