import { useMemo } from "react";

type PaginationProps = {
  totalThreads: number;
  currentPage: number;
  onPageChange: (page: number) => void;
};

const THREADS_PER_PAGE = 14;

export default function Pagination({
  totalThreads,
  currentPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalThreads / THREADS_PER_PAGE);

  const pages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <nav
      dir="rtl"
      className="flex  items-center justify-between  px-6 py-4 text-white"
    >
      {/* Page info */}
      <div className="flex items-center gap-2 text-sm">
        <span>עמוד</span>

        <span className="font-bold">{currentPage}</span>

        <span>מתוך</span>

        <span className="font-bold">{totalPages}</span>
      </div>

      {/* Pages */}
      <div className="flex  items-center gap-2">
        {/* Previous */}
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="cursor-pointer  py-2 text-xl disabled:cursor-not-allowed disabled:opacity-30"
        >
          «
        </button>

        {pages.map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(+page)}
              className={`min-w-9 rounded-md px-3 cursor-pointer py-2 text-sm font-semibold transition ${
                currentPage === page ? "bg-[#3b414b]" : "hover:bg-[#292d33]"
              }`}
            >
              {page}
            </button>
          ),
        )}

        {/* Next */}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 cursor-pointer py-2 text-xl disabled:cursor-not-allowed disabled:opacity-30"
        >
          »
        </button>
      </div>
    </nav>
  );
}
