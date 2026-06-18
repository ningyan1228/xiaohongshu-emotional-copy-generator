const API_BASE_URL =
  window.XHS_API_BASE_URL ||
  localStorage.getItem("XHS_API_BASE_URL") ||
  "http://localhost:8000";

const form = document.querySelector("#copyForm");
const keywordInput = document.querySelector("#keywordInput");
const styleSelect = document.querySelector("#styleSelect");
const generateBtn = document.querySelector("#generateBtn");
const againBtn = document.querySelector("#againBtn");
const statusText = document.querySelector("#statusText");
const resultList = document.querySelector("#resultList");
const itemTemplate = document.querySelector("#resultItemTemplate");

let lastRequest = null;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  generateCopies();
});

againBtn.addEventListener("click", () => {
  if (!lastRequest) return;
  generateCopies(lastRequest);
});

async function generateCopies(savedRequest) {
  const request = savedRequest || {
    keyword: keywordInput.value.trim(),
    style: styleSelect.value,
  };

  if (!request.keyword) {
    setStatus("先输入一个产品关键词");
    keywordInput.focus();
    return;
  }

  lastRequest = request;
  setLoading(true);
  resultList.innerHTML = "";
  setStatus("生成中...");

  try {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `请求失败：${response.status}`);
    }

    const data = await response.json();
    const results = normalizeResults(data.results);

    if (results.length === 0) {
      throw new Error("没有生成到可用文案");
    }

    progressiveRender(results);
    setStatus(`已生成 ${results.length} 条`);
    againBtn.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    setStatus("生成失败，请检查后端地址和 API Key");
    renderResults([
      "救命接口没连上",
      "先检查后端地址",
      "API Key 别露前端",
      "配置好再冲一次",
    ]);
  } finally {
    setLoading(false);
  }
}

function normalizeResults(results) {
  if (!Array.isArray(results)) return [];
  return results
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 20);
}

function progressiveRender(results) {
  resultList.innerHTML = "";
  results.forEach((text, index) => {
    window.setTimeout(() => {
      appendResult(text, index);
    }, index * 45);
  });
}

function renderResults(results) {
  resultList.innerHTML = "";
  results.forEach((text, index) => appendResult(text, index));
}

function appendResult(text, index) {
  const node = itemTemplate.content.firstElementChild.cloneNode(true);
  const textEl = node.querySelector(".result-text");
  const copyBtn = node.querySelector(".copy-btn");

  textEl.textContent = `${index + 1}. ${text}`;
  copyBtn.addEventListener("click", async () => {
    await copyText(text);
    copyBtn.textContent = "已复制";
    window.setTimeout(() => {
      copyBtn.textContent = "复制";
    }, 1200);
  });

  resultList.appendChild(node);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  againBtn.disabled = isLoading;
  generateBtn.textContent = isLoading ? "生成中..." : "生成20条";
}

function setStatus(message) {
  statusText.textContent = message;
}
