import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000";

function ReservationQueue() {
const [reservations, setReservations] = useState([]);
const [loading, setLoading] = useState(true);
const [updating, setUpdating] = useState(false);
const [error, setError] = useState("");
const [successMessage, setSuccessMessage] = useState("");

const getToken = () => localStorage.getItem("token");

const fetchReservations = async () => {
try {
setLoading(true);
setError("");


  const token = getToken();

  const response = await fetch(`${API_BASE}/api/reservations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch reservations.");
  }

  const data = await response.json();

  setReservations(data.reservations || []);
} catch (err) {
  console.error("Error loading reservations:", err);
  setError(err.message || "Unable to load reservations.");
} finally {
  setLoading(false);
}


};

useEffect(() => {
fetchReservations();
}, []);

// Mark a waiting reservation as Ready
const updateStatus = async (id) => {
try {
setUpdating(true);
setError("");
setSuccessMessage("");


  const token = getToken();

  const response = await fetch(
    `${API_BASE}/api/reservations/${id}/ready`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to mark reservation as ready.");
  }

  const data = await response.json();

  setReservations((prevReservations) =>
    prevReservations.map((reservation) =>
      reservation.id === id
        ? {
            ...reservation,
            status: "Ready",
            queue_position: null,
          }
        : reservation
    )
  );

  setSuccessMessage(
    data.message || "Reservation marked as ready successfully."
  );
} catch (err) {
  console.error("Error updating reservation:", err);
  setError(err.message || "Unable to update reservation.");
} finally {
  setUpdating(false);
}


};

// Cancel a reservation
const cancelReservation = async (id) => {
const confirmed = window.confirm(
"Are you sure you want to cancel this reservation?"
);


if (!confirmed) {
  return;
}

try {
  setUpdating(true);
  setError("");
  setSuccessMessage("");

  const token = getToken();

  const response = await fetch(
    `${API_BASE}/api/reservations/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to cancel reservation.");
  }

  const data = await response.json();

  setReservations((prevReservations) =>
    prevReservations.map((reservation) =>
      reservation.id === id
        ? {
            ...reservation,
            status: "Cancelled",
            queue_position: null,
          }
        : reservation
    )
  );

  setSuccessMessage(
    data.message || "Reservation cancelled successfully."
  );
} catch (err) {
  console.error("Error cancelling reservation:", err);
  setError(err.message || "Unable to cancel reservation.");
} finally {
  setUpdating(false);
}


};

const getStatusStyle = (status) => {
const normalizedStatus = String(status || "").toLowerCase();


if (normalizedStatus === "ready") {
  return "bg-green-100 text-green-700";
}

if (normalizedStatus === "cancelled") {
  return "bg-gray-100 text-gray-600";
}

if (normalizedStatus === "waiting") {
  return "bg-orange-100 text-orange-700";
}

return "bg-blue-100 text-blue-700";


};

const formatDate = (dateValue) => {
if (!dateValue) {
return "—";
}


const date = new Date(dateValue);

if (Number.isNaN(date.getTime())) {
  return "—";
}

return date.toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});


};

/*
Create the waiting queue.


We calculate the position ourselves instead of depending on
queue_position from the backend.

This means:
Waiting reservation 1 -> Position 1
Waiting reservation 2 -> Position 2
Waiting reservation 3 -> Position 3


*/

const waitingReservations = reservations
.filter(
(reservation) =>
String(reservation.status || "").toLowerCase() === "waiting"
)
.sort((a, b) => {
const dateA = new Date(
a.reserved_date ||
a.reservation_date ||
a.created_at ||
a.createdAt ||
0
).getTime();


  const dateB = new Date(
    b.reserved_date ||
      b.reservation_date ||
      b.created_at ||
      b.createdAt ||
      0
  ).getTime();

  return dateA - dateB;
});


const readyReservations = reservations.filter(
(reservation) =>
String(reservation.status || "").toLowerCase() === "ready"
);

/*
Keep all reservations for the table.


Waiting reservations come first,
then Ready,
then Cancelled.


*/

const displayReservations = [...waitingReservations, ...reservations
.filter(
(reservation) =>
String(reservation.status || "").toLowerCase() !== "waiting"
)
.sort((a, b) => {
const statusOrder = {
ready: 1,
cancelled: 2,
};


  const statusA =
    statusOrder[String(a.status || "").toLowerCase()] || 3;

  const statusB =
    statusOrder[String(b.status || "").toLowerCase()] || 3;

  if (statusA !== statusB) {
    return statusA - statusB;
  }

  const dateA = new Date(
    a.reserved_date ||
      a.reservation_date ||
      a.created_at ||
      a.createdAt ||
      0
  ).getTime();

  const dateB = new Date(
    b.reserved_date ||
      b.reservation_date ||
      b.created_at ||
      b.createdAt ||
      0
  ).getTime();

  return dateA - dateB;
})];


const totalReservations = reservations.length;
const waitingCount = waitingReservations.length;
const readyCount = readyReservations.length;

const getPosition = (reservation) => {
const isWaiting =
String(reservation.status || "").toLowerCase() === "waiting";


if (!isWaiting) {
  return "—";
}

const index = waitingReservations.findIndex(
  (waitingReservation) => waitingReservation.id === reservation.id
);

return index === -1 ? "—" : index + 1;


};

return ( <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
{/* Header */} <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-lg"> <h1 className="text-2xl font-bold sm:text-3xl">
Reservation Queue </h1>


    <p className="mt-1 text-sm text-blue-100">
      Manage waiting, ready, and cancelled book reservations.
    </p>
  </div>

  {/* Messages */}
  {successMessage && (
    <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
      {successMessage}
    </div>
  )}

  {error && (
    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {error}
    </div>
  )}

  {/* Summary Cards */}
  <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
    <div className="rounded-2xl bg-white p-5 shadow-md">
      <p className="text-sm font-medium text-gray-500">
        Total Reservations
      </p>

      <p className="mt-2 text-3xl font-bold text-gray-800">
        {totalReservations}
      </p>
    </div>

    <div className="rounded-2xl bg-white p-5 shadow-md">
      <p className="text-sm font-medium text-gray-500">
        Waiting
      </p>

      <p className="mt-2 text-3xl font-bold text-orange-600">
        {waitingCount}
      </p>
    </div>

    <div className="rounded-2xl bg-white p-5 shadow-md">
      <p className="text-sm font-medium text-gray-500">
        Ready
      </p>

      <p className="mt-2 text-3xl font-bold text-green-600">
        {readyCount}
      </p>
    </div>
  </div>

  {/* Queue Explanation */}
  <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
    <h2 className="text-lg font-semibold text-blue-800">
      How the reservation position works
    </h2>

    <p className="mt-2 text-sm leading-6 text-blue-700">
      Waiting reservations are automatically numbered according to
      their reservation date. For example, the first waiting member
      is Position 1, the next is Position 2, and so on. Once a
      reservation becomes Ready or Cancelled, it leaves the waiting
      queue and its position changes to —.
    </p>
  </div>

  {/* Table */}
  <div className="overflow-hidden rounded-2xl bg-white shadow-md">
    <div className="border-b border-gray-100 px-5 py-4">
      <h2 className="text-lg font-semibold text-gray-800">
        Reservation Details
      </h2>
    </div>

    {loading ? (
      <div className="p-8 text-center text-gray-500">
        Loading reservations...
      </div>
    ) : displayReservations.length === 0 ? (
      <div className="p-8 text-center text-gray-500">
        No reservations found.
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Position
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Book
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Member
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Reserved Date
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {displayReservations.map((reservation) => {
              const status = String(
                reservation.status || ""
              ).toLowerCase();

              return (
                <tr
                  key={reservation.id}
                  className="transition hover:bg-gray-50"
                >
                  {/* Position */}
                  <td className="whitespace-nowrap px-5 py-4">
                    {status === "waiting" ? (
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">
                        {getPosition(reservation)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Book */}
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-800">
                      {reservation.book_title ||
                        reservation.bookTitle ||
                        reservation.title ||
                        reservation.book?.title ||
                        "Unknown Book"}
                    </div>

                    {reservation.book_id && (
                      <div className="mt-1 text-xs text-gray-400">
                        Book ID: {reservation.book_id}
                      </div>
                    )}
                  </td>

                  {/* Member */}
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-800">
                {reservation.member_name ||
                  reservation.memberName ||
                  reservation.full_name ||
                  reservation.member?.full_name ||
                  reservation.member?.name ||
                  "Unknown Member"}
                    </div>

                    {reservation.member_id && (
                      <div className="mt-1 text-xs text-gray-400">
                        Member ID: {reservation.member_id}
                      </div>
                    )}
                  </td>

                  {/* Reserved Date */}
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {formatDate(
                      reservation.reserved_date ||
                        reservation.reservation_date ||
                        reservation.created_at ||
                        reservation.createdAt
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        reservation.status
                      )}`}
                    >
                      {reservation.status || "Unknown"}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-5 py-4">
                    {status === "waiting" && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() =>
                            updateStatus(reservation.id)
                          }
                          className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updating ? "Updating..." : "Mark Ready"}
                        </button>

                        <button
                          type="button"
                          disabled={updating}
                          onClick={() =>
                            cancelReservation(reservation.id)
                          }
                          className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {status === "ready" && (
                      <span className="font-medium text-green-600">
                        ✓ Ready
                      </span>
                    )}

                    {status === "cancelled" && (
                      <span className="font-medium text-gray-500">
                        Cancelled
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
</div>


);
}

export default ReservationQueue;
