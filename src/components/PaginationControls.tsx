import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 my-6 sm:my-8 px-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
        >
          <ChevronLeft className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
        </button>

        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10">
          {getPageNumbers().map((page, idx) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 sm:px-2 text-gray-400 text-xs sm:text-sm"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[32px] sm:min-w-[40px] px-1.5 sm:px-2 py-1 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                  isActive
                    ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg scale-105"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
        >
          <ChevronRight className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>

      <div className="px-3 sm:px-4 py-1 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10">
        <span className="text-xs sm:text-sm text-gray-300">
          Page <span className="font-bold text-white">{currentPage}</span> of{" "}
          <span className="font-bold text-white">{totalPages}</span>
        </span>
      </div>
    </div>
  );
}
