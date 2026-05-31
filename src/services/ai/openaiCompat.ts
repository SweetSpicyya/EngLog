export async function checkOpenAICompat(baseUrl: string, apiKey: string): Promise<boolean> {
  const res = await fetch(`${baseUrl}/models`, {
    headers: { Authorization: 'Bearer ' + apiKey },
  });
  return res.ok;
}

export async function callOpenAICompat(
  baseUrl: string,
  model: string,
  apiKey: string,
  system: string,
  user: string,
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}
