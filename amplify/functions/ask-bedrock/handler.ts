import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import type { Schema } from "../../data/resource";

const MODEL_ID = "amazon.nova-lite-v1:0";
const MAX_INGREDIENTS = 20;
const MAX_INGREDIENT_LENGTH = 60;
const INVALID_CHAR_REGEX = /[<>`$\\{}]/;

const client = new BedrockRuntimeClient({ region: "us-east-1" });

type StructuredRecipe = {
  title: string;
  time: string;
  servings: string;
  difficulty: string;
  ingredients: string[];
  steps: string[];
  tip: string;
};

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

const stripCodeFences = (value: string) =>
  value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

const parseStructuredRecipe = (rawText: string): StructuredRecipe | null => {
  const normalized = stripCodeFences(rawText);

  try {
    const parsed = JSON.parse(normalized) as Partial<StructuredRecipe>;
    const title = parsed.title?.toString().trim() ?? "";
    const time = parsed.time?.toString().trim() ?? "";
    const servings = parsed.servings?.toString().trim() ?? "";
    const difficulty = parsed.difficulty?.toString().trim() ?? "";
    const tip = parsed.tip?.toString().trim() ?? "";

    const ingredients = Array.isArray(parsed.ingredients)
      ? parsed.ingredients
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
      : [];
    const steps = Array.isArray(parsed.steps)
      ? parsed.steps
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
      : [];

    if (!title || ingredients.length === 0 || steps.length === 0) {
      return null;
    }

    return {
      title,
      time: time || "25 min",
      servings: servings || "2 porciones",
      difficulty: difficulty || "Facil",
      ingredients,
      steps,
      tip: tip || "Agrega hierbas frescas al final para mayor aroma.",
    };
  } catch {
    return null;
  }
};

export const handler: Schema["askBedrock"]["functionHandler"] = async (event) => {
  try {
    const ingredients = normalizeIngredients(event.arguments?.ingredients);
    const validationError = validateIngredients(ingredients);

    if (validationError) {
      return { error: validationError };
    }

    const prompt = [
      "Eres un chef experto. Responde UNICAMENTE en JSON valido sin markdown ni texto extra.",
      "Genera una receta en espanol con estos ingredientes.",
      `Ingredientes: ${ingredients.join(", ")}.`,
      'Usa exactamente este formato: {"title":"", "time":"", "servings":"", "difficulty":"", "ingredients":[""], "steps":[""], "tip":""}.',
      "Incluye 5 pasos maximo, ingredientes practicos y consejo final breve.",
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
          temperature: 0.2,
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

    const recipe = parseStructuredRecipe(generatedText);
    if (!recipe) {
      return {
        error: "No se pudo estructurar la respuesta de IA en una receta valida.",
        body: generatedText.trim(),
      };
    }

    return { recipe, body: generatedText.trim() };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo generar la receta en este momento.";
    return { error: message };
  }
};
