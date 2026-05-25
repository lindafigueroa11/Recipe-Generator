type GenerateRecipeImageRequest = {
  recipeName: string;
  ingredients: string[];
};

type GenerateRecipeImageResponse = {
  imageUrl: string;
  prompt?: string;
  error?: string;
};

const parseJsonSafely = async <T>(response: Response): Promise<T | null> => {
  const rawBody = await response.text();
  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    return null;
  }
};

export const generateRecipeImage = async ({
  recipeName,
  ingredients,
}: GenerateRecipeImageRequest): Promise<GenerateRecipeImageResponse> => {
  const response = await fetch("/api/generate-recipe-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipeName, ingredients }),
  });

  const data = await parseJsonSafely<GenerateRecipeImageResponse>(response);

  if (!response.ok) {
    const endpointHint =
      response.status === 404
        ? "Verifica que el endpoint /api/generate-recipe-image este disponible (por ejemplo con vercel dev o en deploy)."
        : "";
    throw new Error(
      data?.error ||
        `No se pudo generar la imagen de la receta (HTTP ${response.status}). ${endpointHint}`.trim()
    );
  }

  if (!data?.imageUrl) {
    throw new Error(
      "La respuesta del servidor no incluyo una imagen valida. Se usara fallback."
    );
  }

  return data;
};
