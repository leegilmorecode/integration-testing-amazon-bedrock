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
