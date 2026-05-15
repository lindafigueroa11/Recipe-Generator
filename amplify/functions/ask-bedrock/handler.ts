import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import type { Schema } from "../../data/resource";

const MODEL_ID = "amazon.nova-lite-v1:0";
const MAX_INGREDIENTS = 20;
const MAX_INGREDIENT_LENGTH = 60;
const INVALID_CHAR_REGEX = /[<>`$\\{}]/;

const client = new BedrockRuntimeClient({ region: "us-east-1" });

const normalizeIngredients = (ingredients: unknown): string[] => {
  if (!Array.isArray(ingredients)) {
    return [];
  }

  return ingredients
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

const validateIngredients = (ingredients: string[]): string | null => {
  if (ingredients.length === 0) {
    return "Ingresa al menos un ingrediente.";
  }
  if (ingredients.length > MAX_INGREDIENTS) {
    return `Puedes ingresar hasta ${MAX_INGREDIENTS} ingredientes.`;
  }
  if (ingredients.some((item) => item.length > MAX_INGREDIENT_LENGTH)) {
    return `Cada ingrediente debe tener ${MAX_INGREDIENT_LENGTH} caracteres o menos.`;
  }
  if (ingredients.some((item) => INVALID_CHAR_REGEX.test(item))) {
    return "Algunos ingredientes contienen caracteres no permitidos.";
  }
  return null;
};

export const handler: Schema["askBedrock"]["functionHandler"] = async (event) => {
  try {
    const ingredients = normalizeIngredients(event.arguments?.ingredients);
    const validationError = validateIngredients(ingredients);

    if (validationError) {
      return { error: validationError };
    }

    const prompt = [
      "Genera una receta original en espanol usando estos ingredientes.",
      `Ingredientes: ${ingredients.join(", ")}.`,
      "Devuelve solo: titulo, lista de ingredientes y pasos numerados breves.",
    ].join(" ");

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        schemaVersion: "messages-v1",
        messages: [
          {
            role: "user",
            content: [{ text: prompt }],
          },
        ],
        inferenceConfig: {
          max_new_tokens: 800,
          temperature: 0.7,
          top_p: 0.9,
        },
      }),
    });

    const response = await client.send(command);
    const bodyBytes = response.body ? (response.body as Uint8Array) : undefined;
    const bodyString = bodyBytes
      ? new TextDecoder("utf-8").decode(bodyBytes)
      : "{}";
    const parsed = JSON.parse(bodyString) as {
      output?: {
        message?: {
          content?: Array<{ text?: string }>;
        };
      };
      content?: Array<{ type?: string; text?: string }>;
    };

    const generatedText =
      parsed.output?.message?.content?.find(
        (block) => typeof block?.text === "string"
      )?.text ??
      parsed.content?.find(
        (block) => block?.type === "text" && typeof block.text === "string"
      )?.text;

    if (!generatedText) {
      return { error: "Bedrock no devolvio texto para esta receta." };
    }

    return { body: generatedText.trim() };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo generar la receta en este momento.";
    return { error: message };
  }
};
