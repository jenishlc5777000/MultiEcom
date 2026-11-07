"use client";

import { Star } from "lucide-react";
import { useState, useTransition } from "react";
import { submitReviewAction } from "@/actions/account.actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId, orderId }: { productId: string; orderId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (result?.ok) {
    return <p role="status" className="rounded-lg bg-ready/10 p-4 text-sm text-ready">{result.message}</p>;
  }

  return (
    <form
      className="space-y-4 rounded-lg border border-line p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!rating) return setResult({ ok: false, message: "Choose a star rating." });
        start(async () => {
          const res = await submitReviewAction({ productId, orderId, rating, text });
          setResult(res.ok ? { ok: true, message: "Thank you! Your review will appear once the studio has checked it." } : { ok: false, message: res.error });
        });
      }}
    >
      <p className="font-display text-2xl">How do you like it?</p>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Your rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} className="peer sr-only" checked={rating === n} onChange={() => setRating(n)} />
              <span className="sr-only">{n} star{n === 1 ? "" : "s"}</span>
              <Star
                aria-hidden
                className={cn(
                  "size-8 rounded-sm transition-transform duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-ink hover:scale-110",
                  n <= (hover || rating) ? "fill-ink text-ink" : "text-line",
                )}
                strokeWidth={1.4}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Your review (optional)</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          rows={4}
          className="w-full rounded-md border border-line bg-paper/80 p-3 text-[15px] focus:border-ink focus:outline-none"
          placeholder="How does it feel to use? How's the glaze in person?"
        />
      </label>
      {result && !result.ok && <p role="alert" className="text-sm text-danger">{result.message}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Submit review"}</Button>
    </form>
  );
}
