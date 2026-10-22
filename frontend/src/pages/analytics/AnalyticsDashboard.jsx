import { useEffect, useMemo, useState } from "react";
import {
BarChart,
Bar,
XAxis,
YAxis,
CartesianGrid,
Tooltip,
ResponsiveContainer,
PieChart,
Pie,
Cell,
Legend,
} from "recharts";

function AnalyticsDashboard() {
const [books, setBooks] = useState([]);
const [members, setMembers] = useState([]);
const [transactions, setTransactions] = useState([]);
const [fines, setFines] = useState([]);

const [period, setPeriod] = useState("This Month");
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
const fetchAnalyticsData = async () => {
try {
setLoading(true);
setError("");


    const token = localStorage.getItem("token");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const [booksResponse, membersResponse, transactionsResponse, finesResponse] =
      await Promise.all([
        fetch("http://localhost:5000/api/books", {
          method: "GET",
          headers,
        }),
        fetch("http://localhost:5000/api/members", {
          method: "GET",
          headers,
        }),
        fetch("http://localhost:5000/api/borrow-transactions", {
          method: "GET",
          headers,
        }),
        fetch("http://localhost:5000/api/fines", {
          method: "GET",
          headers,
        }),
      ]);

    const booksData = await booksResponse.json();
    const membersData = await membersResponse.json();
    const transactionsData = await transactionsResponse.json();
    const finesData = await finesResponse.json();

    if (!booksResponse.ok) {
      throw new Error(booksData.message || "Failed to load books");
    }

    if (!membersResponse.ok) {
      throw new Error(membersData.message || "Failed to load members");
    }

    if (!transactionsResponse.ok) {
      throw new Error(
        transactionsData.message || "Failed to load transactions"
      );
    }

    if (!finesResponse.ok) {
      throw new Error(finesData.message || "Failed to load fines");
    }

    setBooks(booksData.books || []);
    setMembers(membersData.members || []);
    setTransactions(transactionsData.transactions || []);
    setFines(finesData.fines || []);
  } catch (err) {
    setError(err.message || "Failed to load analytics");
  } finally {
    setLoading(false);
  }
};

fetchAnalyticsData();


}, []);

const totalBooks = books.length;
const totalMembers = members.length;

const booksIssued = transactions.filter(
(transaction) => transaction.transaction_status === "Issued"
).length;

const booksReturned = transactions.filter(
(transaction) => transaction.transaction_status === "Returned"
).length;

const monthlyIssues = useMemo(() => {
const months = [
"Jan",
"Feb",
"Mar",
"Apr",
"May",
"Jun",
"Jul",
"Aug",
"Sep",
"Oct",
"Nov",
"Dec",
];


const currentDate = new Date();
const currentMonth = currentDate.getMonth();
const currentYear = currentDate.getFullYear();

let filteredTransactions = transactions;

if (period === "This Month") {
  filteredTransactions = transactions.filter((transaction) => {
    if (!transaction.issue_date) {
      return false;
    }

    const date = new Date(transaction.issue_date);

    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });
}

if (period === "Last 6 Months") {
  const sixMonthsAgo = new Date(
    currentYear,
    currentMonth - 5,
    1
  );

  filteredTransactions = transactions.filter((transaction) => {
    if (!transaction.issue_date) {
      return false;
    }

    const date = new Date(transaction.issue_date);

    return date >= sixMonthsAgo;
  });
}

if (period === "This Year") {
  filteredTransactions = transactions.filter((transaction) => {
    if (!transaction.issue_date) {
      return false;
    }

    const date = new Date(transaction.issue_date);

    return date.getFullYear() === currentYear;
  });
}

const monthCounts = {};

filteredTransactions.forEach((transaction) => {
  if (!transaction.issue_date) {
    return;
  }

  const date = new Date(transaction.issue_date);
  const month = months[date.getMonth()];

  monthCounts[month] = (monthCounts[month] || 0) + 1;
});

if (period === "This Month") {
  const currentMonthName = months[currentMonth];

  return [
    {
      month: currentMonthName,
      value: monthCounts[currentMonthName] || 0,
    },
  ];
}

if (period === "Last 6 Months") {
  const result = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 1);
    const month = months[date.getMonth()];

    result.push({
      month,
      value: monthCounts[month] || 0,
    });
  }

  return result;
}

return months.map((month) => ({
  month,
  value: monthCounts[month] || 0,
}));


}, [transactions, period]);

const categories = useMemo(() => {
const categoryCounts = {};


books.forEach((book) => {
  const category = book.category || "Uncategorized";

  categoryCounts[category] =
    (categoryCounts[category] || 0) + 1;
});

return Object.entries(categoryCounts).map(
  ([name, value]) => ({
    name,
    value,
  })
);


}, [books]);

const mostBorrowedBooks = useMemo(() => {
const bookCounts = {};


transactions.forEach((transaction) => {
  const title = transaction.title || "Unknown Book";

  bookCounts[title] = (bookCounts[title] || 0) + 1;
});

return Object.entries(bookCounts)
  .map(([title, count]) => ({
    title,
    count,
  }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 5);


}, [transactions]);

const maximumBorrowCount =
mostBorrowedBooks.length > 0
? mostBorrowedBooks[0].count
: 1;

const totalFines = fines.reduce(
(total, fine) => total + Number(fine.fine_amount || 0),
0
);

const collectedFines = fines
.filter((fine) => fine.payment_status === "Paid")
.reduce(
(total, fine) => total + Number(fine.fine_amount || 0),
0
);

const pendingFines = fines
.filter((fine) => fine.payment_status !== "Paid")
.reduce(
(total, fine) => total + Number(fine.fine_amount || 0),
0
);

return ( <div className="min-h-screen bg-gray-100"> <div className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white shadow-lg"> <div className="max-w-7xl mx-auto px-6 py-8"> <h1 className="text-4xl font-bold">
Analytics Dashboard </h1>


      <p className="text-blue-100 mt-2">
        Library performance overview
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        {["This Month", "Last 6 Months", "This Year"].map(
          (option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPeriod(option)}
              className={
                period === option
                  ? "bg-white text-indigo-700 px-4 py-2 rounded-lg font-semibold"
                  : "bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30"
              }
            >
              {option}
            </button>
          )
        )}
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-white text-indigo-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-50 transition"
        >
          📥 Export Report
        </button>
      </div>
    </div>
  </div>

  <div className="max-w-7xl mx-auto px-6 py-10">
    {error && (
      <div className="mb-8 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
        ❌ {error}
      </div>
    )}

    {loading ? (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500">
        Loading analytics...
      </div>
    ) : (
      <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-blue-600 text-white rounded-2xl p-6 shadow-lg">
            <p className="text-blue-100">
              Total Books
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {totalBooks}
            </h2>
          </div>

          <div className="bg-green-600 text-white rounded-2xl p-6 shadow-lg">
            <p className="text-green-100">
              Total Members
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {totalMembers}
            </h2>
          </div>

          <div className="bg-purple-600 text-white rounded-2xl p-6 shadow-lg">
            <p className="text-purple-100">
              Books Issued
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {booksIssued}
            </h2>
          </div>

          <div className="bg-orange-500 text-white rounded-2xl p-6 shadow-lg">
            <p className="text-orange-100">
              Books Returned
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {booksReturned}
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Monthly Book Issues
          </h2>

          <div className="w-full h-80">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={monthlyIssues}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="month" />

                <YAxis allowDecimals={false} />

                <Tooltip />

                <Bar
                  dataKey="value"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Books by Category
          </h2>

          {categories.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No category data available.
            </div>
          ) : (
            <div className="w-full h-80">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label
                  >
                    {categories.map((category, index) => (
                      <Cell key={`${category.name}-${index}`} />
                    ))}
                  </Pie>

                  <Tooltip />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Most Borrowed Books
          </h2>

          {mostBorrowedBooks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No borrowing data available.
            </div>
          ) : (
            <div className="space-y-5">
              {mostBorrowedBooks.map((book) => (
                <div key={book.title}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-gray-700">
                      {book.title}
                    </span>

                    <span className="font-semibold text-gray-800">
                      {book.count} issues
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-indigo-600 h-3 rounded-full"
                      style={{
                        width: `${
                          (book.count / maximumBorrowCount) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Fine Collection
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-gray-50 rounded-xl p-5">
              <p className="text-gray-500">
                Total Fines
              </p>

              <h3 className="text-2xl font-bold text-gray-800 mt-2">
                ₹{totalFines.toFixed(2)}
              </h3>
            </div>

            <div className="bg-green-50 rounded-xl p-5">
              <p className="text-gray-500">
                Collected
              </p>

              <h3 className="text-2xl font-bold text-green-600 mt-2">
                ₹{collectedFines.toFixed(2)}
              </h3>
            </div>

            <div className="bg-red-50 rounded-xl p-5">
              <p className="text-gray-500">
                Pending
              </p>

              <h3 className="text-2xl font-bold text-red-600 mt-2">
                ₹{pendingFines.toFixed(2)}
              </h3>
            </div>
          </div>
        </div>
      </>
    )}
  </div>
</div>


);
}

export default AnalyticsDashboard;
