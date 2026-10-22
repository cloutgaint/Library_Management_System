import { useEffect, useState } from "react";

function FineManagement() {
  const [fines, setFines] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // Fetch fines from backend
  const fetchFines = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/api/fines", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch fines");
      }

      setFines(data.fines || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  // Pay fine
  const handlePayFine = async (id) => {
    try {
      setMessage("");
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/fines/${id}/pay`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to pay fine");
      }

      setMessage("Fine paid successfully.");

      // Update paid status in UI
      setFines((currentFines) =>
        currentFines.map((fine) =>
          fine.id === id
            ? {
                ...fine,
                payment_status: "Paid",
                payment_date: data.fine?.payment_date,
              }
            : fine
        )
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const totalFines = fines.reduce(
    (total, fine) => total + Number(fine.fine_amount || 0),
    0
  );

  const paidFines = fines
    .filter((fine) => fine.payment_status === "Paid")
    .reduce(
      (total, fine) => total + Number(fine.fine_amount || 0),
      0
    );

  const pendingFines = fines
    .filter((fine) => fine.payment_status === "Unpaid")
    .reduce(
      (total, fine) => total + Number(fine.fine_amount || 0),
      0
    );

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-8">
          <h1 className="text-3xl sm:text-4xl font-bold">
            💰 Fine Management
          </h1>

          <p className="mt-2 text-red-100 text-sm sm:text-base">
            Track and manage library fines and payments.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Success Message */}
        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 font-medium">
            ✅ {message}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 font-medium">
            ❌ {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">

          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 border border-gray-100">
            <p className="text-gray-500 text-sm">
              Total Fines
            </p>

            <h2 className="text-3xl font-bold text-gray-800 mt-2">
              ₹{totalFines}
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 border border-gray-100">
            <p className="text-gray-500 text-sm">
              Paid Fines
            </p>

            <h2 className="text-3xl font-bold text-green-600 mt-2">
              ₹{paidFines}
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 border border-gray-100">
            <p className="text-gray-500 text-sm">
              Pending Fines
            </p>

            <h2 className="text-3xl font-bold text-red-600 mt-2">
              ₹{pendingFines}
            </h2>
          </div>

        </div>

        {/* Fine Records */}
        <section className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* Section Header */}
          <div className="p-5 sm:p-6 border-b border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Fine Records
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              View outstanding and completed fine payments.
            </p>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading fine records...
            </div>
          ) : fines.length > 0 ? (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px]">

                <thead className="bg-gray-50">
                  <tr>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                      ID
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                      Member
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                      Transaction
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                      Amount
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                      Created Date
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {fines.map((fine) => (

                    <tr
                      key={fine.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition"
                    >

                      <td className="px-5 py-5 text-gray-500 font-medium">
                        #{fine.id}
                      </td>

                      <td className="px-5 py-5">
                        <div className="font-medium text-gray-800">
                          {fine.full_name}
                        </div>

                        <div className="text-sm text-gray-500">
                          {fine.email}
                        </div>
                      </td>

                      <td className="px-5 py-5 text-gray-600">
                        #{fine.transaction_id}
                      </td>

                      <td className="px-5 py-5 font-bold text-gray-800">
                        ₹{Number(fine.fine_amount || 0)}
                      </td>

                      <td className="px-5 py-5 text-gray-600">
                        {formatDate(fine.created_at)}
                      </td>

                      <td className="px-5 py-5">

                        <span
                          className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                            fine.payment_status === "Paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {fine.payment_status}
                        </span>

                      </td>

                      <td className="px-5 py-5">

                        {fine.payment_status === "Unpaid" ? (

                          <button
                            onClick={() => handlePayFine(fine.id)}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                          >
                            Pay Fine
                          </button>

                        ) : (

                          <span className="text-sm font-medium text-green-600">
                            ✓ Completed
                          </span>

                        )}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          ) : (

            <div className="p-10 sm:p-14 text-center">

              <div className="text-5xl mb-4">
                💰
              </div>

              <h3 className="text-xl font-bold text-gray-800">
                No Fine Records
              </h3>

              <p className="text-gray-500 mt-2">
                There are currently no fine records to display.
              </p>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default FineManagement;