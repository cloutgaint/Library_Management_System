import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    booksIssued: 0,
    overdueBooks: 0,
  });

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error(
            "Authentication token not found. Please login again."
          );
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const [
          booksResponse,
          transactionsResponse,
          notificationsResponse,
        ] = await Promise.all([
          fetch("http://localhost:5000/api/books", {
            method: "GET",
            headers,
          }),
          fetch("http://localhost:5000/api/borrow-transactions", {
            method: "GET",
            headers,
          }),
          fetch("http://localhost:5000/api/notifications", {
            method: "GET",
            headers,
          }),
        ]);

        const booksData = await booksResponse.json();
        const transactionsData = await transactionsResponse.json();
        const notificationsData = await notificationsResponse.json();

        if (!booksResponse.ok || !transactionsResponse.ok) {
          if (
            booksResponse.status === 401 ||
            booksResponse.status === 403 ||
            transactionsResponse.status === 401 ||
            transactionsResponse.status === 403
          ) {
            throw new Error(
              "You are not authorized to view the admin dashboard data."
            );
          }

          throw new Error("Failed to load dashboard data.");
        }

        const books = Array.isArray(booksData.books)
          ? booksData.books
          : [];

        const transactions = Array.isArray(
          transactionsData.transactions
        )
          ? transactionsData.transactions
          : [];

        const notifications = Array.isArray(
          notificationsData.notifications
        )
          ? notificationsData.notifications
          : [];

        const totalBooks = books.length;

        const availableBooks = books.filter(
          (book) => book.status === "Available"
        ).length;

        const issuedTransactions = transactions.filter((transaction) => {
          const status = String(
            transaction.transaction_status ??
              transaction.status ??
              ""
          ).toLowerCase();

          return status === "issued" || status === "active";
        });

        const booksIssued = issuedTransactions.length;

        const today = new Date();

        const overdueTransactions = issuedTransactions.filter(
          (transaction) => {
            const dueDate =
              transaction.due_date ?? transaction.dueDate;

            if (!dueDate) {
              return false;
            }

            const due = new Date(dueDate);

            return !Number.isNaN(due.getTime()) && due < today;
          }
        );

        const overdueBooks = overdueTransactions.length;

        setStats({
          totalBooks,
          availableBooks,
          booksIssued,
          overdueBooks,
        });

        const unreadCount = notifications.filter(
          (notification) =>
            notification.is_read === false ||
            notification.is_read === 0 ||
            notification.read === false
        ).length;

        setUnreadNotifications(unreadCount);

        const latestActivities = transactions
          .slice()
          .sort((a, b) => {
            const dateA = new Date(
              a.issue_date ??
                a.created_at ??
                a.createdAt ??
                0
            );

            const dateB = new Date(
              b.issue_date ??
                b.created_at ??
                b.createdAt ??
                0
            );

            return dateB - dateA;
          })
          .slice(0, 5)
          .map((transaction) => {
            const status = String(
              transaction.transaction_status ??
                transaction.status ??
                ""
            ).toLowerCase();

            let action = "Borrowing activity";
            let icon = "📋";

            if (
              status === "issued" ||
              status === "active"
            ) {
              action = "Book issued";
              icon = "📖";
            } else if (status === "returned") {
              action = "Book returned";
              icon = "↩️";
            }

            const memberName =
              transaction.full_name ??
              transaction.member_name ??
              transaction.memberName ??
              "Member";

            const dateValue =
              transaction.issue_date ??
              transaction.created_at ??
              transaction.createdAt;

            let time = "Recently";

            if (dateValue) {
              const activityDate = new Date(dateValue);

              if (!Number.isNaN(activityDate.getTime())) {
                time = activityDate.toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                );
              }
            }

            return {
              action,
              user: memberName,
              time,
              icon,
            };
          });

        setActivities(latestActivities);
      } catch (err) {
        console.error("Admin Dashboard Error:", err);

        setError(
          err.message ||
            "Unable to load dashboard information."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen((previous) => !previous);
  };

  const statCards = [
    {
      title: "Total Books",
      value: stats.totalBooks,
      icon: "📚",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      path: "/books",
      description: "Books in catalog",
    },
    {
      title: "Available Books",
      value: stats.availableBooks,
      icon: "📗",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      path: "/books",
      description: "Currently available",
    },
    {
      title: "Books Issued",
      value: stats.booksIssued,
      icon: "📖",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      path: "/issue-book",
      description: "Currently issued",
    },
    {
      title: "Overdue Books",
      value: stats.overdueBooks,
      icon: "⏰",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      path: "/fines",
      description: "Past their due date",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
              <button
                onClick={toggleSidebar}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-xl text-white transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/70 sm:h-11 sm:w-11 sm:text-2xl"
                aria-label="Toggle navigation menu"
                title="Menu"
              >
                ☰
              </button>

              <div className="min-w-0">
                <p className="hidden text-xs font-medium uppercase tracking-wider text-blue-100 sm:block sm:text-sm">
                  Library Management System
                </p>

                <h1 className="truncate text-lg font-bold sm:text-2xl lg:text-3xl">
                  Admin Dashboard
                </h1>

                <p className="mt-1 hidden text-sm text-blue-100 sm:block">
                  Monitor and manage your library from one place.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-5">
              <Link
                to="/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-lg transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/70 sm:h-12 sm:w-12 sm:text-xl"
                title="Notifications"
                aria-label="Notifications"
              >
                🔔

                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-indigo-700 bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadNotifications > 9
                      ? "9+"
                      : unreadNotifications}
                  </span>
                )}
              </Link>

              <div className="hidden h-10 w-px bg-white/20 sm:block"></div>

              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-bold text-blue-700 shadow-lg sm:h-12 sm:w-12">
                  A
                </div>

                <div>
                  <p className="font-semibold">Admin</p>
                  <p className="text-xs text-blue-100">
                    Administrator
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-950/50"
          aria-hidden="true"
        ></div>
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[min(18rem,85vw)] transform overflow-y-auto bg-slate-950 p-4 text-white transition-transform duration-300 sm:w-72 sm:p-5 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
        aria-label="Admin navigation"
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📚</span>

              <h2 className="truncate text-xl font-bold">
                Library LMS
              </h2>
            </div>

            <p className="ml-8 mt-1 text-xs text-slate-400">
              Administration Portal
            </p>
          </div>

          <button
            onClick={closeSidebar}
            className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        <nav className="space-y-1">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>

          <Link
            to="/admin"
            onClick={closeSidebar}
            className="flex items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-900/20"
          >
            <span>🏠</span>
            <span>Dashboard</span>
          </Link>

          <Link
            to="/books"
            onClick={closeSidebar}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span>📚</span>
            <span>Books</span>
          </Link>

          <Link
            to="/ebooks"
            onClick={closeSidebar}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span>📱</span>
            <span>E-Books</span>
          </Link>

          <Link
            to="/issue-book"
            onClick={closeSidebar}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span>📖</span>
            <span>Issue Book</span>
          </Link>

          <Link
            to="/return-book"
            onClick={closeSidebar}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span>↩️</span>
            <span>Return Book</span>
          </Link>

          <Link
            to="/renew-book"
            onClick={closeSidebar}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span>🔄</span>
            <span>Renew Book</span>
          </Link>

          <Link
            to="/qr-scanner"
            onClick={closeSidebar}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span>📷</span>
            <span>QR Scanner</span>
          </Link>

          <Link
            to="/reservation-queue"
            onClick={closeSidebar}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span>📋</span>
            <span>Reservation Management</span>
          </Link>

          <Link
            to="/fines"
            onClick={closeSidebar}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span>💰</span>
            <span>Fine Management</span>
          </Link>

          <Link
            to="/notifications"
            onClick={closeSidebar}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span>🔔</span>
            <span>Notifications</span>
          </Link>

          <p className="mb-3 px-3 pt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Insights
          </p>

          <Link
            to="/analytics"
            onClick={closeSidebar}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span>📊</span>
            <span>Analytics</span>
          </Link>

          <Link
            to="/reports"
            onClick={closeSidebar}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span>📑</span>
            <span>Reports</span>
          </Link>
        </nav>

        <div className="mt-8 pb-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              System Status
            </p>

            <div className="mt-3 flex items-start gap-2">
              <span className="relative mt-1 flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
              </span>

              <span className="text-sm font-medium leading-5 text-slate-300">
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0">
        <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
          <div className="mb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <p className="mb-2 text-sm font-semibold text-blue-600">
                  OVERVIEW
                </p>

                <h2 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                  Library Overview
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Monitor books, circulation, overdue items and
                  important library activity.
                </p>
              </div>

              <Link
                to="/reports"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:w-auto"
              >
                📑
                View Reports
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                  ⚠️
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-red-800">
                    Unable to load dashboard data
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((stat) => (
              <Link
                key={stat.title}
                to={stat.path}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>

                    {loading ? (
                      <div className="mt-2 h-9 w-20 animate-pulse rounded-lg bg-slate-200"></div>
                    ) : (
                      <h3 className="mt-2 text-3xl font-bold text-slate-800">
                        {stat.value.toLocaleString("en-IN")}
                      </h3>
                    )}

                    <p className="mt-2 text-xs text-slate-400">
                      {stat.description}
                    </p>
                  </div>

                  <div
                    className={`${stat.iconBg} ${stat.iconColor} flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-transform group-hover:scale-110`}
                  >
                    {stat.icon}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-semibold text-blue-600">
                    View details
                  </span>

                  <span className="text-blue-600 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <section className="mt-8">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-800">
                Quick Actions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Access common library operations quickly.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <Link
                to="/books"
                className="group rounded-2xl bg-blue-600 p-5 text-white shadow-sm transition hover:bg-blue-700 hover:shadow-lg"
              >
                <div className="mb-3 text-2xl">📚</div>
                <p className="font-semibold">Manage Books</p>
                <p className="mt-1 text-xs text-blue-100">
                  Add, edit and manage catalog
                </p>
                <div className="mt-4 text-sm transition-transform group-hover:translate-x-1">
                  Open →
                </div>
              </Link>

              <Link
                to="/ebooks"
                className="group rounded-2xl bg-indigo-600 p-5 text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-lg"
              >
                <div className="mb-3 text-2xl">📱</div>
                <p className="font-semibold">E-Books</p>
                <p className="mt-1 text-xs text-indigo-100">
                  Manage digital books
                </p>
                <div className="mt-4 text-sm transition-transform group-hover:translate-x-1">
                  Open →
                </div>
              </Link>

              <Link
                to="/issue-book"
                className="group rounded-2xl bg-emerald-600 p-5 text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-lg"
              >
                <div className="mb-3 text-2xl">📖</div>
                <p className="font-semibold">Issue Book</p>
                <p className="mt-1 text-xs text-emerald-100">
                  Issue books to members
                </p>
                <div className="mt-4 text-sm transition-transform group-hover:translate-x-1">
                  Open →
                </div>
              </Link>

              <Link
                to="/return-book"
                className="group rounded-2xl bg-green-600 p-5 text-white shadow-sm transition hover:bg-green-700 hover:shadow-lg"
              >
                <div className="mb-3 text-2xl">↩️</div>
                <p className="font-semibold">Return Book</p>
                <p className="mt-1 text-xs text-green-100">
                  Return issued books
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
                  Extend book due dates
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
                  Scan or search book QR codes
                </p>
                <div className="mt-4 text-sm transition-transform group-hover:translate-x-1">
                  Open →
                </div>
              </Link>

              <Link
                to="/reservation-queue"
                className="group rounded-2xl bg-pink-600 p-5 text-white shadow-sm transition hover:bg-pink-700 hover:shadow-lg"
              >
                <div className="mb-3 text-2xl">📋</div>
                <p className="font-semibold">
                  Reservation Management
                </p>
                <p className="mt-1 text-xs text-pink-100">
                  View and manage member reservations
                </p>
                <div className="mt-4 text-sm transition-transform group-hover:translate-x-1">
                  Open →
                </div>
              </Link>

              <Link
                to="/fines"
                className="group rounded-2xl bg-red-600 p-5 text-white shadow-sm transition hover:bg-red-700 hover:shadow-lg"
              >
                <div className="mb-3 text-2xl">💰</div>
                <p className="font-semibold">Fine Management</p>
                <p className="mt-1 text-xs text-red-100">
                  View and manage member fines
                </p>
                <div className="mt-4 text-sm transition-transform group-hover:translate-x-1">
                  Open →
                </div>
              </Link>

              
            </div>
          </section>

          <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Link
              to="/analytics"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                    📊
                  </div>

                  <h2 className="text-xl font-bold text-slate-800">
                    Analytics
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    View borrowing trends, category distribution and
                    fine collection statistics.
                  </p>
                </div>

                <span className="shrink-0 text-2xl text-blue-600 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>

            <Link
              to="/notifications"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-2xl">
                    🔔
                  </div>

                  <h2 className="text-xl font-bold text-slate-800">
                    Notifications
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Stay updated with due dates, reservations and
                    important library alerts.
                  </p>
                </div>

                <span className="shrink-0 text-2xl text-blue-600 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          </section>

          <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
                    Recent Activity
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Latest borrowing activity across the library.
                  </p>
                </div>

                <Link
                  to="/reports"
                  className="shrink-0 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                >
                  View Reports →
                </Link>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 sm:gap-4"
                    >
                      <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-200"></div>

                      <div className="min-w-0 flex-1">
                        <div className="h-4 w-40 max-w-full rounded bg-slate-200"></div>

                        <div className="mt-2 h-3 w-24 rounded bg-slate-100"></div>
                      </div>

                      <div className="h-3 w-16 shrink-0 rounded bg-slate-100 sm:w-20"></div>
                    </div>
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0 sm:items-center sm:gap-4"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                        {activity.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-800">
                          {activity.action}
                        </p>

                        <p className="mt-1 truncate text-sm text-slate-500">
                          By {activity.user}
                        </p>
                      </div>

                      <span className="shrink-0 text-right text-[11px] text-slate-400 sm:text-sm">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="mb-3 text-4xl">📋</div>

                  <p className="font-semibold text-slate-700">
                    No recent activity
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Borrowing activity will appear here.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;