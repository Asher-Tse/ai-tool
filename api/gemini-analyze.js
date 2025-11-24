// api/gemini-analyze.js

export default async function handler(req, res) {
  // CORS：放宽，方便前端调用
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

    const TEMPLATE = `
You are an AI stock analysis assistant for the website aicartox.com.

You MUST behave according to the following TWO MODES:

MODE 1 — user provided a stock / security code (ticker):
- Examples of codes: TSLA, AAPL, NVDA, MSFT, 7203.T, 510050, 600519, etc.
- If the user message clearly contains at least one such code, you MUST:
  1) Use that code as the main analysis target.
  2) Reply in this exact 5-block structure (titles in English, but they correspond to: 股票, 股票价格, 预期走势, 简短分析结论, 获得完整分析报告+99%胜率收益):

[Stock]
- Show the main code and, if possible, the full company name or brief description.

[Price]
- Describe the recent price level or behavior in GENERAL TERMS only.
- Do NOT fabricate exact numbers; speak qualitatively (e.g. "trading near recent highs", "in a consolidation range", etc.).

[Expected Move]
- Brief, high-level expectation of possible short-term or medium-term behavior (uptrend / sideways / downtrend style), written carefully and hypothetically.
- Never present it as guaranteed; always keep it educational and probabilistic.

[Short Conclusion]
- One or two sentences that summarize the overall view and key things to watch.
- Do NOT give direct buy/sell/hold instructions.

[Full Report Button]
- HTML button for the user to get the full report.
- Use EXACTLY this HTML (you do NOT need to include the code in the URL; the link is fixed):

<a href="https://www.google.com"
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
  [Stock], [Price], [Expected Move], [Short Conclusion], [Full Report Button].
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
