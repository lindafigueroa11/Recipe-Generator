const BASE_PROMPT =
  "Realistic food photography of [RECIPE_NAME], made with [INGREDIENTS], served on a white ceramic plate, warm natural light, elegant minimal kitchen background, shallow depth of field, appetizing, high detail, no text, no watermark";

const sanitizeSegment = (value: string) =>
  value.replace(/[^\w\s,.-]/g, "").replace(/\s+/g, " ").trim();

export const buildRecipeImagePrompt = (
  recipeName: string,
  ingredients: string[]
): string => {
  const safeRecipeName = sanitizeSegment(recipeName) || "homemade recipe";
  const safeIngredients = ingredients
    .map((ingredient) => sanitizeSegment(ingredient))
    .filter(Boolean)
    .slice(0, 8);

  const ingredientsText = safeIngredients.length
    ? safeIngredients.join(", ")
    : "fresh seasonal ingredients";

  return BASE_PROMPT.replace("[RECIPE_NAME]", safeRecipeName).replace(
    "[INGREDIENTS]",
    ingredientsText
  );
};
