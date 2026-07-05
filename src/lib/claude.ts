export async function fetchFileContent(
  owner: string,
  repo: string,
  filePath: string,
): Promise<string> {
  const response = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${filePath}`,
  );

  if (!response.ok) {
    throw new Error(`Could not fetch file: ${response.status}`);
  }

  const text = await response.text();

  // Truncate to 6000 chars to stay within context window
  if (text.length > 6000) {
    return text.slice(0, 6000) + "\n\n... [truncated]";
  }

  return text;
}

export async function streamFileExplanation(
  fileName: string,
  fileContent: string,
  onChunk: (text: string) => void,
  onDone: () => void,
): Promise<void> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      stream: true,
      messages: [
        {
          role: "user",
          content: `You are analyzing a file called "${fileName}" from a software project.

Here is the file content:
\`\`\`
${fileContent}
\`\`\`

Explain what this file does in exactly 3 bullet points. Each bullet point should:
- Start with a bold keyword (e.g. **Purpose:**, **Key function:**, **Dependencies:**)
- Be one clear sentence
- Be technical but understandable

No intro sentence. No conclusion. Just 3 bullets.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const text = parsed?.delta?.text;
          if (text) onChunk(text);
        } catch {
          // skip malformed chunks
        }
      }
    }
  }

  onDone();
}
