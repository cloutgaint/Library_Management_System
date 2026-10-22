import { useEffect, useMemo, useState } from "react";

function Reports() {
const [reports, setReports] = useState([]);
const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const fetchReports = async () => {
try {
setLoading(true);
setError("");


  const token = localStorage.getItem("token");

  const response = await fetch(
    "http://localhost:5000/api/borrow-transactions",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch reports");
  }

  setReports(data.transactions || []);
} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}


};

useEffect(() => {
fetchReports();
}, []);

const filteredReports = useMemo(() => {
return reports.filter((report) => {
const bookName = report.title || "";
const memberName = report.full_name || "";
const status = report.transaction_status || "";


  const matchesSearch =
    bookName.toLowerCase().includes(search.toLowerCase()) ||
    memberName.toLowerCase().includes(search.toLowerCase());

  const matchesStatus =
    statusFilter === "All" || status === statusFilter;

  return matchesSearch && matchesStatus;
});


}, [reports, search, statusFilter]);

const totalTransactions = reports.length;

const returnedBooks = reports.filter(
(report) => report.transaction_status === "Returned"
).length;

const issuedBooks = reports.filter(
(report) => report.transaction_status === "Issued"
).length;

const formatDate = (date) => {
if (!date) {
return "—";
}


return new Date(date).toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});


};

return ( <div className="min-h-screen bg-gray-100"> <header className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-lg"> <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5"> <div> <h1 className="text-3xl sm:text-4xl font-bold">
Library Reports </h1>


          <p className="text-blue-100 mt-2">
            Monitor and analyze library transactions
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-white text-blue-700 px-5 py-3 rounded-xl font-semibold hover:bg-blue-50 transition shadow-md"
        >
          🖨️ Print Report
        </button>
      </div>
    </div>
  </header>

  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {error && (
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 font-medium">
        ❌ {error}
      </div>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">
              Total Transactions
            </p>

            <h2 className="text-3xl font-bold text-gray-800 mt-2">
              {totalTransactions}
            </h2>
          </div>

          <div className="text-4xl">📋</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">
              Books Issued
            </p>

            <h2 className="text-3xl font-bold text-blue-600 mt-2">
              {issuedBooks}
            </h2>
          </div>

          <div className="text-4xl">📖</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">
              Books Returned
            </p>

            <h2 className="text-3xl font-bold text-green-600 mt-2">
              {returnedBooks}
            </h2>
          </div>

          <div className="text-4xl">↩️</div>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-end gap-5">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Search Transactions
          </label>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by book or member..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="w-full lg:w-64">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Transaction Status
          </label>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Transactions</option>
            <option value="Issued">Issued</option>
            <option value="Returned">Returned</option>
          </select>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Book Transaction Report
            </h2>

            <p className="text-gray-500 mt-1">
              Showing {filteredReports.length} transaction
              {filteredReports.length !== 1 ? "s" : ""}
            </p>
          </div>

          <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
            Live Report
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">
          Loading reports...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Book
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Member
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Issue Date
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Return Date
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-t border-gray-100 hover:bg-blue-50/40 transition"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          📚
                        </div>

                        <span className="font-semibold text-gray-800">
                          {report.title || "—"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-gray-600">
                      {report.full_name || "—"}
                    </td>

                    <td className="px-6 py-5 text-gray-600">
                      {formatDate(report.issue_date)}
                    </td>

                    <td className="px-6 py-5 text-gray-600">
                      {formatDate(report.return_date)}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                          report.transaction_status === "Returned"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {report.transaction_status || "—"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center"
                  >
                    <div className="text-5xl mb-3">🔍</div>

                    <h3 className="text-lg font-semibold text-gray-700">
                      No transactions found
                    </h3>

                    <p className="text-gray-500 mt-1">
                      Try changing your search or filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </main>
</div>


);
}

export default Reports;
