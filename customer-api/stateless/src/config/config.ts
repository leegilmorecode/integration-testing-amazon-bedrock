const convict = require('convict');

export const config = convict({
  // shared config
  stage: {
    doc: 'The stage being deployed',
    format: String,
    default: '',
    env: 'STAGE',
  },
  // stateless config
  bedrockModelId: {
    doc: 'The modelId we are using for bedrock',
    format: String,
    default: 'anthropic.claude-3-haiku-20240307-v1:0',
  },
  bedrockVersion: {
    doc: 'The anthropic version',
    format: String,
    default: 'bedrock-2023-05-31',
  },
}).validate({ allowed: 'strict' });
