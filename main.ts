const AI_BASE_URL = normalizeBaseUrl(
  Deno.env.get("AI_BASE_URL") || "https://api.siliconflow.cn/v1"
);
const AI_URL = `${AI_BASE_URL}/chat/completions`;
const MODEL =
  Deno.env.get("AI_MODEL") ||
  Deno.env.get("SILICONFLOW_MODEL") ||
  "deepseek-ai/DeepSeek-V3.2";
const API_KEY = Deno.env.get("AI_API_KEY") || Deno.env.get("SILICONFLOW_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8",
};

const stylePrompts: Record<string, string> = {
  emotional: "extreme reaction + obsession，像真实用户突然上头、离不开、疯狂回购。",
  hype: "exaggerated praise，用夸张但口语的方式种草，短促、有冲击力。",
  request: "求链接 / 别停产 style，像评论区疯狂追问链接和囤货。",
};

const lengthProfiles: Record<string, { rule: string; maxChars: number }> = {
  short: {
    rule: "每条 10-18 个中文字符，短促、有冲击力。",
    maxChars: 20,
  },
  medium: {
    rule: "每条 18-24 个中文字符，情绪完整，但不要像广告文案。",
    maxChars: 26,
  },
  long: {
    rule: "每条 26-34 个中文字符，有一点场景感和情绪递进，但仍然口语化。",
    maxChars: 36,
  },
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  if (request.method !== "POST" || url.pathname !== "/api/generate") {
    return json({ error: "Not found" }, 404);
  }

  if (!API_KEY) {
    return json({ error: "Missing AI_API_KEY or SILICONFLOW_API_KEY" }, 500);
  }

  try {
    const body = await request.json();
    const keyword = String(body.keyword || "").trim();
    const style = String(body.style || "emotional");
    const copyLength = String(body.length || "short");

    if (!keyword) {
      return json({ error: "keyword is required" }, 400);
    }

    const results = await generateCopy(keyword, style, copyLength);
    return json({ results });
  } catch (error) {
    console.error(error);
    return json({ error: "Generate failed" }, 500);
  }
});

async function generateCopy(
  keyword: string,
  style: string,
  copyLength: string
): Promise<string[]> {
  const styleRule = stylePrompts[style] || stylePrompts.emotional;
  const lengthProfile = lengthProfiles[copyLength] || lengthProfiles.short;

  const response = await fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.92,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: [
            "You are a viral Xiaohongshu copywriting expert.",
            "You generate emotional, exaggerated, short viral sentences.",
            "",
            "Rules:",
            "- Output 20 lines",
            `- ${lengthProfile.rule}`,
            "- No explanations",
            "- No hashtags in output",
            "- Must feel like real user emotional posts",
            "- High virality tone",
            "- Include emotions: shock, obsession, dependency, urgency",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `产品关键词：${keyword}`,
            `风格要求：${styleRule}`,
            `长度要求：${lengthProfile.rule}`,
            "",
            "请直接输出 20 行中文文案，每行一条，不要编号。",
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SiliconFlow error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return parseLines(content, lengthProfile.maxChars);
}

function parseLines(content: string, maxChars: number): string[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^\s*[-*•]?\s*/, "")
        .replace(/^\s*\d+[.、)]\s*/, "")
        .replace(/^["“”'‘’]+|["“”'‘’]+$/g, "")
        .trim()
    )
    .filter(Boolean)
    .filter((line) => !line.includes("#"))
    .map((line) => line.slice(0, maxChars));

  return unique(lines).slice(0, 20);
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}
