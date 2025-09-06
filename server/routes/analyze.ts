import type { RequestHandler } from "express";
import { z } from "zod";
import type { AnalyzeResponse } from "@shared/api";

const BodySchema = z.object({
  selected: z.array(z.string()).max(100),
});

const SYSTEM_PROMPT = `You are a professional lifestyle health analyst. Produce realistic, conservative, evidence-informed feedback.
Tone: supportive but honest; avoid exaggerated praise or false certainty. Mention strengths and weaknesses clearly.
Output STRICT JSON with keys: score (0-100), message (string, <=90 chars), tips (array of 3-5 short actionable items).
Scoring guidance: more positive habits -> higher score; penalize risk behaviors like smoking heavily.
`;

export const analyzeHandler: RequestHandler = async (req, res) => {
  const parse = BodySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid body" });
  }
  const { selected } = parse.data;

  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.OPENAI;
  if (!key) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
  }

  try {
    const userContent = [
      {
        role: "user",
        content: `Given these positive habits (checked): ${JSON.stringify(selected)}\nReturn JSON only.`,
      },
    ];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...userContent,
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      throw new Error(`OpenAI error: ${r.status} ${text}`);
    }

    const data = (await r.json()) as any;
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: AnalyzeResponse;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { score: 50, message: "Partial analysis available", tips: ["Keep consistent sleep", "Hydrate through the day", "Add short walks"] };
    }

    // Clamp & sanitize
    const score = Math.max(0, Math.min(100, Number(parsed.score)) || 0);
    const message = String(parsed.message || "Here's your honest snapshot").slice(0, 120);
    const tips = Array.isArray(parsed.tips)
      ? parsed.tips.map(String).filter(Boolean).slice(0, 5)
      : ["Prioritize sleep", "Stay hydrated", "Move daily"];

    const response: AnalyzeResponse = { score, message, tips };
    res.json(response);
  } catch (err) {
    console.error("/api/analyze failed", err);
    const body: any = { error: "Failed to analyze" };
    if (process.env.NODE_ENV !== "production") body.detail = String(err);
    res.status(500).json(body);
  }
};
