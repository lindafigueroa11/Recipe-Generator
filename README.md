# Recipe AI (Vite + React)

![Recipe AI Preview](docs/images/recipe-ai-preview.png)

## Generacion de imagenes con Hugging Face (FLUX.1 Schnell)

Este proyecto usa Vite (frontend) y una funcion serverless en `api/` para no exponer el token.

Modelo integrado:
- `black-forest-labs/FLUX.1-schnell`

Endpoint interno:
- `POST /api/generate-recipe-image`
- `POST /api/generate-recipe-image-diagnostic`

### Variables de entorno

1. Copia `.env.example` a `.env`.
2. Define tu token:

```bash
HF_TOKEN=mi_token_aqui
```

### Seguridad

- El frontend nunca usa el token de Hugging Face.
- El token se lee solo en el backend serverless (`process.env.HF_TOKEN`).

### Request del endpoint

```json
{
  "recipeName": "Creamy chicken pasta",
  "ingredients": ["pasta", "chicken", "tomato", "cream"]
}
```

### Respuesta esperada

```json
{
  "imageUrl": "data:image/jpeg;base64,...",
  "prompt": "Realistic food photography of ..."
}
```

### Diagnostico rapido

Endpoint:
- `POST /api/generate-recipe-image-diagnostic`

Responde claramente si:
- Hugging Face devolvio imagen (`diagnostic: "image_ok"`)
- devolvio JSON/texto de error (`diagnostic: "response_not_image"` o `upstream_error`)
- falta token (`diagnostic: "token_missing"`)
- el modelo requiere aceptar terminos (`diagnostic: "model_terms_required"`)
- el proveedor no soporta el modelo (`diagnostic: "provider_not_supported"`)

### Nota sobre Vite

Como este proyecto no es Next.js, se usa una funcion serverless compatible con Vercel (`api/generate-recipe-image.ts`).

Para desarrollo local del frontend + endpoint:
- Usa `vercel dev` si quieres ejecutar ambos en local con el path `/api/...`.

Si no usas Vercel, necesitas un backend propio o serverless equivalente (Netlify Functions, AWS Lambda, etc.) y luego apuntar el frontend a ese endpoint interno.
