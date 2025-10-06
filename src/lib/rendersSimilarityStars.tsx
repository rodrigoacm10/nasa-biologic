import { Circle } from "lucide-react";

export const renderSimilarityDots = (similarityPct: number) => {
  let dotsCount = 1;
  let color = "text-gray-400";

  if (similarityPct > 75) {
    dotsCount = 3;
    color = "text-emerald-500";
  } else if (similarityPct > 65) {
    dotsCount = 2;
    color = "text-amber-500";
  }

  return (
    <div className="flex items-center gap-1">
      {[...Array(3)].map((_, i) => (
        <Circle
          key={i}
          className={`w-2 h-2 ${i < dotsCount ? color : "text-gray-200"}`}
          fill="currentColor"
        />
      ))}
    </div>
  );
};
