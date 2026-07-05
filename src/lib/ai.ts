export async function fetchFileContent(
  owner: string,
  repo: string,
  filePath: string,
): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
    { headers: { Accept: "application/vnd.github.v3.raw" } }
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
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    onChunk("Error: NEXT_PUBLIC_GEMINI_API_KEY is not set in .env.local");
    onDone();
    return;
  }

  const prompt = `You are analyzing a file called "${fileName}" from a software project.

Here is the file content:
\`\`\`
${fileContent}
\`\`\`

Explain what this file does in exactly 3 bullet points. Each bullet point should:
- Start with a bold keyword (e.g. **Purpose:**, **Key function:**, **Dependencies:**)
- Be one clear sentence
- Be technical but understandable

No intro sentence. No conclusion. Just 3 bullets.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1000 },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
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
        if (!data) continue;
        try {
          const parsed = JSON.parse(data);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) onChunk(text);
        } catch {
          // skip malformed chunks
        }
      }
    }
  }

  onDone();
}
