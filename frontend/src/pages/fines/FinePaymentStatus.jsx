import { useEffect, useState } from "react";

function FinePaymentStatus() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role;

  const isMember = role === "member";

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const endpoint = isMember
        ? "http://localhost:5000/api/fines/my-fines"
        : "http://localhost:5000/api/fines";

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch fine records");
      }

      setPayments(data.fines || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleMarkAsPaid = async (fineId) => {
    try {
      setMessage("");
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/fines/${fineId}/pay`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update fine");
      }

      setPayments((currentPayments) =>
        currentPayments.map((payment) =>
          payment.id === fineId
            ? {
                ...payment,
                payment_status: "Paid",
                payment_date: data.fine?.payment_date,
              }
            : payment
        )
      );

      setMessage("Fine marked as paid successfully.");

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const totalPayments = payments.reduce(
    (total, payment) => total + Number(payment.fine_amount || 0),
    0
  );

  const paidAmount = payments
    .filter((payment) => payment.payment_status === "Paid")
    .reduce(
      (total, payment) => total + Number(payment.fine_amount || 0),
      0
    );

  const pendingAmount = payments
    .filter((payment) => payment.payment_status === "Unpaid")
    .reduce(
      (total, payment) => total + Number(payment.fine_amount || 0),
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
      <header className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-8">
          <h1 className="text-3xl sm:text-4xl font-bold">
            {isMember ? "💰 My Fines" : "💳 Fine Payment Status"}
          </h1>

          <p className="mt-2 text-blue-100 text-sm sm:text-base">
            {isMember
              ? "View your fines and payment status."
              : "Track and update member fine payments."}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 font-medium">
            ✅ {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 font-medium">
            ❌ {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 border border-gray-100">
            <p className="text-sm text-gray-500">
              {isMember ? "Total Fines" : "Total Payments"}
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-800">
              ₹{totalPayments}
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 border border-gray-100">
            <p className="text-sm text-gray-500">Paid</p>

            <h2 className="mt-2 text-3xl font-bold text-green-600">
              ₹{paidAmount}
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 border border-gray-100">
            <p className="text-sm text-gray-500">
              {isMember ? "Due" : "Pending"}
            </p>

            <h2 className="mt-2 text-3xl font-bold text-orange-600">
              ₹{pendingAmount}
            </h2>
          </div>
        </div>

        <section className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              {isMember ? "My Fine Records" : "Payment Records"}
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              {isMember
                ? "View your completed and pending fines. Please pay unpaid fines at the library counter."
                : "Confirm cash payments received from members."}
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading fine records...
            </div>
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-600">
                      ID
                    </th>

                    {!isMember && (
                      <th className="px-5 py-4 text-sm font-semibold text-gray-600">
                        Member
                      </th>
                    )}

                    <th className="px-5 py-4 text-sm font-semibold text-gray-600">
                      Transaction
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-gray-600">
                      Amount
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-gray-600">
                      Payment Date
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-gray-600">
                      Status
                    </th>

                    {!isMember && (
                      <th className="px-5 py-4 text-sm font-semibold text-gray-600">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-5 py-5 font-medium text-gray-500">
                        #{payment.id}
                      </td>

                      {!isMember && (
                        <td className="px-5 py-5">
                          <div className="font-medium text-gray-800">
                            {payment.full_name}
                          </div>

                          <div className="text-sm text-gray-500">
                            {payment.email}
                          </div>
                        </td>
                      )}

                      <td className="px-5 py-5 text-gray-600">
                        #{payment.transaction_id}
                      </td>

                      <td className="px-5 py-5 font-bold text-gray-800">
                        ₹{Number(payment.fine_amount || 0)}
                      </td>

                      <td className="px-5 py-5 text-gray-600">
                        {formatDate(payment.payment_date)}
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                            payment.payment_status === "Paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {payment.payment_status}
                        </span>
                      </td>

                      {!isMember && (
                        <td className="px-5 py-5">
                          {payment.payment_status === "Unpaid" ? (
                            <button
                              type="button"
                              onClick={() => handleMarkAsPaid(payment.id)}
                              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
                            >
                              Mark as Paid
                            </button>
                          ) : (
                            <span className="text-sm font-semibold text-green-600">
                              ✓ Completed
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 sm:p-14 text-center">
              <div className="text-5xl mb-4">💰</div>

              <h3 className="text-xl font-bold text-gray-800">
                {isMember ? "No Fines" : "No Payment Records"}
              </h3>

              <p className="text-gray-500 mt-2">
                {isMember
                  ? "You currently have no fines."
                  : "There are currently no payment records to display."}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default FinePaymentStatus;