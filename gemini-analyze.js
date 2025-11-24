// api/gemini-analyze.js

export default async function handler(req, res) {
  // CORS（先放宽，调通再说）
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Vary", "Origin");

  // 预检请求
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // 只允许 POST
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "Method not allowed, use POST /api/gemini-analyze" });
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res
        .status(400)
        .json({ error: "Missing prompt in request body" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Missing GEMINI_API_KEY on server" });
    }

    // 调用 Gemini API
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    "You are an educational stock analysis assistant. " +
                    "Answer in clear, simple English. Avoid giving direct investment advice; " +
                    "always include a short note about risks.\n\nUser question: " +
                    prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errorText);
      return res.status(500).json({
        error: "Gemini API error",
