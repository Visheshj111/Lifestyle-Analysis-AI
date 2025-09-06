import { useEffect, useMemo, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CircularProgress from "@/components/CircularProgress";
import HistorySparkline from "@/components/HistorySparkline";
import type { AnalyzeResponse } from "@shared/api";

interface HabitOption {
  id: string;
  label: string;
  tip: string;
}

const HABITS: HabitOption[] = [
  { id: "sleep", label: "I sleep 7–9 hours nightly", tip: "Aim for 7–9 hours of consistent, quality sleep by keeping a regular schedule." },
  { id: "water", label: "I drink 8+ cups of water daily", tip: "Keep a refillable bottle nearby and sip regularly throughout the day." },
  { id: "exercise", label: "I exercise 30+ minutes most days", tip: "Schedule short workouts or walks—consistency beats intensity." },
  { id: "food", label: "I eat balanced, whole-food meals", tip: "Build plates around veggies, lean proteins, whole grains, and healthy fats." },
  { id: "fruitveg", label: "I get 5+ servings of fruits/vegetables", tip: "Add a serving to each meal and snack; frozen options count too." },
  { id: "screen", label: "I limit non‑work screen time to ≤ 2 hours", tip: "Set app limits and add screen‑free blocks (meals, last hour before bed)." },
  { id: "breaks", label: "I take short movement breaks hourly", tip: "Stand, stretch, or take 2‑minute walks every hour to reset energy." },
  { id: "stress", label: "I practice stress management (breathing/meditation)", tip: "Try 5 minutes of guided breathing or journaling to unwind daily." },
  { id: "sugar", label: "I limit sugary drinks and snacks", tip: "Swap soda for sparkling water; keep nutritious snacks within reach." },
  { id: "smoke", label: "I don't smoke or vape", tip: "If you do, talk to a professional—small steps and support help most." },
];

export default function Index() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const [ai, setAi] = useState<AnalyzeResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const phrases = ["Checking your habits…", "Measuring balance…", "Calculating score…"] as const;
  const [phraseIndex, setPhraseIndex] = useState(0);

  const score = useMemo(() => {
    const total = HABITS.length;
    const good = HABITS.reduce((acc, h) => acc + (checked[h.id] ? 1 : 0), 0);
    return Math.round((good / total) * 100);
  }, [checked]);

  const message = score > 70 ? "Great job!" : score < 50 ? "Needs Improvement" : "You're on the right track";

  const tips = useMemo(() => {
    const missing = HABITS.filter((h) => !checked[h.id]).map((h) => h.tip);
    return missing.slice(0, 3);
  }, [checked]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(false);
    setProgress(0);
    setAi(null);
    setAiError(null);
    setLoading(true);
  };

  const onShare = async () => {
    const effectiveScore = ai?.score ?? score;
    const effectiveMessage = ai?.message ?? message;
    const text = `My Lifestyle Score is ${effectiveScore}%. ${effectiveMessage}`;
    const url = window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Lifestyle Score", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} — ${url}`);
        alert("Copied share text to clipboard");
      }
    } catch {}
  };

  useEffect(() => {
    if (!loading) return;
    setPhraseIndex(0);
    const start = performance.now();
    const duration = 2400; // 2.4s minimum analyzing time
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setProgress(Math.round(p * 100));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const phraseTimer = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % phrases.length);
    }, 800);

    // kick off AI call
    const selected = Object.keys(checked).filter((k) => checked[k]);
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected, input: freeText.trim() || undefined }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return (await r.json()) as AnalyzeResponse;
      })
      .then((data) => setAi(data))
      .catch(() => setAiError("AI analysis unavailable"));

    const timer = setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, duration + 100);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(timer);
      clearInterval(phraseTimer);
    };
  }, [loading]);

  return (
    <section className="relative">
      {loading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/80 backdrop-blur-sm">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/3 -translate-x-1/2 h-80 w-80 rounded-full bg-teal-200 blur-3xl opacity-50 animate-heartbeat" />
            <div className="absolute right-1/4 bottom-1/4 h-72 w-72 rounded-full bg-sky-200 blur-3xl opacity-50 animate-heartbeat [animation-delay:0.4s]" />
          </div>
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-teal-300 to-sky-300 blur-2xl opacity-40 animate-pulse" />
              <CircularProgress value={progress} size={200} />
            </div>
            <div className="mt-6 text-center">
              <div className="text-xs uppercase tracking-widest text-teal-700">AI Analyzing</div>
              <div className="mt-1 text-lg font-medium text-slate-700" aria-live="polite">{phrases[phraseIndex]}</div>
            </div>
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 -top-24 -z-10 blur-3xl opacity-60">
        <div className="mx-auto h-56 w-11/12 max-w-5xl bg-gradient-to-r from-teal-200 to-sky-200 rounded-full" />
      </div>

      <div className="container mx-auto grid gap-8 md:grid-cols-2 py-14 md:py-20">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-teal-900">
            Check Your Lifestyle Score
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-prose">
            Answer a few simple questions to see how healthy your daily habits are.
          </p>
          <div id="how-it-works" className="mt-6 text-sm text-slate-500">
            Check the habits you follow. Your score updates when you calculate.
          </div>

          <Card className="mt-8">
            <CardContent className="pt-6">
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm text-slate-600">Your goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as any)}
                    className="rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    <option value="energy">More energy</option>
                    <option value="focus">Better focus</option>
                    <option value="fitness">Improve fitness</option>
                  </select>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {HABITS.map((habit) => (
                    <li key={habit.id} className="flex items-start gap-3 rounded-md border p-3 bg-white/60">
                      <Checkbox
                        id={habit.id}
                        checked={!!checked[habit.id]}
                        onCheckedChange={(v) =>
                          setChecked((c) => ({ ...c, [habit.id]: Boolean(v) }))
                        }
                        disabled={loading}
                        className="mt-1"
                      />
                      <label htmlFor={habit.id} className="select-none text-sm leading-6 text-slate-700">
                        {habit.label}
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4"/></svg>
                        Calculating...
                      </span>
                    ) : (
                      "Calculate My Lifestyle Score"
                    )}
                  </Button>
                  {submitted && (
                    <Button type="button" variant="secondary" onClick={() => setChecked({})}>
                      Reset
                    </Button>
                  )}
                </div>

                <div className="mt-6 border-t pt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ask the AI directly</label>
                  <div className="flex items-end gap-3">
                    <textarea
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value)}
                      placeholder="Describe your habits or concerns (e.g., shift work, new parent, recovering from injury)…"
                      rows={3}
                      className="flex-1 resize-y rounded-md border p-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                    />
                    <Button type="button" className="bg-teal-600 hover:bg-teal-700" disabled={loading || !freeText.trim()} onClick={() => { setSubmitted(false); setProgress(0); setAi(null); setAiError(null); setLoading(true); }}>
                      Send
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Your message is combined with the checked habits for a tailored, honest analysis.</p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-stretch">
          <Card className="w-full bg-white/70 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                {loading ? (
                  <div className="w-full max-w-md" aria-busy="true">
                    <div className="relative mx-auto h-40 w-40">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-400 via-sky-400 to-teal-500 opacity-80 animate-spin [animation-duration:1.6s]" />
                      <div className="absolute inset-[6px] rounded-full bg-white" />
                      <div className="absolute inset-0">
                        <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-sky-500 shadow-sm animate-orbit" />
                      </div>
                      <div className="absolute inset-0 grid place-items-center">
                        <div className="text-center">
                          <div className="text-xs uppercase tracking-wide text-slate-500">AI</div>
                          <div className="text-sm font-medium text-slate-700">Analyzing…</div>
                          <div className="mt-1 text-xs text-slate-500">{progress}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <CircularProgress value={submitted ? (ai?.score ?? score) : 0} />
                    <div className="mt-4 text-2xl font-semibold text-teal-900">{submitted ? (ai?.message ?? message) : "Your score awaits"}</div>
                    {submitted ? (
                      <p className="mt-2 text-slate-600 max-w-sm">{aiError ? "Showing local estimate due to AI unavailability." : "Based on your selections, here are quick tips to improve your score."}</p>
                    ) : (
                      <p className="mt-2 text-slate-600 max-w-sm">Hit calculate to see your personalized lifestyle score.</p>
                    )}

                    {!loading && (
                      <div className="mt-8 w-full max-w-md text-left">
                        <div className="mb-2 text-sm font-medium text-slate-700">Your lifestyle score this week</div>
                        <HistorySparkline
                          values={(() => {
                            const oneWeek = 7 * 24 * 60 * 60 * 1000;
                            const now = Date.now();
                            const weekly = history.filter((h) => now - h.t <= oneWeek).map((h) => h.s);
                            if (weekly.length === 0) return [0];
                            return weekly;
                          })()}
                        />
                        <div className="mt-2 text-xs text-slate-500">Only anonymous scores are stored locally on your device.</div>
                      </div>
                    )}

                    {!loading && submitted && (
                      <div className="mt-6 flex w-full max-w-md flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">Badges:</span>
                        {checked["water"] && <span className="rounded-full bg-teal-100 text-teal-800 px-2 py-0.5 text-xs">Hydration Hero</span>}
                        {checked["sleep"] && <span className="rounded-full bg-sky-100 text-sky-800 px-2 py-0.5 text-xs">Sleep Master</span>}
                        {checked["screen"] && <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs">Screen‑time Slayer</span>}
                        {(checked["exercise"] || checked["breaks"]) && <span className="rounded-full bg-lime-100 text-lime-800 px-2 py-0.5 text-xs">Move More</span>}
                      </div>
                    )}
                  </>
                )}

                {submitted && !loading && (
                  <ul className="mt-5 w-full max-w-md text-left space-y-3">
                    {(ai?.tips ?? tips).length === 0 ? (
                      <li className="rounded-md border bg-teal-50/70 p-3 text-teal-800">You're doing great—keep it up and maintain consistency!</li>
                    ) : (
                      (ai?.tips ?? tips).map((t, i) => (
                        <li key={i} className="rounded-md border p-3 bg-sky-50/70 text-slate-700">
                          <button
                            type="button"
                            className="text-left w-full"
                            onClick={async () => {
                              if (explain[i]?.loading) return;
                              if (explain[i]?.text) return setExplain((m) => ({ ...m, [i]: { ...m[i], text: undefined } }));
                              setExplain((m) => ({ ...m, [i]: { loading: true } }));
                              try {
                                const selected = Object.keys(checked).filter((k) => checked[k]);
                                const r = await fetch("/api/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tip: t, selected, goal }) });
                                if (!r.ok) throw new Error(await r.text());
                                const data = (await r.json()) as { explanation: string };
                                setExplain((m) => ({ ...m, [i]: { loading: false, text: data.explanation } }));
                              } catch (e) {
                                setExplain((m) => ({ ...m, [i]: { loading: false, error: "Could not explain" } }));
                              }
                            }}
                          >
                            • {t}
                            {explain[i]?.loading && <span className="ml-2 text-xs text-slate-500">Explaining…</span>}
                          </button>
                          {explain[i]?.text && (
                            <p className="mt-2 text-xs text-slate-600">{explain[i]?.text}</p>
                          )}
                        </li>
                      ))
                    )}
                  </ul>
                )}

                {submitted && !loading && (
                  <div className="mt-6 flex items-center gap-3">
                    <Button onClick={onShare} className="bg-sky-600 hover:bg-sky-700">Share my score</Button>
                    <Button variant="ghost" onClick={() => setSubmitted(false)}>Edit answers</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="-mt-6 pb-10 text-center">
        <a href="https://buymeacoffee.com/visheshjangid" target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:text-teal-800 underline underline-offset-4">Buy me a coffee</a>
      </div>
    </section>
  );
}
