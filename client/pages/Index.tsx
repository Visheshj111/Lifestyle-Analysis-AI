import { useEffect, useMemo, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CircularProgress from "@/components/CircularProgress";

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
    setSubmitted(true);
  };

  const onShare = async () => {
    const text = `My Lifestyle Score is ${score}%. ${message}`;
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

  return (
    <section className="relative">
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
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {HABITS.map((habit) => (
                    <li key={habit.id} className="flex items-start gap-3 rounded-md border p-3 bg-white/60">
                      <Checkbox
                        id={habit.id}
                        checked={!!checked[habit.id]}
                        onCheckedChange={(v) =>
                          setChecked((c) => ({ ...c, [habit.id]: Boolean(v) }))
                        }
                        className="mt-1"
                      />
                      <label htmlFor={habit.id} className="select-none text-sm leading-6 text-slate-700">
                        {habit.label}
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                    Calculate My Lifestyle Score
                  </Button>
                  {submitted && (
                    <Button type="button" variant="secondary" onClick={() => setChecked({})}>
                      Reset
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-stretch">
          <Card className="w-full bg-white/70 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <CircularProgress value={submitted ? score : 0} />
                <div className="mt-4 text-2xl font-semibold text-teal-900">{submitted ? message : "Your score awaits"}</div>
                {submitted ? (
                  <p className="mt-2 text-slate-600 max-w-sm">Based on your selections, here are quick tips to improve your score.</p>
                ) : (
                  <p className="mt-2 text-slate-600 max-w-sm">Hit calculate to see your personalized lifestyle score.</p>
                )}

                {submitted && (
                  <ul className="mt-5 w-full max-w-md text-left space-y-3">
                    {tips.length === 0 ? (
                      <li className="rounded-md border bg-teal-50/70 p-3 text-teal-800">You're doing great—keep it up and maintain consistency!</li>
                    ) : (
                      tips.map((t, i) => (
                        <li key={i} className="rounded-md border p-3 bg-sky-50/70 text-slate-700">• {t}</li>
                      ))
                    )}
                  </ul>
                )}

                {submitted && (
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
    </section>
  );
}
