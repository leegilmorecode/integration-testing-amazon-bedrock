import {
  ModelResponses,
  invokeBedrockApi,
} from '@adapters/secondary/bedrock-adapter/bedrock.adapter';

import { getCustomerCommunicationPreferences } from '@adapters/secondary/database-adapter';
import { httpCall } from '@adapters/secondary/http-adapter';
import { config } from '@config';
import { ActionPromptDto } from '@dto/action-prompt';
import { Response } from '@dto/response';
import { Result } from '@dto/result';
import { logger } from '@shared';
import { getRestEndpoint } from '@shared/get-rest-endpoint';

const stage = config.get('stage');
const modelId = config.get('bedrockModelId');
const bedrockVersion = config.get('bedrockVersion');

export async function getResultUseCase(
  id: string,
  customerId: string,
): Promise<Response> {
  // get the correct url i.e. garage api or test harness api depending on stage
  const restEndpoint = await getRestEndpoint(stage);

  // get this customers communication preferences
  const communicationPreference =
    await getCustomerCommunicationPreferences(customerId);

  // call the api to get the mot result for the specific customer
  const motResult = (await httpCall(
    restEndpoint,
    `v1/results/${id}`,
    'GET',
  )) as Result;

  logger.debug(
    `mot result retrieved: ${JSON.stringify(motResult)} for id ${id}`,
  );

  // run it through bedrock to get a customer summary using AI and their comms preference
  const params: ActionPromptDto = {
    prompt: `Human:please summarise the car inspection result for a non-technical customer who likes ${communicationPreference}
             where the result details are ${JSON.stringify(motResult)} and the summary should contain
             the colour, make, model, the date of inspection, the expiry date, the test centre name and address, and any advisories.
             Please give the result without mentioning this summary is for a non-technical customer. Assistant:`,
    max_tokens_to_sample: 200,
    stop_sequences: [],
    contentType: 'application/json',
    accept: '*/*',
    top_p: 0.9, //  known as nucleus sampling, this parameter influences the diversity of the generated text.
    temperature: 0.5, // value of 0.5 suggests a moderate level of randomness, allowing for some variability in the responses while still prioritizing coherence.
    top_k: 5, // parameter limits the model to sampling from the top k most likely next tokens
  };

  const modelResponse: ModelResponses = await invokeBedrockApi(
    params,
    modelId,
    bedrockVersion,
  );

  logger.debug(
    `bedrock response for report: ${modelResponse[0].text} for id ${id}`,
  );

  // the response shows the summary using bedrock and the raw result
  return { summary: modelResponse[0].text, result: motResult };
}
