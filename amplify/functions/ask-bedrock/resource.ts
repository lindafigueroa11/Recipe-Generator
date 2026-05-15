import { defineFunction } from "@aws-amplify/backend";

export const askBedrockFunction = defineFunction({
  name: "ask-bedrock",
  entry: "./handler.ts",
  runtime: 20,
  timeoutSeconds: 30,
});
