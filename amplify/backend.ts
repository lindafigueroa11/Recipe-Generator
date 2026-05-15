import { defineBackend } from "@aws-amplify/backend";
import { data } from "./data/resource";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { auth } from "./auth/resource";
import { askBedrockFunction } from "./functions/ask-bedrock/resource";

const backend = defineBackend({
  auth,
  data,
  askBedrockFunction,
});

backend.askBedrockFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    resources: [
      "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0",
    ],
    actions: ["bedrock:InvokeModel"],
    
  })
);