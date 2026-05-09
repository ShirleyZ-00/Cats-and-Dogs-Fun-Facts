const animalTag = document.getElementById("animalTag");
const factText = document.getElementById("factText");
const answerText = document.getElementById("answerText");
const refreshBtn = document.getElementById("refreshBtn");
const askBtn = document.getElementById("askBtn");
const questionInput = document.getElementById("questionInput");

let currentFact = "";

async function loadFact() {
  refreshBtn.disabled = true;
  refreshBtn.textContent = "加载中...";

  try {
    const response = await fetch("/api/fact");
    if (!response.ok) {
      throw new Error("获取冷知识失败");
    }

    const data = await response.json();
    currentFact = data.fact;
    animalTag.textContent = data.animal;
    factText.textContent = data.fact;
    answerText.textContent = "你可以先点击“提问”来获取回答。";
  } catch (error) {
    factText.textContent = `出错了：${error.message}`;
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = "换一条冷知识";
  }
}

async function askAboutFact() {
  const question = questionInput.value.trim();
  if (!question) {
    answerText.textContent = "请先输入你想问的问题。";
    return;
  }

  if (!currentFact) {
    answerText.textContent = "请先获取一条冷知识再提问。";
    return;
  }

  askBtn.disabled = true;
  askBtn.textContent = "Gemini 思考中...";
  answerText.textContent = "正在请求 Gemini...";

  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        fact: currentFact
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "提问失败");
    }

    answerText.textContent = data.answer;
  } catch (error) {
    answerText.textContent = `出错了：${error.message}`;
  } finally {
    askBtn.disabled = false;
    askBtn.textContent = "提问";
  }
}

refreshBtn.addEventListener("click", loadFact);
askBtn.addEventListener("click", askAboutFact);

loadFact();
