require("dotenv").config();
const OpenAIApi = require("openai");

const openai = new OpenAIApi({ apiKey: process.env.OPENAI_API_KEY });

async function runTicketClassification(comment, categories) {
  const messages = [
    {
      role: "user",
      content:
        "Your task is to classify the ticket comment sent in the next message into predefined categories. You will then provide the classification and a summary of the reasoning. If none of the categories closely match, then the 'unknown'",
    },
    {
      role: "user",
      content: `Please classify the following ticket comment: "${comment}", using one of the following categories: "${categories}"`,
    },
  ];
  const tools = [
    {
      type: "function",
      function: {
        name: "classify_comment",
        description:
          "Takes the output of a ticket classification model and returns the category and summary of the classification reasoning.",
        parameters: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "A single sentence summary of the classification reasoning",
            },
            category: {
              type: "string",
              description:
                "The ticket category that most closely matches the comment",
            },
          },
          required: ["summary", "category"],
        },
      },
    },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages,
    tools: tools,
    tool_choice: "auto",
  });
  const responseMessage = response.choices[0].message;

  // Check if a function was called and handle the response
  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    // find classify_comment function
    const toolCall = responseMessage.tool_calls.find((tool) => tool.function.name === 'classify_comment');
    if (!toolCall) {
        return {
            category: "unknown",
            summary: "OpenAI did not call the classification function.",
        };
    }
    const result = JSON.parse(toolCall.function.arguments);
    console.log(result);
    return {
        category: result.category,
        summary: result.summary,
    };
}

  // Handle cases where no function call was made
  return {
    category: "unknown",
    summary: "OpenAI did not call the classification function.",
  };
}

// Example usage, remember to replace the categories with actual data from your application
runTicketClassification("I love eating apples every day.", [
  "apple",
  "banana",
])
  .then(console.log)
  .catch(console.error);
