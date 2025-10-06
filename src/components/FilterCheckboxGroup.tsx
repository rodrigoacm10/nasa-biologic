import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FilterCheckboxGroupProps {
  label: string;
  color: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

const colorMap: any = {
  blue: {
    dot: "bg-blue-400",
    check: "from-blue-400 to-blue-600",
    ring: "ring-blue-400/50",
  },
  green: {
    dot: "bg-green-400",
    check: "from-green-400 to-green-600",
    ring: "ring-green-400/50",
  },
  pink: {
    dot: "bg-pink-400",
    check: "from-pink-400 to-pink-600",
    ring: "ring-pink-400/50",
  },
  purple: {
    dot: "bg-purple-400",
    check: "from-purple-400 to-purple-600",
    ring: "ring-purple-400/50",
  },
  amber: {
    dot: "bg-amber-400",
    check: "from-amber-400 to-amber-600",
    ring: "ring-amber-400/50",
  },
};

export default function FilterCheckboxGroup({
  label,
  color,
  options,
  selectedValues,
  onChange,
}: FilterCheckboxGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = colorMap[color];
  const selectedCount = selectedValues.length;

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colors.dot}`}></div>
          <span className="text-sm font-semibold text-white">{label}</span>
          {selectedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
              {selectedCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{options.length}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          )}
        </div>
      </button>

      {/* Options */}
      {isExpanded && (
        <div className="space-y-1.5 pl-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Clear All Button */}
          {selectedCount > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors mb-2"
            >
              Clear {selectedCount} selected
            </button>
          )}

          {/* Max height with scroll */}
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option);
              return (
                <label
                  key={option}
                  className={`flex items-center gap-3 p-2.5 rounded-lg backdrop-blur-xl border cursor-pointer transition-all group ${
                    isSelected
                      ? `bg-gradient-to-br ${colors.check} bg-opacity-20 border-white/30 shadow-lg`
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Custom Checkbox */}
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(option)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-md backdrop-blur-xl border-2 transition-all ${
                        isSelected
                          ? `bg-gradient-to-br ${colors.check} border-white/50 ring-2 ${colors.ring}`
                          : "bg-white/10 border-white/30 group-hover:border-white/50"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-full h-full text-white p-0.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Label */}
                  <span
                    className={`text-sm flex-1 transition-colors ${
                      isSelected
                        ? "text-white font-semibold"
                        : "text-gray-300 group-hover:text-white"
                    }`}
                  >
                    {option}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
