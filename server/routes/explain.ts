import type { RequestHandler } from "express";
import { z } from "zod";
import type { ExplainResponse } from "@shared/api";

const BodySchema = z.object({
  tip: z.string().min(4).max(280),
  selected: z.array(z.string()).max(100),
  goal: z.enum(["energy", "focus", "fitness"]).optional(),
});

const SYSTEM_PROMPT = `You explain health habits in brief, evidence-informed terms.
Tone: supportive, honest, specific; avoid fluff. Keep it short (1–3 sentences).`;

export const explainHandler: RequestHandler = async (req, res) => {
  const parse = BodySchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid body" });
  const { tip, selected, goal } = parse.data;

  const key =
    process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.OPENAI;
  if (!key)
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Explain why this matters: ${tip}\nUser goal: ${goal ?? ""}\nChecked habits: ${JSON.stringify(selected)}\nReply with 1–3 sentences.`,
          },
        ],
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      throw new Error(`OpenAI error: ${r.status} ${text}`);
    }

    const data = (await r.json()) as any;
    const content = data.choices?.[0]?.message?.content?.trim() || "";
    const response: ExplainResponse = { explanation: content.slice(0, 600) };
    res.json(response);
  } catch (err) {
    console.error("/api/explain failed", err);
    const body: any = { error: "Failed to explain" };
    if (process.env.NODE_ENV !== "production") body.detail = String(err);
    res.status(500).json(body);
  }
};
