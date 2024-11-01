import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';

export type ActionPromptDto = {
  contentType: string;
  accept: string;
  prompt: string;
  max_tokens_to_sample: number;
  stop_sequences: string[];
  temperature: number;
  top_p: number;
  top_k: number;
};

export type ModelResponse = {
  type: string;
  text: string;
};

export type ModelResponses = ModelResponse[];

export enum Tone {
  neutral = 'neutral',
  happy = 'happy',
  sad = 'sad',
  angry = 'angry',
}

export const AssertionsMet = {
  yes: true,
  no: false,
};

export type AssertionResponse = {
  assertionsMet: typeof AssertionsMet;
  score: number;
  tone: Tone;
  explanation: string;
};

export interface ResponseAssertionsInput {
  prompt: string;
  text: string;
  modelId?: string;
  bedrockVersion?: string;
  maxTokensToSample?: number;
  topP?: number;
  topK?: number;
  contentType?: string;
  accept?: string;
  stopSequences?: string[];
  temperature?: number;
}

const bedrock = new BedrockRuntimeClient({});

const invokeBedrockApi = async (
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
    return result;
  } catch (error) {
    throw error;
  }
};

export async function responseAssertions({
  prompt,
  text,
  modelId = 'anthropic.claude-3-haiku-20240307-v1:0',
  bedrockVersion = 'bedrock-2023-05-31',
  maxTokensToSample = 500,
  topP = 0.7,
  topK = 200,
  contentType = 'application/json',
  accept = 'application/json',
  stopSequences = [],
  temperature = 0.3,
}: ResponseAssertionsInput): Promise<AssertionResponse> {
  const assertionPrompt = `Analyze the following text and assertions to return:

1. A single overall confidence score (0-10) where:
   * 10 = All assertions perfectly match
   * 7-9 = Most assertions strongly match
   * 4-6 = Some assertions partially match  
   * 0-3 = Few or no assertions match

2. A single boolean 'assertionsMet' value which is true only if all of the assertions to test for in the text are satisfied fully.
   * Case-sensitive where specified
   * Partial matches should be flagged

3. A clear explanation of the scoring rationale as one string value which covers each of the assertions and the values.

4. The emotional tone (neutral, angry, happy, or sad) based on:
   - Emotional words and phrases
   - Punctuation and emphasis
   - Overall context

Return results in a single JSON object.

Return JSON with:
    {
        "assertionsMet": boolean,
        "score": number,
        "tone": string,
        "explanation": string
    } 

Text:

"${text}"

Assertions:

 ${prompt}

.Assistant:`;

  const result: ModelResponses = await invokeBedrockApi(
    {
      contentType,
      accept,
      prompt: assertionPrompt,
      max_tokens_to_sample: maxTokensToSample,
      stop_sequences: stopSequences,
      temperature,
      top_p: topP,
      top_k: topK,
    },
    modelId,
    bedrockVersion,
  );

  return JSON.parse(result[0].text.replace(/[\x00-\x1F\x7F]/g, ''));
}
