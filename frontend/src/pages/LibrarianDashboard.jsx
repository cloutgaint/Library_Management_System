import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000";

function getToken() {
  return localStorage.getItem("token");
}

async function getData(url) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid server response from ${url}`);
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${response.status}`);
  }

  return data;
}

function getArray(data, possibleKeys = []) {
  if (Array.isArray(data)) return data;

  for (const key of possibleKeys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

function getToday() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
}

function isToday(dateValue) {
  if (!dateValue) return false;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return false;

  const today = getToday();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getTransactionDate(transaction) {
  return (
    transaction.issue_date ||
    transaction.issueDate ||
    transaction.issued_at ||
    transaction.created_at ||
    transaction.createdAt
  );
}

function getReturnDate(transaction) {
  return (
    transaction.return_date ||
    transaction.returnDate ||
    transaction.returned_at ||
    transaction.returnedAt
  );
}

function isActiveTransaction(transaction) {
  const status = String(
    transaction.status ||
      transaction.transaction_status ||
      "",
  ).toLowerCase();

  return (
    status === "issued" ||
    status === "active" ||
    status === "borrowed"
  );
}

export default function LibrarianDashboard() {
  const [stats, setStats] = useState({
    todayIssues: 0,
    todayReturns: 0,
    overdueBooks: 0,
    totalBooks: 0,
    availableBooks: 0,
    pendingReservations: 0,
    pendingFines: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        getData("/api/books"),
        getData("/api/borrow-transactions"),
        getData("/api/reservations"),
        getData("/api/fines"),
      ]);

      const booksData =
        results[0].status === "fulfilled"
          ? results[0].value
          : {};

      const transactionsData =
        results[1].status === "fulfilled"
          ? results[1].value
          : {};

      const reservationsData =
        results[2].status === "fulfilled"
          ? results[2].value
          : {};

      const finesData =
        results[3].status === "fulfilled"
          ? results[3].value
          : {};

      const books = getArray(booksData, ["books", "data"]);

      const transactions = getArray(transactionsData, [
        "transactions",
        "borrowTransactions",
        "data",
      ]);

      const reservations = getArray(reservationsData, [
        "reservations",
        "data",
      ]);

      const fines = getArray(finesData, ["fines", "data"]);

      const todayIssues = transactions.filter((transaction) =>
        isToday(getTransactionDate(transaction)),
      ).length;

      const todayReturns = transactions.filter((transaction) =>
        isToday(getReturnDate(transaction)),
      ).length;

      const today = getToday();

      const overdueBooks = transactions.filter((transaction) => {
        if (!isActiveTransaction(transaction)) {
          return false;
        }

        const dueDateValue =
          transaction.due_date ||
          transaction.dueDate ||
          transaction.due_at;

        if (!dueDateValue) return false;

        const dueDate = new Date(dueDateValue);

        if (Number.isNaN(dueDate.getTime())) return false;

        return dueDate < today;
      }).length;

      const availableBooks = books.filter(
        (book) =>
          String(book.status || "").toLowerCase() === "available",
      ).length;

      const pendingReservations = reservations.filter(
        (reservation) => {
          const status = String(
            reservation.status || "",
          ).toLowerCase();

          return (
            status === "waiting" ||
            status === "pending" ||
            status === "ready"
          );
        },
      ).length;

      const pendingFines = fines.reduce((total, fine) => {
        const status = String(
          fine.status || fine.payment_status || "",
        ).toLowerCase();

        const isPaid =
          status === "paid" ||
          status === "settled" ||
          status === "completed";

        if (isPaid) return total;

        const amount = Number(
          fine.amount ||
            fine.fine_amount ||
            fine.fineAmount ||
            0,
        );

        return total + (Number.isNaN(amount) ? 0 : amount);
      }, 0);

      const activity = transactions
        .filter(
          (transaction) =>
            getTransactionDate(transaction) ||
            getReturnDate(transaction),
        )
        .sort((a, b) => {
          const dateA = new Date(
            getReturnDate(a) || getTransactionDate(a),
          ).getTime();

          const dateB = new Date(
            getReturnDate(b) || getTransactionDate(b),
          ).getTime();

          return dateB - dateA;
        })
        .slice(0, 6)
        .map((transaction) => {
          const returned = Boolean(getReturnDate(transaction));

          return {
            id:
              transaction.id ||
              transaction.transaction_id ||
              `${transaction.book_id || "book"}-${transaction.member_id || "member"}-${getTransactionDate(transaction) || Date.now()}`,

            type: returned ? "Returned" : "Issued",

            bookName:
              transaction.book_title ||
              transaction.book_name ||
              transaction.book?.title ||
              "Book",

            memberName:
              transaction.member_name ||
              transaction.memberName ||
              transaction.member?.full_name ||
              transaction.member?.name ||
              "Member",

            date:
              getReturnDate(transaction) ||
              getTransactionDate(transaction),
          };
        });

      setStats({
        todayIssues,
        todayReturns,
        overdueBooks,
        totalBooks: books.length,
        availableBooks,
        pendingReservations,
        pendingFines,
      });

      setRecentActivity(activity);

      const failedRequests = results.filter(
        (result) => result.status === "rejected",
      );

      if (failedRequests.length === results.length) {
        setError("Unable to load librarian dashboard data.");
      }
    } catch (err) {
      console.error(
        "Error loading librarian dashboard:",
        err,
      );

      setError(
        err.message || "Unable to load dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
              Library LMS
            </p>

            <h1 className="text-xl font-bold sm:text-2xl">
              Librarian Dashboard
            </h1>

            <p className="text-xs text-blue-100 sm:text-sm">
              Manage daily library operations
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl bg-white/15 px-4 py-2 text-2xl font-bold transition hover:bg-white/25"
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={closeSidebar}
        >
          <aside
            className="flex h-full w-72 flex-col bg-slate-950 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Library LMS
                </p>

                <h2 className="text-lg font-bold">
                  Librarian Portal
                </h2>
              </div>

              <button
                type="button"
                onClick={closeSidebar}
                className="rounded-lg px-3 py-2 text-xl text-slate-300 hover:bg-slate-800 hover:text-white"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              <Link
                to="/librarian"
                onClick={closeSidebar}
                className="block rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white"
              >
                📊 Dashboard
              </Link>

              <p className="px-4 pb-2 pt-5 text-xs font-bold uppercase tracking-wider text-slate-500">
                Library Operations
              </p>

              <Link
                to="/issue-book"
                onClick={closeSidebar}
                className="block rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                📚 Issue Book
              </Link>

              <Link
                to="/return-book"
                onClick={closeSidebar}
                className="block rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                ↩️ Return Book
              </Link>

              <Link
                to="/renew-book"
                onClick={closeSidebar}
                className="block rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                🔄 Renew Book
              </Link>

              <Link
                to="/qr-scanner"
                onClick={closeSidebar}
                className="block rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                📷 QR Scanner
              </Link>

              <p className="px-4 pb-2 pt-5 text-xs font-bold uppercase tracking-wider text-slate-500">
                Library
              </p>

              <Link
                to="/books"
                onClick={closeSidebar}
                className="block rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                📖 Book Catalog
              </Link>

              <Link
                to="/ebooks"
                onClick={closeSidebar}
                className="block rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                📚 E-Books
              </Link>

              <Link
                to="/reservation-queue"
                onClick={closeSidebar}
                className="block rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                📋 Reservation Queue
              </Link>

              <Link
                to="/fines"
                onClick={closeSidebar}
                className="block rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                💰 Fine Management
              </Link>

              <Link
                to="/reports"
                onClick={closeSidebar}
                className="block rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                📊 Reports
              </Link>

              <div className="my-5 border-t border-slate-800" />

              <Link
                to="/"
                onClick={closeSidebar}
                className="block rounded-xl px-4 py-3 font-semibold text-red-400 transition hover:bg-red-950"
              >
                🚪 Logout
              </Link>
            </nav>

            <div className="border-t border-slate-800 p-4">
              <div className="rounded-xl bg-slate-900 p-4">
                <p className="text-xs font-semibold text-slate-400">
                  SYSTEM STATUS
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />

                  <span className="text-sm text-slate-300">
                    Library system online
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <section>
          <p className="text-sm font-semibold text-blue-600">
            LIBRARY OPERATIONS
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Library Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monitor today's activity, books, reservations and fines.
          </p>
        </section>

        <section>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                title: "Today's Issues",
                value: stats.todayIssues,
                description: "Books issued today",
                icon: "📚",
                iconClass: "bg-blue-100 text-blue-700",
              },
              {
                title: "Today's Returns",
                value: stats.todayReturns,
                description: "Books returned today",
                icon: "↩️",
                iconClass: "bg-green-100 text-green-700",
              },
              {
                title: "Overdue Books",
                value: stats.overdueBooks,
                description: "Currently overdue",
                icon: "⚠️",
                iconClass: "bg-red-100 text-red-700",
              },
              {
                title: "Total Books",
                value: stats.totalBooks,
                description: "Books in catalog",
                icon: "📖",
                iconClass: "bg-indigo-100 text-indigo-700",
              },
              {
                title: "Available Books",
                value: stats.availableBooks,
                description: "Currently available",
                icon: "✅",
                iconClass: "bg-purple-100 text-purple-700",
              },
              {
                title: "Pending Reservations",
                value: stats.pendingReservations,
                description: "Need attention",
                icon: "📋",
                iconClass: "bg-orange-100 text-orange-700",
              },
            ].map((stat) => (
              <div
                key={stat.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {loading ? "..." : stat.value}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {stat.description}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${stat.iconClass}`}
                  >
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
<section className="mt-8">
  <div className="mb-5">
    <h2 className="text-xl font-bold text-slate-800">
      Quick Operations
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Access common library operations quickly.
    </p>
  </div>

  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Link
      to="/issue-book"
      className="group rounded-2xl bg-blue-600 p-5 text-white shadow-sm transition hover:bg-blue-700 hover:shadow-lg"
    >
      <div className="mb-3 text-2xl">📖</div>

      <p className="font-semibold">Issue Book</p>

      <p className="mt-1 text-xs text-blue-100">
        Issue books to members
      </p>

      <div className="mt-4 text-sm transition-transform group-hover:translate-x-1">
        Open →
      </div>
    </Link>

    <Link
      to="/return-book"
      className="group rounded-2xl bg-emerald-600 p-5 text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-lg"
    >
      <div className="mb-3 text-2xl">↩️</div>

      <p className="font-semibold">Return Book</p>

      <p className="mt-1 text-xs text-emerald-100">
        Process returned books
      </p>

      <div className="mt-4 text-sm transition-transform group-hover:translate-x-1">
        Open →
      </div>
    </Link>

    <Link
      to="/renew-book"
      className="group rounded-2xl bg-purple-600 p-5 text-white shadow-sm transition hover:bg-purple-700 hover:shadow-lg"
    >
      <div className="mb-3 text-2xl">🔄</div>

      <p className="font-semibold">Renew Book</p>

      <p className="mt-1 text-xs text-purple-100">
        Renew member book loans
      </p>

      <div className="mt-4 text-sm transition-transform group-hover:translate-x-1">
        Open →
      </div>
    </Link>

    <Link
      to="/qr-scanner"
      className="group rounded-2xl bg-orange-500 p-5 text-white shadow-sm transition hover:bg-orange-600 hover:shadow-lg"
    >
      <div className="mb-3 text-2xl">📷</div>

      <p className="font-semibold">QR Scanner</p>

      <p className="mt-1 text-xs text-orange-100">
        Scan books and member QR codes
      </p>

      <div className="mt-4 text-sm transition-transform group-hover:translate-x-1">
        Open →
      </div>
    </Link>
  </div>
</section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Today's Summary
            </h2>

            <p className="text-sm text-slate-500">
              Quick view of important library numbers
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-sm text-slate-500">Issues</p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {loading ? "..." : stats.todayIssues}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Returns</p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {loading ? "..." : stats.todayReturns}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Overdue</p>

              <p className="mt-1 text-2xl font-bold text-red-600">
                {loading ? "..." : stats.overdueBooks}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Pending Reservations
              </p>

              <p className="mt-1 text-2xl font-bold text-orange-600">
                {loading ? "..." : stats.pendingReservations}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Outstanding Fines
              </p>

              <p className="mt-1 text-2xl font-bold text-red-600">
                {loading ? "..." : `₹${stats.pendingFines}`}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Recent Library Activity
              </h2>

              <p className="text-sm text-slate-500">
                Latest issue and return transactions
              </p>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Refresh
            </button>
          </div>

          {recentActivity.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No recent activity found.
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {activity.bookName}
                    </p>

                    <p className="text-sm text-slate-500">
                      {activity.memberName}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        activity.type === "Returned"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {activity.type}
                    </span>

                    <p className="mt-1 text-xs text-slate-400">
                      {activity.date
                        ? new Date(activity.date).toLocaleString()
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-orange-200 bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-xl">
                📋
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Reservation Attention
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {stats.pendingReservations > 0
                    ? `${stats.pendingReservations} reservation(s) need attention.`
                    : "No reservations currently need attention."}
                </p>

                <Link
                  to="/reservation-queue"
                  className="mt-4 inline-block font-semibold text-blue-600 hover:underline"
                >
                  Open Reservation Queue →
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-xl">
                💰
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Outstanding Fines
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  ₹{stats.pendingFines} in outstanding fines.
                </p>

                <Link
                  to="/fines"
                  className="mt-4 inline-block font-semibold text-blue-600 hover:underline"
                >
                  Open Fine Management →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}