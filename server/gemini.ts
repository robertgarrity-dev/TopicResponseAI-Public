import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
const TOKEN_LIMIT = parseInt(process.env.GEMINI_TOKEN_LIMIT || "400", 10);

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: {
    maxOutputTokens: TOKEN_LIMIT, 
    temperature: 0.7    
  }
});

export async function generateContentSuggestions(topic: string, description: string): Promise<string> {
  try {
    const prompt = `Generate blog content suggestions for:
Topic: ${topic}
Context: ${description}

Please format your response exactly like this HTML template, maintaining all classes and structure:

<div class="suggestions">
  <h3>Key Points to Cover</h3>
  <ul class="detailed-list">
    <li><strong>Introduction to ${topic}:</strong> Provide a concise and engaging overview of what "${topic}" encompasses. Define its key characteristics and significance.</li>
    <li><strong>Exploring the Core Concepts:</strong> Break down the fundamental concepts related to ${topic}. Explain them in clear, accessible language, using examples and analogies where appropriate.</li>
    <li><strong>Practical Applications and Benefits:</strong> Discuss the practical applications of ${topic} and how it can be utilized in different scenarios. Highlight the potential benefits and advantages it offers.</li>
  </ul>
</div>

IMPORTANT FORMATTING RULES:
1. Use <strong> tags for titles/headers within bullet points, followed by a colon (:)
2. Always structure items in semantic lists (<ul> and <li>)
3. If response must be truncated due to token limits, add a warning div
4. Keep HTML structure clean and consistent
5. Do not add any CSS styles - the styling is handled by the frontend
6. Make sure each bullet point has a meaningful bolded title followed by detailed content

Example format:
<div class="suggestions">
  <ul class="detailed-list">
    <li><strong>Introduction to the Topic:</strong> Provide a concise and engaging overview of what the topic encompasses. Define its key characteristics and significance.</li>
    <li><strong>Key Strategies for Implementation:</strong> Outline effective approaches to implement the concepts discussed in the topic. Include practical steps and considerations.</li>
  </ul>
</div>

Always end your response with "<!--END-->" to detect truncation.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    // Remove HTML code block markers if present
    text = text.replace(/```html/g, '').replace(/```/g, '');

    // Function to extract warnings and return cleaned content
    const processContent = (content: string): { mainContent: string; warnings: string[] } => {
      const warnings: string[] = [];
      let mainContent = content;

      // Extract warning divs
      const warningRegex = /<div class="warning">.*?<\/div>/gs;
      const warningMatches = content.match(warningRegex);

      if (warningMatches) {
        warnings.push(...warningMatches);
        // Remove warnings from main content
        mainContent = content.replace(warningRegex, '');
      }

      // Also check for non-div warning messages
      const tokenLimitPatterns = [
        /⚠️.*?GEMINI_TOKEN_LIMIT.*?\./gs,
        /Warning:.*?GEMINI_TOKEN_LIMIT.*?\./gs,
        /Note:.*?token.*?limit.*?reached.*?\./gs,
        /Warning:.*?token.*?limit.*?reached.*?\./gs,
        /⚠️.*?token.*?limit.*?reached.*?\./gs
      ];

      tokenLimitPatterns.forEach(pattern => {
        const matches = mainContent.match(pattern);
        if (matches) {
          matches.forEach(match => {
            warnings.push(`<div class="warning">${match}</div>`);
            mainContent = mainContent.replace(match, '');
          });
        }
      });

      return { mainContent: mainContent.trim(), warnings };
    };

    // Process the content
    const { mainContent, warnings } = processContent(text);

    // Check if response is truncated (doesn't end with <!--END-->)
    if (!text.includes("<!--END-->")) {
      warnings.push(`<div class="warning">⚠️ Note: This is a limited overview due to the topic's scope and enforced limits.</div>`);
    }

    // Combine content with warnings at the end
    const finalContent = `<div class="suggestions">${mainContent}${warnings.length ? '\n' + warnings.join('\n') : ''}</div>`;

    // Remove the END marker and any trailing whitespace
    return finalContent.replace("<!--END-->", "").trim();
  } catch (error) {
    console.error("Error generating content suggestions:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate AI suggestions: ${error.message}`);
    }
    throw new Error("Failed to generate AI suggestions");
  }
}