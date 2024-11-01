import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';

import { ActionPromptDto } from '@dto/action-prompt';
import { logger } from '@shared';

const bedrock = new BedrockRuntimeClient({});

export type ModelResponse = {
  type: string;
  text: string;
};

export type ModelResponses = ModelResponse[];

export const invokeBedrockApi = async (
  actionPromptDto: ActionPromptDto,
  modelId: string,
  bedrockVersion: string,
): Promise<ModelResponses> => {
  const {
    accept,
    contentType,
    max_tokens_to_sample,
    prompt,
    top_p,
    top_k,
    temperature,
  } = actionPromptDto;

  const body = JSON.stringify({
    anthropic_version: bedrockVersion,
    max_tokens: max_tokens_to_sample,
    temperature: temperature,
    top_p: top_p,
    top_k: top_k,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  const input: InvokeModelCommandInput = {
    body,
    contentType,
    accept,
    modelId,
  };

  const params = new InvokeModelCommand(input);

  try {
    const { body: promptResponse } = await bedrock.send(params);

    const promptResponseJson = JSON.parse(
      new TextDecoder().decode(promptResponse),
    );

    const result = promptResponseJson.content;

    logger.debug(`Full prompt response: ${result}`);

    return result;
  } catch (error) {
    logger.error(`error processing data: ${error}`);
    throw error;
  }
};
