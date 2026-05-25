import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { askBedrockFunction } from "../functions/ask-bedrock/resource";

const schema = a.schema({
  Recipe: a.customType({
    title: a.string(),
    time: a.string(),
    servings: a.string(),
    difficulty: a.string(),
    ingredients: a.string().array(),
    steps: a.string().array(),
    tip: a.string(),
  }),

  BedrockResponse: a.customType({
    recipe: a.ref("Recipe"),
    body: a.string(),
    error: a.string(),
  }),
  
  askBedrock: a
    .query()
    .arguments({ ingredients: a.string().array() })
    .returns(a.ref("BedrockResponse"))
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(askBedrockFunction)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});