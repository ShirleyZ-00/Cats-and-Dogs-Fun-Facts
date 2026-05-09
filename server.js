const http = require("http");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalIdx = trimmed.indexOf("=");
    if (equalIdx === -1) continue;
    const key = trimmed.slice(0, equalIdx).trim();
    const value = trimmed.slice(equalIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const PORT = Number(process.env.PORT) || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const catFacts = [
  "猫咪的胡须长度通常和它身体宽度接近，用来判断能不能钻过狭小空间。",
  "猫咪发出咕噜声不只代表开心，也可能是在自我安抚。",
  "家猫一天能睡 12 到 16 个小时，是典型的睡眠高手。",
  "猫咪耳朵可以独立转动，帮助它快速定位声音来源。",
  "猫咪鼻纹和人类指纹一样，每只都独一无二。"
];

const dogFacts = [
  "狗狗的嗅觉大约是人类的数十倍到上百倍，非常擅长气味追踪。",
  "狗狗通过尾巴摆动的方向和幅度表达情绪与意图。",
  "狗狗的爪垫可以帮助它们在不同地面上减震和防滑。",
  "狗狗能听到比人类更高频率的声音，所以更容易注意到细微动静。",
  "很多狗狗会通过打哈欠来缓解紧张，这是一种社交信号。"
];

function getRandomFact() {
  const isCat = Math.random() < 0.5;
  const animal = isCat ? "猫猫" : "狗狗";
  const facts = isCat ? catFacts : dogFacts;
  const fact = facts[Math.floor(Math.random() * facts.length)];
  return { animal, fact };
}

async function handleAsk(body) {
  if (!GEMINI_API_KEY) {
    return { status: 500, data: { error: "服务器未配置 GEMINI_API_KEY。" } };
  }

  const { question, fact } = body || {};
  if (!question || !fact) {
    return { status: 400, data: { error: "请提供 question 和 fact。" } };
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
      return {
        status: 502,
        data: { error: `Gemini 请求失败（model=${GEMINI_MODEL}）: ${text}` }
      };
    }

    const data = await response.json();
    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "抱歉，我这次没能生成回答，请再试一次。";

    return { status: 200, data: { answer } };
  } catch (error) {
    return { status: 500, data: { error: `请求出错: ${error.message}` } };
  }
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  return "text/plain; charset=utf-8";
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "GET" && reqUrl.pathname === "/api/fact") {
    return sendJson(res, 200, getRandomFact());
  }

  if (req.method === "POST" && reqUrl.pathname === "/api/ask") {
    let rawBody = "";
    req.on("data", (chunk) => {
      rawBody += chunk;
      if (rawBody.length > 1e6) req.socket.destroy();
    });
    req.on("end", async () => {
      let body = {};
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        return sendJson(res, 400, { error: "请求体不是合法 JSON。" });
      }
      const result = await handleAsk(body);
      return sendJson(res, result.status, result.data);
    });
    return;
  }

  let filePath = path.join(
    __dirname,
    "public",
    reqUrl.pathname === "/" ? "index.html" : reqUrl.pathname
  );
  filePath = path.normalize(filePath);
  const publicRoot = path.join(__dirname, "public");
  if (!filePath.startsWith(publicRoot)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not Found");
    }
    res.writeHead(200, { "Content-Type": contentType(filePath) });
    return res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
