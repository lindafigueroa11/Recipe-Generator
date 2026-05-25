import { buildRecipeImagePrompt } from "./_lib/buildRecipeImagePrompt";
import { requestFluxImage } from "./_lib/hfFluxClient";

type RecipeImagePayload = {
  recipeName?: string;
  ingredients?: string[];
};

type ServerlessRequest = {
  method?: string;
  body?: unknown;
};

type ServerlessResponse = {
  status: (statusCode: number) => {
    json: (payload: unknown) => unknown;
  };
};

const parsePayload = (payload: RecipeImagePayload) => {
  const recipeName = (payload.recipeName ?? "").toString().trim().slice(0, 120);
  const ingredients = Array.isArray(payload.ingredients)
    ? payload.ingredients
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .slice(0, 12)
    : [];

  return { recipeName, ingredients };
};

const toBase64DataUrl = (buffer: ArrayBuffer, contentType: string) => {
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${contentType};base64,${base64}`;
};

export default async function handler(
  request: ServerlessRequest,
  response: ServerlessResponse
) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed." });
  }

  const token = process.env.HF_TOKEN;

  try {
    const payload =
      typeof request.body === "string"
        ? (JSON.parse(request.body) as RecipeImagePayload)
        : ((request.body ?? {}) as RecipeImagePayload);
    const { recipeName, ingredients } = parsePayload(payload);

    if (!recipeName) {
      return response.status(400).json({
        error: "recipeName es obligatorio para generar la imagen.",
      });
    }

    const prompt = buildRecipeImagePrompt(recipeName, ingredients);
    const fluxResult = await requestFluxImage({
      token,
      prompt,
      timeoutMs: 60000,
    });

    if (!fluxResult.ok) {
      console.error("[HF FLUX] image generation failed", {
        kind: fluxResult.kind,
        status: fluxResult.status,
        message: fluxResult.message,
        details: fluxResult.details,
      });
      return response.status(fluxResult.status).json({
        error: fluxResult.message,
        diagnosticKind: fluxResult.kind,
        details: fluxResult.details,
        fallbackUrl: "/recipes/fallback.jpg",
      });
    }

    const imageArrayBuffer = fluxResult.imageBuffer;
    const contentType = fluxResult.contentType;

    return response.status(200).json({
      imageUrl: toBase64DataUrl(imageArrayBuffer, contentType),
      prompt,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error inesperado al generar la imagen.";
    return response.status(500).json({ error: message });
  }
}
