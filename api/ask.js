function toFriendlyGeminiMessage(status, rawText) {
  if (status === 429) {
    return "当前 AI 配额不足，请稍后再试，或更换有额度的 Gemini Key。";
  }
  if (status === 401 || status === 403) {
    return "Gemini API Key 无效或无权限，请检查 Vercel 环境变量配置。";
  }
  if (status === 404) {
    return "当前 Gemini 模型不可用，请更换 GEMINI_MODEL 后重试。";
  }
  if (rawText && rawText.includes("RESOURCE_EXHAUSTED")) {
    return "当前 AI 配额不足，请稍后再试。";
  }
  return "Gemini 服务暂时不可用，请稍后重试。";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "服务器未配置 GEMINI_API_KEY。" });
  }

  const { question, fact } = req.body || {};
  if (!question || !fact) {
    return res.status(400).json({ error: "请提供 question 和 fact。" });
  }

  const prompt = `
你是一个可爱、简洁的宠物知识助手。请基于以下冷知识回答用户问题：

冷知识：${fact}
用户问题：${question}

要求：
1) 回答请使用中文。
2) 语气友好、简短（2-5 句）。
3) 如果问题和冷知识不直接相关，请先说明，再尽可能给出有帮助的补充。
`.trim();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      const text = await response.text();
      const friendlyMessage = toFriendlyGeminiMessage(response.status, text);
      return res
        .status(502)
        .json({
          error: `Gemini 请求失败（model=${GEMINI_MODEL}）: ${text}`,
          userMessage: friendlyMessage
        });
    }

    const data = await response.json();
    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "抱歉，我这次没能生成回答，请再试一次。";

    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({ error: `请求出错: ${error.message}` });
  }
};
