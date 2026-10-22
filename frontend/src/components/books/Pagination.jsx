function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mt-10">

      {/* Previous */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-lg font-medium transition ${
          currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 shadow-sm hover:bg-gray-200"
        }`}
      >
        ← Previous
      </button>

      {/* Page Numbers */}
      {Array.from({ length: totalPages }, (_, index) => index + 1).map(
        (page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`min-w-10 px-3 py-2 rounded-lg font-semibold transition ${
              currentPage === page
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 shadow-sm hover:bg-gray-200"
            }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-lg font-medium transition ${
          currentPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 shadow-sm hover:bg-gray-200"
        }`}
      >
        Next →
      </button>

    </div>
  );
}

export default Pagination;