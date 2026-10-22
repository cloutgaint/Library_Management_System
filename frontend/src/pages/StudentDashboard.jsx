import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function MemberDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const memberName = user.full_name || "Member";

  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  const menuItems = [
    {
      title: "Book Catalog",
      description: "Search and explore books available in the library",
      icon: "📚",
      path: "/books",
      color: "blue",
    },
    {
      title: "E-Books",
      description: "Browse and access available digital books",
      icon: "📱",
      path: "/ebooks",
      color: "indigo",
    },
    {
      title: "My Profile",
      description: "View your personal and membership details",
      icon: "👤",
      path: "/profile",
      color: "emerald",
    },
    {
      title: "My Issued Books",
      description: "View your currently issued books",
      icon: "📖",
      path: "/my-issued-books",
      color: "purple",
    },
    {
      title: "My Reservations",
      description: "View and manage your book reservations",
      icon: "📋",
      path: "/reservations",
      color: "orange",
    },
    {
      title: "My Fines",
      description: "View your library fines and payment status",
      icon: "💰",
      path: "/fine-payment-status",
      color: "red",
    },
    {
      title: "Reading History",
      description: "View your previous book borrowing activity",
      icon: "📚",
      path: "/reading-history",
      color: "cyan",
    },
    {
      title: "Notifications",
      description: "View your library notifications and reminders",
      icon: "🔔",
      path: "/notifications",
      color: "amber",
    },
  ];

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!token) {
        setLoadingRecommendations(false);
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/recommendations",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch recommendations");
        }

        const data = await response.json();

        setRecommendations(data.recommendations || []);
      } catch (error) {
        console.error("Recommendation Error:", error);
        setRecommendations([]);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [token]);

  const getCardColor = (color) => {
    const colors = {
      blue: {
        background: "bg-blue-600",
        hover: "hover:bg-blue-700",
        text: "text-blue-100",
      },
      indigo: {
        background: "bg-indigo-600",
        hover: "hover:bg-indigo-700",
        text: "text-indigo-100",
      },
      emerald: {
        background: "bg-emerald-600",
        hover: "hover:bg-emerald-700",
        text: "text-emerald-100",
      },
      purple: {
        background: "bg-purple-600",
        hover: "hover:bg-purple-700",
        text: "text-purple-100",
      },
      orange: {
        background: "bg-orange-500",
        hover: "hover:bg-orange-600",
        text: "text-orange-100",
      },
      red: {
        background: "bg-red-600",
        hover: "hover:bg-red-700",
        text: "text-red-100",
      },
      cyan: {
        background: "bg-cyan-600",
        hover: "hover:bg-cyan-700",
        text: "text-cyan-100",
      },
      amber: {
        background: "bg-amber-500",
        hover: "hover:bg-amber-600",
        text: "text-amber-100",
      },
    };

    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">
                Library Management System
              </p>

              <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                Member Dashboard
              </h1>

              <p className="mt-2 text-blue-100">
                Welcome, {memberName}! Manage your library activities from
                here.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
                {memberName.charAt(0).toUpperCase()}
              </div>

              <div>
                <p className="text-sm font-semibold">{memberName}</p>
                <p className="text-xs text-blue-100">Member</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            My Library
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-800">
            Library Services
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Access your books, e-books, reservations, fines, profile,
            notifications, recommendations, and borrowing activity from one
            place.
          </p>
        </section>

        <section className="mb-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-800">
              Recommended Books
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Books recommended based on your previous borrowing activity.
            </p>
          </div>

          {loadingRecommendations ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              Loading recommendations...
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              No recommendations available yet. Borrow some books to get
              personalized recommendations.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((book) => (
                <div
                  key={book.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                      {book.image ? (
                        <img
                          src={book.image}
                          alt={book.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">📚</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800">
                        {book.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {book.author}
                      </p>

                      {book.category && (
                        <span className="mt-2 inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                          {book.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {book.description && (
                    <p className="mt-4 line-clamp-2 text-sm leading-5 text-slate-500">
                      {book.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs font-medium text-slate-500">
                      Available: {book.available_copies ?? 0}
                    </span>

                    <Link
                      to="/books"
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View Book →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Quick Access
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose a service to continue.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {menuItems.map((item) => {
              const cardColor = getCardColor(item.color);

              return (
                <Link
                  key={item.path + item.title}
                  to={item.path}
                  className={`group rounded-2xl ${cardColor.background} ${cardColor.hover} p-5 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
                >
                  <div className="mb-3 text-2xl">{item.icon}</div>

                  <p className="font-semibold">{item.title}</p>

                  <p className={`mt-1 text-xs ${cardColor.text}`}>
                    {item.description}
                  </p>

                  <div className="mt-4 text-sm transition-transform group-hover:translate-x-1">
                    Open →
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Need a book?
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Browse the catalog to search, filter, and explore available
                books.
              </p>
            </div>

            <Link
              to="/books"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Browse Books →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default MemberDashboard;