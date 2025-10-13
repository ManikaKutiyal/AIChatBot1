import { useState, useCallback } from 'react';

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash-preview-05-20';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

export function useGeminiAPI() {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWithRetry = useCallback(async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, options);
        if (res.ok) return res;
        if (res.status === 429 || res.status >= 500) {
          if (i < retries - 1) {
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        const errorBody = await res.json();
        throw new Error(errorBody.error?.message || `API request failed with status ${res.status}`);
      } catch (err) {
        if (i === retries - 1) throw err;
      }
    }
    throw new Error("Failed to fetch content after multiple retries.");
  }, []);

  const generateContent = useCallback(async (prompt) => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResponse('');
    setError(null);

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ "google_search": {} }],
    };

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };

    try {
      const res = await fetchWithRetry(API_URL, options);
      const result = await res.json();
      const candidate = result.candidates?.[0];

      if (candidate && candidate.content?.parts?.[0]?.text) {
        let generatedText = candidate.content.parts[0].text;

        // Extract sources
        let sources = [];
        const groundingMetadata = candidate.groundingMetadata;
        if (groundingMetadata && groundingMetadata.groundingAttributions) {
          sources = groundingMetadata.groundingAttributions
            .map(attribution => ({
              uri: attribution.web?.uri,
              title: attribution.web?.title,
            }))
            .filter(s => s.uri && s.title);
        }

        if (sources.length > 0) {
          const sourceList = sources.map((s, i) => `${i + 1}. [${s.title}](${s.uri})`).join('\n');
          generatedText += `\n\n---\n**Sources:**\n${sourceList}`;
        }

        setResponse(generatedText);
      } else {
        setError("AI response was blocked or empty. Try a different prompt.");
      }
    } catch (err) {
      setError(`Error: ${err.message || 'Failed to communicate with the AI model.'}`);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithRetry]);

  return { response, isLoading, error, generateContent };
}
