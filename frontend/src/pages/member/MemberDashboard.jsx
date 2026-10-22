import { useEffect, useState } from "react";
import DashboardCard from "../../components/member/DashboardCard";

function MemberDashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMemberHistory = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/borrow-transactions/my-history",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch borrowing history");
        }

        setHistory(data.history || []);
      } catch (err) {
        console.error("Member Dashboard Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberHistory();
  }, []);

  const borrowedBooks = history.filter(
    (book) => book.transaction_status === "Issued"
  ).length;

  const returnedBooks = history.filter(
    (book) => book.transaction_status === "Returned"
  ).length;

  const dueBooks = history.filter((book) => {
    if (book.transaction_status !== "Issued") return false;

    return new Date(book.due_date) < new Date();
  }).length;

  const member = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-blue-600 shadow-lg">

        <div className="max-w-7xl mx-auto px-8 py-8">

          <h1 className="text-4xl font-bold text-white">
            Member Dashboard
          </h1>

          <p className="text-blue-100 mt-2">
            Welcome back, {member.full_name || "Member"}
          </p>

        </div>

      </div>

      {/* Dashboard */}
      <div className="max-w-7xl mx-auto px-8 py-10">

        {loading && (
          <p className="text-center text-gray-600">
            Loading dashboard...
          </p>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid md:grid-cols-3 gap-8">

            <DashboardCard
              title="Books Borrowed"
              value={borrowedBooks}
              color="bg-blue-600"
            />

            <DashboardCard
              title="Books Returned"
              value={returnedBooks}
              color="bg-green-600"
            />

            <DashboardCard
              title="Books Due"
              value={dueBooks}
              color="bg-red-600"
            />

          </div>
        )}

      </div>

    </div>
  );
}

export default MemberDashboard;