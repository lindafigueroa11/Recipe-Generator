import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data"; 
import type { Schema } from "../amplify/data/resource";
import outputs from "../amplify_outputs.json";
import type { RecipeData } from "./types/recipe";
import { generateRecipeImage as requestRecipeImage } from "./services/recipeImage";
import chefHatIcon from "./assets/recipe-ai/icons/chef-hat.svg";
import sparklesIcon from "./assets/recipe-ai/icons/sparkles.svg";
import leafIcon from "./assets/recipe-ai/icons/leaf.svg";
import clockIcon from "./assets/recipe-ai/icons/clock.svg";
import usersIcon from "./assets/recipe-ai/icons/users.svg";
import zapIcon from "./assets/recipe-ai/icons/zap.svg";
import basketIcon from "./assets/recipe-ai/icons/basket.svg";

Amplify.configure(outputs);

const amplifyClient = generateClient<Schema>({
  authMode: "apiKey",
});

const QUICK_INGREDIENTS = [
  { label: "Pollo", emoji: "🍗" },
  { label: "Pasta", emoji: "🍝" },
  { label: "Huevo", emoji: "🥚" },
  { label: "Queso", emoji: "🧀" },
  { label: "Tomate", emoji: "🍅" },
];

const DEFAULT_RECIPE: RecipeData = {
  title: "Pasta cremosa con pollo y tomate",
  time: "25 min",
  servings: "2 porciones",
  difficulty: "Facil",
  ingredients: [
    "200 g de pasta",
    "1 pechuga de pollo",
    "1 tomate grande",
    "1 diente de ajo",
    "100 ml de crema de leche",
    "Queso parmesano al gusto",
    "Sal, pimienta y oregano",
  ],
  steps: [
    "Cocina la pasta segun las instrucciones del paquete.",
    "Corta el pollo en tiras, salpimienta y doralo en una sarten.",
    "Agrega ajo y tomate en cubos, y cocina por 3 o 4 minutos.",
    "Incorpora la crema y mezcla hasta que espese suavemente.",
    "Anade la pasta, mezcla y termina con queso al gusto.",
  ],
  tip: "Para mas sabor, agrega albahaca fresca al final y un toque de limon.",
};
const FALLBACK_RECIPE_IMAGE = "/recipes/fallback.jpg";
type ImageGenerationStatus = "idle" | "loading" | "success" | "error";

const normalizeForMatch = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const toTitleStyle = (value: string) =>
  value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const sanitizeRecipeTitle = (rawTitle: string): string => {
  const cleaned = rawTitle
    .replace(/^#{1,6}\s*/g, "")
    .replace(/[*_`~]/g, "")
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/^(titulo|título|title)\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return DEFAULT_RECIPE.title;
  }

  const lettersOnly = cleaned.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, "");
  const mostlyUppercase =
    lettersOnly.length > 0 && lettersOnly === lettersOnly.toUpperCase();

  return mostlyUppercase ? toTitleStyle(cleaned) : cleaned;
};

const estimatePreparationTime = (recipe: RecipeData): string => {
  const content = normalizeForMatch(
    `${recipe.title} ${recipe.steps.join(" ")} ${recipe.ingredients.join(" ")}`
  );

  const fastKeywords = ["ensalada", "salad", "batido", "smoothie", "sandwich", "tostada"];
  const slowKeywords = [
    "horno",
    "bake",
    "asado",
    "estofado",
    "lasagna",
    "lasaña",
    "guiso",
    "risotto",
  ];

  let minutes = 8 + recipe.steps.length * 4 + recipe.ingredients.length * 2;

  if (fastKeywords.some((keyword) => content.includes(keyword))) {
    minutes -= 8;
  }
  if (slowKeywords.some((keyword) => content.includes(keyword))) {
    minutes += 12;
  }
  if (recipe.steps.length >= 6) {
    minutes += 6;
  }

  const bounded = Math.min(90, Math.max(10, minutes));
  return `${Math.round(bounded)} min`;
};

const estimateServings = (recipe: RecipeData): string => {
  const content = normalizeForMatch(
    `${recipe.title} ${recipe.ingredients.join(" ")}`
  );
  const directMatch = content.match(/para\s+(\d+)\s+personas?/);
  if (directMatch?.[1]) {
    return `${directMatch[1]} porciones`;
  }

  if (recipe.ingredients.length <= 4) {
    return "2 porciones";
  }
  if (recipe.ingredients.length <= 7) {
    return "3 porciones";
  }
  if (recipe.ingredients.length <= 10) {
    return "4 porciones";
  }
  return "5 porciones";
};

const estimateDifficulty = (recipe: RecipeData): string => {
  const content = normalizeForMatch(
    `${recipe.title} ${recipe.steps.join(" ")} ${recipe.ingredients.join(" ")}`
  );

  let score = recipe.steps.length * 1.3 + recipe.ingredients.length * 0.55;

  const easyKeywords = ["ensalada", "salad", "sandwich", "batido", "smoothie"];
  const hardKeywords = [
    "horno",
    "risotto",
    "lasagna",
    "lasaña",
    "reducir",
    "caramelizar",
    "fermentar",
  ];

  if (easyKeywords.some((keyword) => content.includes(keyword))) {
    score -= 2.2;
  }
  if (hardKeywords.some((keyword) => content.includes(keyword))) {
    score += 2.5;
  }

  if (score >= 15) {
    return "Dificil";
  }
  if (score >= 10) {
    return "Intermedio";
  }
  return "Facil";
};

const isSpecificTime = (value: string) => /\d+\s*(min|mins|minutos?)/i.test(value);
const isSpecificServings = (value: string) => /\d+\s*(porciones?|personas?)/i.test(value);
const isSpecificDifficulty = (value: string) =>
  /^(facil|intermedio|medio|dificil)$/i.test(value.trim());

const normalizeRecipeMeta = (recipe: RecipeData): RecipeData => {
  const estimatedTime = estimatePreparationTime(recipe);
  const estimatedServings = estimateServings(recipe);
  const estimatedDifficulty = estimateDifficulty(recipe);

  return {
    ...recipe,
    time: isSpecificTime(recipe.time) ? recipe.time : estimatedTime,
    servings: isSpecificServings(recipe.servings)
      ? recipe.servings
      : estimatedServings,
    difficulty: isSpecificDifficulty(recipe.difficulty)
      ? recipe.difficulty
      : estimatedDifficulty,
  };
};

const buildLocalRecipe = (ingredients: string[]): RecipeData => {
  const baseName = ingredients.slice(0, 2).join(" y ");
  const title = baseName
    ? `Salteado cremoso de ${baseName}`
    : "Receta rapida casera";

  const normalizedIngredients = ingredients.length
    ? ingredients.map((item) => item)
    : ["verduras de temporada", "proteina al gusto"];

  return {
    title: sanitizeRecipeTitle(title),
    time: "",
    servings: "",
    difficulty: "",
    ingredients: [...normalizedIngredients, "sal y pimienta al gusto", "aceite de oliva"],
    steps: [
      "Lava, corta y prepara todos los ingredientes.",
      "Cocina primero los ingredientes mas firmes a fuego medio.",
      "Agrega el resto, sazona y mezcla durante 5 a 8 minutos.",
      "Prueba y ajusta condimentos antes de servir.",
    ],
    tip: "Finaliza con hierbas frescas y unas gotas de citrico para realzar el sabor.",
  };
};

const parseRecipeFromBody = (
  body: string,
  requestedIngredients: string[]
): RecipeData | null => {
  const cleanBody = body
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleanBody) as Partial<RecipeData>;
    if (!parsed.title || !Array.isArray(parsed.ingredients) || !Array.isArray(parsed.steps)) {
      return null;
    }
    return {
      title: sanitizeRecipeTitle(parsed.title),
      time: parsed.time || "25 min",
      servings: parsed.servings || "2 porciones",
      difficulty: parsed.difficulty || "Facil",
      ingredients:
        parsed.ingredients.filter(Boolean).length > 0
          ? parsed.ingredients.filter(Boolean)
          : requestedIngredients,
      steps: parsed.steps.filter(Boolean),
      tip: parsed.tip || "Agrega hierbas frescas al final para mayor aroma.",
    };
  } catch {
    const lines = body
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 4) {
      return null;
    }

    const ingredientHeaderIndex = lines.findIndex((line) =>
      /^ingredientes:?$/i.test(line)
    );
    const stepsHeaderIndex = lines.findIndex((line) =>
      /^(pasos|preparaci[oó]n):?$/i.test(line)
    );

    const rawIngredientLines =
      ingredientHeaderIndex >= 0
        ? lines.slice(
            ingredientHeaderIndex + 1,
            stepsHeaderIndex > ingredientHeaderIndex ? stepsHeaderIndex : undefined
          )
        : [];

    const ingredientsSection = rawIngredientLines
      .map((line) => line.replace(/^[-*•]\s+/, "").trim())
      .filter(Boolean);

    const rawStepLines =
      stepsHeaderIndex >= 0
        ? lines.slice(stepsHeaderIndex + 1)
        : lines.filter((line) => /^\d+[).\s]/.test(line));

    const parsedSteps = rawStepLines
      .map((line) => line.replace(/^\d+[).\s]+/, "").trim())
      .filter(Boolean);

    const dynamicIngredients =
      ingredientsSection.length > 0 ? ingredientsSection : requestedIngredients;

    const dynamicSteps = parsedSteps.length > 0 ? parsedSteps : lines.slice(1, 6);

    return {
      ...DEFAULT_RECIPE,
      title: sanitizeRecipeTitle(lines[0] || DEFAULT_RECIPE.title),
      ingredients: dynamicIngredients.length > 0 ? dynamicIngredients : DEFAULT_RECIPE.ingredients,
      steps: dynamicSteps,
    };
  }
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
  const [recipe, setRecipe] = useState<RecipeData | null>(DEFAULT_RECIPE);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [ingredientsText, setIngredientsText] = useState("");
  const [recipeImageUrl, setRecipeImageUrl] = useState(FALLBACK_RECIPE_IMAGE);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imageStatus, setImageStatus] = useState<ImageGenerationStatus>("idle");

  const recipePanelData = useMemo(() => recipe ?? DEFAULT_RECIPE, [recipe]);

  const appendIngredient = (value: string) => {
    setIngredientsText((previous) => (previous ? `${previous}, ${value}` : value));
  };

  const updateRecipeImage = async (nextRecipe: RecipeData) => {
    setImageError("");
    setImageLoading(true);
    setImageStatus("loading");

    try {
      const { imageUrl } = await requestRecipeImage({
        recipeName: nextRecipe.title,
        ingredients: nextRecipe.ingredients.slice(0, 8),
      });
      setRecipeImageUrl(imageUrl);
      setImageStatus("success");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo generar la imagen con FLUX.";
      setImageError(`${message} Se uso una imagen fallback.`);
      setRecipeImageUrl(FALLBACK_RECIPE_IMAGE);
      setImageStatus("error");
    } finally {
      setImageLoading(false);
    }
  };

  const applyRecipeResult = (nextRecipe: RecipeData) => {
    const cleanedRecipe: RecipeData = {
      ...nextRecipe,
      title: sanitizeRecipeTitle(nextRecipe.title),
    };
    const normalizedRecipe = normalizeRecipeMeta(cleanedRecipe);
    setRecipe(normalizedRecipe);
    void updateRecipeImage(normalizedRecipe);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setRecipe(null);

    const rawIngredients = ingredientsText.trim();
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
        applyRecipeResult(buildLocalRecipe(ingredients));
        setErrorMessage(
          "El backend no esta disponible ahora. Te mostramos una receta local para que puedas continuar."
        );
        if (firstErrorMessage) {
          console.warn(getFriendlyErrorMessage(firstErrorMessage));
        }
        return;
      }

      if (data?.recipe) {
        const apiIngredients = data.recipe.ingredients?.filter(Boolean) ?? [];
        const dynamicIngredients =
          apiIngredients.length > 0 ? apiIngredients : ingredients;

        applyRecipeResult({
          title: sanitizeRecipeTitle(data.recipe.title || DEFAULT_RECIPE.title),
          time: data.recipe.time || DEFAULT_RECIPE.time,
          servings: data.recipe.servings || DEFAULT_RECIPE.servings,
          difficulty: data.recipe.difficulty || DEFAULT_RECIPE.difficulty,
          ingredients:
            dynamicIngredients.length > 0
              ? dynamicIngredients
              : DEFAULT_RECIPE.ingredients,
          steps: data.recipe.steps?.filter(Boolean) || DEFAULT_RECIPE.steps,
          tip: data.recipe.tip || DEFAULT_RECIPE.tip,
        });
        return;
      }

      if (!data?.body) {
        setErrorMessage("La IA no devolvió una receta. Prueba con otros ingredientes.");
        applyRecipeResult(buildLocalRecipe(ingredients));
        return;
      }

      const parsedBodyRecipe = parseRecipeFromBody(data.body, ingredients);
      if (!parsedBodyRecipe) {
        setErrorMessage(
          "La IA respondio en un formato distinto. Te mostramos una receta local."
        );
        applyRecipeResult(buildLocalRecipe(ingredients));
        return;
      }

      applyRecipeResult(parsedBodyRecipe);
    } catch (e) {
      console.error(e);
      applyRecipeResult(buildLocalRecipe(ingredients));
      setErrorMessage(
        "No se pudo conectar al backend. Te mostramos una receta local temporal."
      );
      console.warn(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="recipe-ai-page">
      <nav className="top-nav glass-card">
        <div className="brand">
          <span className="brand-icon">
            <img src={chefHatIcon} alt="" />
          </span>
          <span className="brand-text">Recipe AI</span>
        </div>
        <div className="nav-links">
          <span className="nav-link nav-link-active">Inicio</span>
          <span className="nav-link">Mis recetas</span>
          <span className="nav-link">Favoritos</span>
        </div>
        <div className="user-chip">Maria</div>
      </nav>

      <section className="hero">
        <div className="hero-badge">
          <img src={sparklesIcon} alt="" />
          <span>Powered by AI</span>
        </div>
        <h1 className="hero-title">
          Cocina inteligente
          <br />
          <em>con lo que ya tienes</em>
        </h1>
        <p className="hero-description">
          Escribe tus ingredientes y recibe al instante una receta personalizada
          creada por nuestra IA.
        </p>
      </section>

      <section className="content-grid">
        <article className="glass-card input-card">
          <h2 className="card-title">1. Cuentanos que tienes</h2>
          <form onSubmit={onSubmit} className="form-container">
            <label htmlFor="ingredients" className="input-label">
              Escribe los ingredientes que tienes en casa
            </label>
            <div className="textarea-wrap">
              <textarea
                className="ingredient-textarea input-field"
                id="ingredients"
                name="ingredients"
                value={ingredientsText}
                onChange={(event) => setIngredientsText(event.target.value)}
                placeholder="Ejemplo: aguacate, tomate, cebolla"
              />
              <img className="leaf-icon" src={leafIcon} alt="" />
            </div>
            <p className="quick-label">O elige algunos ingredientes rapidos:</p>
            <div className="quick-chips">
              {QUICK_INGREDIENTS.map((ingredient) => (
                <button
                  key={ingredient.label}
                  type="button"
                  className="chip"
                  onClick={() => appendIngredient(ingredient.label)}
                >
                  <span>{ingredient.emoji}</span>
                  <span>{ingredient.label}</span>
                </button>
              ))}
            </div>
            <button type="submit" className="primary-button generate-button">
              Generar receta
              <span aria-hidden="true">→</span>
            </button>
          </form>
          <p className="privacy-note">100% privado. Solo tu ves tus recetas.</p>
          {errorMessage && <p className="status-message">{errorMessage}</p>}
        </article>

        <article className="glass-card recipe-card">
          <div className="recipe-header">
            <h2 className="card-title recipe-header-title">
              <img src={sparklesIcon} alt="" />
              <span>Tu receta personalizada</span>
            </h2>
            <span className="generated-chip">Generada por AI</span>
          </div>

          {loading ? (
            <div className="loading-panel">
              <p>Cocinando ideas...</p>
              <div className="loading-bars">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : (
            <>
              <div className="recipe-main">
                <div className="dish-image">
                  <img
                    className="dish-photo"
                    src={recipeImageUrl}
                    alt={`Imagen de ${recipePanelData.title}`}
                    onError={() => setRecipeImageUrl(FALLBACK_RECIPE_IMAGE)}
                  />
                  {imageLoading && (
                    <div className="dish-image-overlay">Generando imagen con FLUX...</div>
                  )}
                </div>
                <div className="recipe-info">
                  <h3>{recipePanelData.title}</h3>
                  <div className="meta-chips">
                    <span className="meta-chip">
                      <img src={clockIcon} alt="" />
                      {recipePanelData.time}
                    </span>
                    <span className="meta-chip">
                      <img src={usersIcon} alt="" />
                      {recipePanelData.servings}
                    </span>
                    <span className="meta-chip">
                      <img src={zapIcon} alt="" />
                      {recipePanelData.difficulty}
                    </span>
                  </div>
                  <div className="image-controls">
                    <button
                      type="button"
                      className="regenerate-image-button"
                      onClick={() => void updateRecipeImage(recipePanelData)}
                      disabled={imageLoading}
                    >
                      {imageLoading ? "Generando..." : "Regenerar imagen"}
                    </button>
                    {imageStatus === "success" && (
                      <span className="image-success-text">
                        Imagen generada con FLUX.1 Schnell.
                      </span>
                    )}
                    {imageError && <span className="image-error-text">{imageError}</span>}
                  </div>
                </div>
              </div>

              <div className="recipe-details">
                <div>
                  <h4>Ingredientes</h4>
                  <ul>
                    {recipePanelData.ingredients.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Preparacion</h4>
                  <ol>
                    {recipePanelData.steps.map((step, index) => (
                      <li key={`${step}-${index}`}>
                        <span>{index + 1}</span>
                        <p>{step}</p>
                      </li>
                    ))}
                  </ol>
                  <div className="tip-box">
                    <strong>Consejo del chef:</strong> {recipePanelData.tip}
                  </div>
                </div>
              </div>
            </>
          )}
        </article>
      </section>

      <section className="features-row glass-card">
        <article className="feature-item">
          <span className="feature-icon">
            <img src={zapIcon} alt="" />
          </span>
          <div>
            <h3>Rapido</h3>
            <p>Recetas listas en segundos para tu dia a dia.</p>
          </div>
        </article>
        <article className="feature-item">
          <span className="feature-icon">
            <img src={usersIcon} alt="" />
          </span>
          <div>
            <h3>Personalizado</h3>
            <p>La IA crea recetas a tu gusto con lo que tienes.</p>
          </div>
        </article>
        <article className="feature-item">
          <span className="feature-icon">
            <img src={basketIcon} alt="" />
          </span>
          <div>
            <h3>Con lo que tienes</h3>
            <p>Aprovecha tus ingredientes y reduce el desperdicio.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
export default App;