import { useEffect, useState } from "react";
import {
BarChart,
Bar,
LineChart,
Line,
PieChart,
Pie,
Cell,
XAxis,
YAxis,
CartesianGrid,
Tooltip,
Legend,
ResponsiveContainer,
} from "recharts";

function Charts() {
const [books, setBooks] = useState([]);
const [transactions, setTransactions] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
async function loadData() {
try {
setLoading(true);
setError("");


    const token = localStorage.getItem("token");

    const booksResponse = await fetch(
      "http://localhost:5000/api/books",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const booksData = await booksResponse.json();

    if (!booksResponse.ok) {
      throw new Error(
        booksData.message || "Failed to load books"
      );
    }

    setBooks(booksData.books || []);

    const transactionsResponse = await fetch(
      "http://localhost:5000/api/borrow-transactions",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const transactionsData =
      await transactionsResponse.json();

    if (!transactionsResponse.ok) {
      throw new Error(
        transactionsData.message ||
          "Failed to load transactions"
      );
    }

    setTransactions(
      transactionsData.transactions || []
    );
  } catch (err) {
    setError(err.message || "Failed to load chart data");
  } finally {
    setLoading(false);
  }
}

loadData();


}, []);

const monthlyData = [
{ month: "Jan", books: 0 },
{ month: "Feb", books: 0 },
{ month: "Mar", books: 0 },
{ month: "Apr", books: 0 },
{ month: "May", books: 0 },
{ month: "Jun", books: 0 },
{ month: "Jul", books: 0 },
{ month: "Aug", books: 0 },
{ month: "Sep", books: 0 },
{ month: "Oct", books: 0 },
{ month: "Nov", books: 0 },
{ month: "Dec", books: 0 },
];

transactions.forEach((transaction) => {
if (!transaction.issue_date) {
return;
}


const date = new Date(transaction.issue_date);
const monthIndex = date.getMonth();

if (monthlyData[monthIndex]) {
  monthlyData[monthIndex].books += 1;
}


});

const categoryData = [];

books.forEach((book) => {
const category = book.category || "Other";


const existingCategory = categoryData.find(
  (item) => item.name === category
);

if (existingCategory) {
  existingCategory.value += 1;
} else {
  categoryData.push({
    name: category,
    value: 1,
  });
}


});

if (loading) {
return ( <div className="min-h-screen bg-gray-100 flex items-center justify-center"> <div className="bg-white rounded-2xl shadow-lg p-10 text-gray-600">
Loading charts... </div> </div>
);
}

if (error) {
return ( <div className="min-h-screen bg-gray-100 p-8"> <div className="max-w-7xl mx-auto bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">
❌ {error} </div> </div>
);
}

return ( <div className="min-h-screen bg-gray-100"> <div className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white"> <div className="max-w-7xl mx-auto px-6 py-8"> <h1 className="text-4xl font-bold">
Charts & Graphs </h1>


      <p className="text-blue-100 mt-2">
        Visual representation of library data
      </p>
    </div>
  </div>

  <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Monthly Books Issued
      </h2>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month" />

          <YAxis allowDecimals={false} />

          <Tooltip />

          <Legend />

          <Bar
            dataKey="books"
            fill="#2563eb"
            name="Books Issued"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Monthly Issue Trend
      </h2>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month" />

          <YAxis allowDecimals={false} />

          <Tooltip />

          <Legend />

          <Line
            type="monotone"
            dataKey="books"
            stroke="#16a34a"
            strokeWidth={3}
            name="Books Issued"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>

    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Books by Category
      </h2>

      {categoryData.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-gray-500">
          No category data available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={categoryData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {categoryData.map((entry, index) => (
                <Cell key={`${entry.name}-${index}`} />
              ))}
            </Pie>

            <Tooltip />

            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
</div>


);
}

export default Charts;
