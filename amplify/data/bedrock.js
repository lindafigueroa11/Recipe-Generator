export function request(ctx) {
  var args = ctx && ctx.args ? ctx.args : {};
  var ingredients = Array.isArray(args.ingredients) ? args.ingredients : [];
  var prompt =
    "Suggest one original recipe based on these ingredients: " +
    ingredients.join(", ") +
    ". Return only title, ingredients list and numbered steps.";

  return {
    version: "2018-05-29",
    resourcePath: "/model/anthropic.claude-3-sonnet-20240229-v1:0/invoke",
    method: "POST",
    params: {
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: prompt }]
          }
        ]
      })
    }
  };
}

export function response(ctx) {
  if (ctx.error) {
    return {
      error: "Bedrock invocation failed: " + ctx.error.message
    };
  }

  if (!ctx.result || !ctx.result.body) {
    return {
      error: "Empty response from Bedrock."
    };
  }

  var parsedBody = JSON.parse(ctx.result.body);
  var content = parsedBody && Array.isArray(parsedBody.content) ? parsedBody.content : [];
  var generatedText = "";
  var i;

  for (i = 0; i < content.length; i += 1) {
    var block = content[i];
    if (block && block.type === "text" && typeof block.text === "string") {
      generatedText = block.text;
      break;
    }
  }

  if (!generatedText) {
    return {
      error: "Bedrock response did not include generated text."
    };
  }

  return { body: generatedText.trim() };
}