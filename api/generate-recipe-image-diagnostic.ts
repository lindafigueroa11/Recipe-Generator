import { buildRecipeImagePrompt } from "./_lib/buildRecipeImagePrompt";
import { requestFluxImage } from "./_lib/hfFluxClient";

type DiagnosticRequest = {
  method?: string;
  body?: unknown;
};

type DiagnosticResponse = {
  status: (statusCode: number) => {
    json: (payload: unknown) => unknown;
  };
};

type DiagnosticPayload = {
  recipeName?: string;
  ingredients?: string[];
};

const parsePayload = (payload: DiagnosticPayload) => {
  const recipeName = (payload.recipeName ?? "Test recipe").toString().trim();
  const ingredients = Array.isArray(payload.ingredients)
    ? payload.ingredients
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .slice(0, 10)
    : ["tomato", "pasta", "olive oil"];

  return { recipeName, ingredients };
};

export default async function handler(
  request: DiagnosticRequest,
  response: DiagnosticResponse
) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed." });
  }

  const token = process.env.HF_TOKEN;
  if (!token) {
    return response.status(500).json({
      diagnostic: "token_missing",
      tokenPresent: false,
      message: "HF_TOKEN no esta configurado.",
    });
  }

  try {
    const payload =
      typeof request.body === "string"
        ? (JSON.parse(request.body) as DiagnosticPayload)
        : ((request.body ?? {}) as DiagnosticPayload);
    const { recipeName, ingredients } = parsePayload(payload);
    const prompt = buildRecipeImagePrompt(recipeName, ingredients);

    const fluxResult = await requestFluxImage({
      token,
      prompt,
      timeoutMs: 45000,
    });

    if (fluxResult.ok) {
      return response.status(200).json({
        diagnostic: "image_ok",
        message: "Hugging Face devolvio una imagen correctamente.",
        httpStatus: fluxResult.status,
        contentType: fluxResult.contentType,
        imageBytes: fluxResult.imageBuffer.byteLength,
      });
    }

    return response.status(fluxResult.status).json({
      diagnostic: fluxResult.kind,
      message: fluxResult.message,
      httpStatus: fluxResult.status,
      contentType: fluxResult.contentType ?? null,
      providerSupportsModel: fluxResult.kind !== "provider_not_supported",
      modelRequiresTerms: fluxResult.kind === "model_terms_required",
      tokenPresent: true,
      upstreamDetails: fluxResult.details ?? null,
    });
  } catch (error) {
    return response.status(500).json({
      diagnostic: "unexpected_error",
      message:
        error instanceof Error
          ? error.message
          : "Error inesperado en diagnostico.",
    });
  }
}
