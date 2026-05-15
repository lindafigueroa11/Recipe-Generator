import { useState } from "react";
import type { FormEvent } from "react";
import { Loader, Placeholder } from "@aws-amplify/ui-react";
import "./App.css";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data"; 
import type { Schema } from "../amplify/data/resource";
import outputs from "../amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const amplifyClient = generateClient<Schema>({
  authMode: "apiKey",
});

const buildLocalRecipe = (ingredients: string[]) => {
  const titleBase = ingredients.slice(0, 2).join(" y ");
  const title = titleBase ? `Receta rapida de ${titleBase}` : "Receta rapida casera";
  const ingredientList = ingredients.map((item) => `- ${item}`).join("\n");

  return [
    title,
    "",
    "Ingredientes:",
    ingredientList,
    "- sal y pimienta al gusto",
    "- aceite de oliva (opcional)",
    "",
    "Pasos:",
    "1. Lava, corta y prepara todos los ingredientes.",
    "2. Cocina primero los ingredientes mas firmes a fuego medio.",
    "3. Agrega el resto, sazona y mezcla durante 5-8 minutos.",
    "4. Ajusta sal y pimienta, sirve caliente y disfruta.",
  ].join("\n");
};

const getFriendlyErrorMessage = (error: unknown) => {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: string }).message ?? "");
    if (message) {
      if (message.includes("User is not authenticated")) {
        return "No hay una sesion activa. La app esta en modo publico; recarga la pagina e intenta de nuevo.";
      }
      if (message.includes("Not Authorized")) {
        return "La API no permite acceso publico todavia. Despliega los cambios de Amplify para habilitarlo.";
      }
      if (message.includes("Network")) {
        return "Error de red. Verifica tu conexion e intenta nuevamente.";
      }
      if (message.includes("Unknown error")) {
        return "El backend de Amplify no esta listo. Ejecuta 'npx ampx sandbox --once --profile amplify-fresh2' despues de bootstrapear la region.";
      }
      if (message.includes("404")) {
        return "La API GraphQL no existe o fue eliminada. Vuelve a desplegar con 'npx ampx sandbox --once --profile amplify-fresh2'.";
      }
      return message;
    }
  }

  return "Ocurrio un error inesperado al generar la receta. Intenta nuevamente.";
};

function App() {
  const [result, setResult] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setResult("");

    const formData = new FormData(event.currentTarget);
    const rawIngredients = formData.get("ingredients")?.toString().trim() ?? "";
    const ingredients = rawIngredients
      .split(",")
      .map((ingredient) => ingredient.trim())
      .filter(Boolean);

    if (ingredients.length === 0) {
      setErrorMessage("Ingresa al menos un ingrediente para generar una receta.");
      return;
    }

    if (ingredients.length > 20) {
      setErrorMessage("Puedes ingresar hasta 20 ingredientes.");
      return;
    }

    if (ingredients.some((ingredient) => ingredient.length > 60)) {
      setErrorMessage("Cada ingrediente debe tener 60 caracteres o menos.");
      return;
    }

    if (ingredients.some((ingredient) => /[<>`$\\{}]/.test(ingredient))) {
      setErrorMessage("Algunos ingredientes contienen caracteres no permitidos.");
      return;
    }

    setLoading(true);

    try {
      const { data, errors } = await amplifyClient.queries.askBedrock({
        ingredients,
      });

      if (errors?.length) {
        console.error(errors);
        const firstErrorMessage = errors[0]?.message;
        setResult(buildLocalRecipe(ingredients));
        setErrorMessage(
          "El backend no esta disponible ahora. Te mostramos una receta local para que puedas continuar."
        );
        if (firstErrorMessage) {
          console.warn(getFriendlyErrorMessage(firstErrorMessage));
        }
        return;
      }

      if (!data?.body) {
        setErrorMessage("La IA no devolvió una receta. Prueba con otros ingredientes.");
        return;
      }

      setResult(data.body);
    } catch (e) {
      console.error(e);
      setResult(buildLocalRecipe(ingredients));
      setErrorMessage(
        "No se pudo conectar al backend. Te mostramos una receta local temporal."
      );
      console.warn(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="app-container">
      <div className="header-container">
        <h1 className="main-header">
          Tu asistente de cocina
          <br />
          <span className="highlight">Recipe AI</span>
        </h1>
        <p className="description">
          Escribe tus ingredientes separados por comas y te proponemos una
          receta al instante.
        </p>
      </div>

      <div className="layout-grid">
        <div className="form-panel">
          <form onSubmit={onSubmit} className="form-container">
            <label htmlFor="ingredients" className="input-label">
              Ingredientes
            </label>
            <div className="search-container">
              <input
                type="text"
                className="wide-input"
                id="ingredients"
                name="ingredients"
                placeholder="Ejemplo: aguacate, tomate, cebolla"
              />
              <button type="submit" className="search-button">
                Generar receta
              </button>
            </div>
          </form>

          {errorMessage && <p className="status-message">{errorMessage}</p>}
        </div>

        <div className="recipe-panel">
          <h2 className="recipe-title">Receta sugerida</h2>
          {loading ? (
            <div className="loader-container">
              <p className="loading-text">Cocinando ideas...</p>
              <Loader size="large" />
              <Placeholder size="large" />
              <Placeholder size="large" />
              <Placeholder size="large" />
            </div>
          ) : result ? (
            <pre className="result">{result}</pre>
          ) : (
            <p className="empty-state">
              Tu receta aparecera aqui a la derecha.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
export default App;