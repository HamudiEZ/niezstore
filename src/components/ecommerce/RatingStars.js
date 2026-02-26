import { Star } from "lucide-react";

export default function RatingStars({ value = 0, reviews = 0 }) {
  const filledStars = Math.round(value);

  return (
    <div className="mt-1 flex items-center gap-1.5 text-xs">
      <div className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`h-3.5 w-3.5 ${
              index < filledStars ? "fill-current" : "text-slate-600"
            }`}
          />
        ))}
      </div>
      <span className="text-slate-400">
        {value.toFixed(1)} ({reviews})
      </span>
    </div>
  );
}
