// api/gemini-analyze.js

export default async function handler(req, res) {
  // CORS：开发阶段放宽
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

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

    // 固定模板：AI 自己判断是否有代码
    const TEMPLATE = `
You are an AI stock analysis assistant for the website aicartox.com.

You MUST behave according to the following TWO MODES:

MODE 1 — user provided a stock / security code (ticker):
- Examples of codes: TSLA, AAPL, NVDA, MSFT, 7203.T, 510050, 600519, etc.
- If the user message clearly contains at least one such code, you MUST:
  1) Use that code as the main analysis target.
  2) Reply in this exact structure:

[Summary]
- Very short overview of this stock or code (1–2 sentences).

[Key Points]
1. Key factor 1 (for example: recent trend, volatility, valuation, or sector context).
2. Key factor 2.
3. Key factor 3.

[Risk Notice]
- Short reminder that this is for education only, markets are risky, and this is not investment advice.

[Action Button]
- HTML button for the user to get the full report.
- Use EXACTLY this HTML (replace THE_MAIN_CODE with the main stock code you detected):

<a href="https://aicartox.com/report?symbol=THE_MAIN_CODE"
   class="ai-report-button"
   target="_blank"
   rel="noopener noreferrer">
  Get full analysis report &amp; 99% prediction win-rate
</a>

MODE 2 — user did NOT provide any stock / security code:
- If the message does NOT clearly contain any stock or security code:
  - Do NOT analyze anything.
  - Do NOT invent or guess any code.
  - You MUST reply with EXACTLY this ONE sentence, with no extra text before or after:

  "Please enter a specific stock or security code so I can run the analysis."

Important rules:
- Always answer in English.
- Never give direct buy/sell/hold instructions.
- In MODE 1, always keep the block titles and order exactly as shown:
  [Summary], [Key Points], [Risk Notice], [Action Button].
- In MODE 2, output only the one fixed sentence above, nothing else.
`;

    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" +
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
                    TEMPLATE +
                    "\n\nUser message:\n" +
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
        status: geminiRes.status,
        detail: errorText,
      });
    }

    const data = await geminiRes.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No analysis was generated. Please try again with a different question.";

    return res.status(200).json({ result: text });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      error: "Internal server error",
      detail: String(err?.message || err),
    });
  }
}
