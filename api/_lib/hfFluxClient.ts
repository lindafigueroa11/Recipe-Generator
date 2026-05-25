const HF_MODEL_URL =
  "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

export type FluxFailureKind =
  | "token_missing"
  | "timeout"
  | "network_error"
  | "response_not_image"
  | "model_terms_required"
  | "provider_not_supported"
  | "unauthorized"
  | "upstream_error";

type FluxSuccess = {
  ok: true;
  status: number;
  contentType: string;
  imageBuffer: ArrayBuffer;
};

type FluxFailure = {
  ok: false;
  status: number;
  kind: FluxFailureKind;
  message: string;
  details?: string;
  contentType?: string;
};

export type FluxResult = FluxSuccess | FluxFailure;

const toLowerText = (value: string) => value.toLowerCase();

const classifyFailure = (status: number, details: string): FluxFailureKind => {
  const normalized = toLowerText(details);

  if (status === 401 || status === 403 || normalized.includes("invalid token")) {
    return "unauthorized";
  }
  if (
    normalized.includes("accept") &&
    (normalized.includes("terms") || normalized.includes("gated"))
  ) {
    return "model_terms_required";
  }
  if (
    normalized.includes("provider") &&
    (normalized.includes("not supported") || normalized.includes("unsupported"))
  ) {
    return "provider_not_supported";
  }
  return "upstream_error";
};

export const requestFluxImage = async ({
  token,
  prompt,
  timeoutMs = 60000,
}: {
  token?: string;
  prompt: string;
  timeoutMs?: number;
}): Promise<FluxResult> => {
  if (!token) {
    return {
      ok: false,
      status: 500,
      kind: "token_missing",
      message:
        "HF_TOKEN no esta configurado en el servidor. Crea la variable de entorno antes de generar imagenes.",
    };
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const hfResponse = await fetch(HF_MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "image/png",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width: 1024,
          height: 768,
          guidance_scale: 3.5,
          num_inference_steps: 4,
        },
      }),
      signal: abortController.signal,
    });

    const contentType = hfResponse.headers.get("content-type") ?? "unknown";
    console.info("[HF FLUX] response", {
      status: hfResponse.status,
      contentType,
      endpoint: HF_MODEL_URL,
    });

    if (hfResponse.ok && contentType.startsWith("image/")) {
      return {
        ok: true,
        status: hfResponse.status,
        contentType,
        imageBuffer: await hfResponse.arrayBuffer(),
      };
    }

    const details = await hfResponse.text();
    if (hfResponse.ok) {
      return {
        ok: false,
        status: hfResponse.status,
        kind: "response_not_image",
        message:
          "Hugging Face respondio sin imagen (texto/json). Revisa el detalle de respuesta.",
        details,
        contentType,
      };
    }

    return {
      ok: false,
      status: hfResponse.status,
      kind: classifyFailure(hfResponse.status, details),
      message: "Hugging Face devolvio un error al generar la imagen.",
      details,
      contentType,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        status: 504,
        kind: "timeout",
        message: "Timeout esperando respuesta de Hugging Face.",
      };
    }

    return {
      ok: false,
      status: 502,
      kind: "network_error",
      message:
        error instanceof Error
          ? `Error de red al conectar con Hugging Face: ${error.message}`
          : "Error de red al conectar con Hugging Face.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
};
