function BookCard({ book, onViewDetails }) {
  const fallbackImage =
    "https://via.placeholder.com/600x400?text=No+Book+Cover";

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">

      <img
        src={book.image || fallbackImage}
        alt={`${book.title} book cover`}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = fallbackImage;
        }}
        className="w-full h-72 object-contain bg-gray-100"
      />

      <div className="p-5">

        <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
          {book.title}
        </h2>

        <p className="text-gray-600 mb-1">
          👨‍💼 <span className="font-medium">Author:</span> {book.author}
        </p>

        <p className="text-gray-600 mb-1">
          🏷 <span className="font-medium">Category:</span> {book.category}
        </p>

        <p className="text-gray-600 mb-4">
          📚 <span className="font-medium">ISBN:</span> {book.isbn}
        </p>

        <div className="mb-5">
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              book.status === "Available"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {book.status}
          </span>
        </div>

        <button
          onClick={() => onViewDetails(book)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition duration-300"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

export default BookCard;