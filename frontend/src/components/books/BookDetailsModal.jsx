import { useEffect, useState } from "react";

function BookDetailsModal({ book, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [reservationMessage, setReservationMessage] = useState("");
  const [reservationError, setReservationError] = useState("");
  const [reserving, setReserving] = useState(false);

  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editReviewText, setEditReviewText] = useState("");

  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const isMember = user?.role === "member";
  const isAvailable = book?.status === "Available";

  const getOpenLibraryCover = () => {
    if (!book?.isbn) return "";

    const isbn = String(book.isbn).replace(/[^0-9Xx]/g, "");

    if (!isbn) return "";

    return `https://covers.openlibrary.org/isbn/${isbn}-L.jpg`;
  };

  const fallbackImage =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
        <rect width="600" height="800" fill="#e2e8f0"/>
        <rect x="80" y="80" width="440" height="640" rx="24" fill="#cbd5e1"/>
        <text x="300" y="370" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#475569">
          📚
        </text>
        <text x="300" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#475569">
          No Book Cover
        </text>
      </svg>
    `);

  const handleCoverError = (event) => {
    const openLibraryCover = getOpenLibraryCover();

    if (
      openLibraryCover &&
      event.currentTarget.src !== openLibraryCover
    ) {
      event.currentTarget.src = openLibraryCover;
      return;
    }

    event.currentTarget.src = fallbackImage;
  };

  const fetchReviews = async () => {
    if (!book) return;

    try {
      setLoadingReviews(true);

      const response = await fetch(
        `http://localhost:5000/api/reviews/book/${book.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch reviews");
      }

      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Review Fetch Error:", error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (!book) return;

    setReviewMessage("");
    setReviewError("");
    setSelectedRating(0);
    setReviewText("");
    setEditingReviewId(null);

    fetchReviews();
  }, [book]);

  if (!book) return null;

  const handleReserve = async () => {
    try {
      setReserving(true);
      setReservationMessage("");
      setReservationError("");

      const response = await fetch(
        "http://localhost:5000/api/reservations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            book_id: book.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reserve book");
      }

      setReservationMessage(
        data.message || "Book reserved successfully."
      );
    } catch (error) {
      setReservationError(error.message);
    } finally {
      setReserving(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    setReviewMessage("");
    setReviewError("");

    if (selectedRating < 1 || selectedRating > 5) {
      setReviewError("Please select a rating from 1 to 5.");
      return;
    }

    try {
      setSubmittingReview(true);

      const response = await fetch(
        "http://localhost:5000/api/reviews",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookId: book.id,
            rating: selectedRating,
            reviewText: reviewText.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      setReviewMessage(
        data.message || "Review submitted successfully."
      );

      setSelectedRating(0);
      setReviewText("");

      await fetchReviews();
    } catch (error) {
      console.error("Create Review Error:", error);
      setReviewError(error.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleStartEdit = (review) => {
    setEditingReviewId(review.id);
    setEditRating(Number(review.rating));
    setEditReviewText(review.review_text || "");
    setReviewMessage("");
    setReviewError("");
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditReviewText("");
  };

  const handleUpdateReview = async (reviewId) => {
    setReviewMessage("");
    setReviewError("");

    if (editRating < 1 || editRating > 5) {
      setReviewError("Please select a rating from 1 to 5.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/reviews/${reviewId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: editRating,
            reviewText: editReviewText.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update review");
      }

      setReviewMessage(
        data.message || "Review updated successfully."
      );

      handleCancelEdit();

      await fetchReviews();
    } catch (error) {
      console.error("Update Review Error:", error);
      setReviewError(error.message);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your review?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingReviewId(reviewId);
      setReviewMessage("");
      setReviewError("");

      const response = await fetch(
        `http://localhost:5000/api/reviews/${reviewId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete review");
      }

      setReviewMessage(
        data.message || "Review deleted successfully."
      );

      await fetchReviews();
    } catch (error) {
      console.error("Delete Review Error:", error);
      setReviewError(error.message);
    } finally {
      setDeletingReviewId(null);
    }
  };

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (total, review) => total + Number(review.rating || 0),
            0
          ) / reviews.length
        ).toFixed(1)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 sm:px-6 py-4">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-700">
            📖 Book Details
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-700 transition"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 sm:p-6">
          <div className="flex justify-center items-start">
            <img
              src={book.image || getOpenLibraryCover() || fallbackImage}
              alt={book.title}
              onError={handleCoverError}
              className="w-44 sm:w-52 h-60 sm:h-72 object-cover rounded-xl shadow-md"
            />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-5">
              {book.title}
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Author</p>
                <p className="font-semibold text-gray-800">
                  {book.author}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-semibold text-gray-800">
                  {book.category}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">ISBN</p>
                <p className="font-semibold text-gray-800 break-all">
                  {book.isbn}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Availability
                </p>

                <span
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                    isAvailable
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {isAvailable ? "✓ Available" : "✕ Issued"}
                </span>
              </div>

              {averageRating && (
                <div>
                  <p className="text-sm text-gray-500">
                    Average Rating
                  </p>

                  <p className="font-semibold text-gray-800 mt-1">
                    ⭐ {averageRating} / 5
                  </p>
                </div>
              )}
            </div>

            {!isAvailable && (
              <button
                type="button"
                onClick={handleReserve}
                disabled={reserving}
                className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {reserving ? "Reserving..." : "Reserve Book"}
              </button>
            )}

            {reservationMessage && (
              <p className="mt-4 rounded-lg bg-green-100 p-3 text-sm font-semibold text-green-700">
                {reservationMessage}
              </p>
            )}

            {reservationError && (
              <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm font-semibold text-red-700">
                {reservationError}
              </p>
            )}
          </div>
        </div>

        {isMember && (
          <div className="border-t px-5 sm:px-6 py-5">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              ⭐ Write a Review
            </h3>

            <form onSubmit={handleSubmitReview}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Rating
              </label>

              <div className="flex gap-2 mb-5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(star)}
                    className={`text-3xl transition ${
                      star <= selectedRating
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                    aria-label={`Rate ${star} out of 5`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Review
              </label>

              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write your review..."
                rows="4"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              <button
                type="submit"
                disabled={submittingReview}
                className="mt-4 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50"
              >
                {submittingReview
                  ? "Submitting..."
                  : "Submit Review"}
              </button>
            </form>

            {reviewMessage && (
              <p className="mt-4 rounded-lg bg-green-100 p-3 text-sm font-semibold text-green-700">
                {reviewMessage}
              </p>
            )}

            {reviewError && (
              <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm font-semibold text-red-700">
                {reviewError}
              </p>
            )}
          </div>
        )}

        <div className="border-t px-5 sm:px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              ⭐ Reviews
            </h3>

            {reviews.length > 0 && (
              <span className="text-sm text-gray-500">
                {reviews.length} review
                {reviews.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loadingReviews ? (
            <p className="text-gray-500">
              Loading reviews...
            </p>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => {
                const isMyReview = user?.id === review.user_id;

                return (
                  <div
                    key={review.id}
                    className="rounded-xl bg-gray-50 border border-gray-100 p-4"
                  >
                    {editingReviewId === review.id ? (
                      <div>
                        <p className="font-semibold text-gray-800 mb-3">
                          Edit Your Review
                        </p>

                        <div className="flex gap-2 mb-4">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setEditRating(star)}
                              className={`text-2xl ${
                                star <= editRating
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>

                        <textarea
                          value={editReviewText}
                          onChange={(e) =>
                            setEditReviewText(e.target.value)
                          }
                          rows="3"
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />

                        <div className="flex flex-wrap gap-3 mt-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateReview(review.id)
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold"
                          >
                            Save Changes
                          </button>

                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-lg font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between gap-4">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {review.full_name || "Member"}
                            </p>

                            <p className="text-yellow-500 mt-1">
                              {"★".repeat(
                                Number(review.rating || 0)
                              )}
                              {"☆".repeat(
                                5 - Number(review.rating || 0)
                              )}
                            </p>
                          </div>

                          {review.created_at && (
                            <span className="text-xs text-gray-400">
                              {new Date(
                                review.created_at
                              ).toLocaleDateString("en-IN")}
                            </span>
                          )}
                        </div>

                        {review.review_text && (
                          <p className="text-gray-600 mt-3">
                            {review.review_text}
                          </p>
                        )}

                        {isMyReview && (
                          <div className="flex flex-wrap gap-3 mt-4">
                            <button
                              type="button"
                              onClick={() =>
                                handleStartEdit(review)
                              }
                              className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-semibold"
                            >
                              ✏️ Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteReview(review.id)
                              }
                              disabled={
                                deletingReviewId === review.id
                              }
                              className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                            >
                              {deletingReviewId === review.id
                                ? "Deleting..."
                                : "🗑️ Delete"}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 p-5 text-center">
              <p className="text-gray-500">
                No reviews yet for this book.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t bg-gray-50 px-5 sm:px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookDetailsModal;