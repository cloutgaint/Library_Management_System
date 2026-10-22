import { useEffect, useState } from "react";

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const fetchNotifications = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        "http://localhost:5000/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch notifications"
        );
      }

      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNotifications(true);

    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/notifications/${id}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to mark notification as read"
        );
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredNotifications =
    filter === "All"
      ? notifications
      : filter === "Unread"
      ? notifications.filter(
          (notification) => !notification.is_read
        )
      : notifications.filter(
          (notification) => notification.is_read
        );

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const readCount = notifications.filter(
    (notification) => notification.is_read
  ).length;

  const getIcon = (type) => {
    const value = type?.toLowerCase();

    if (value?.includes("due") || value?.includes("return")) {
      return "⏰";
    }

    if (value?.includes("reservation")) {
      return "📋";
    }

    if (value?.includes("fine") || value?.includes("payment")) {
      return "💰";
    }

    if (value?.includes("book")) {
      return "📚";
    }

    if (value?.includes("overdue")) {
      return "⚠️";
    }

    if (value?.includes("stock")) {
      return "📦";
    }

    return "🔔";
  };

  const formatTime = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">
                Notification Center
              </h1>

              <p className="text-blue-100 mt-2">
                Stay updated with your library activities
              </p>
            </div>
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
                <p className="text-sm text-gray-500">
                  Total Notifications
                </p>

                <h2 className="text-3xl font-bold text-gray-800 mt-2">
                  {notifications.length}
                </h2>
              </div>

              <div className="text-4xl">
                🔔
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 border border-blue-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">
                  Unread
                </p>

                <h2 className="text-3xl font-bold text-blue-600 mt-2">
                  {unreadCount}
                </h2>
              </div>

              <div className="text-4xl">
                📩
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">
                  Read
                </p>

                <h2 className="text-3xl font-bold text-green-600 mt-2">
                  {readCount}
                </h2>
              </div>

              <div className="text-4xl">
                ✓
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Your Notifications
                </h2>

                <p className="text-gray-500 mt-1">
                  Important updates about your library account
                </p>
              </div>

              <div className="flex gap-2">
                {["All", "Unread", "Read"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      filter === item
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {item}

                    {item === "Unread" && unreadCount > 0 && (
                      <span className="ml-2 bg-white text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading notifications...
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-6 transition hover:bg-gray-50 ${
                      !notification.is_read
                        ? "bg-blue-50/40"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                          notification.is_read
                            ? "bg-gray-100"
                            : "bg-blue-100"
                        }`}
                      >
                        {getIcon(notification.type)}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-800">
                            {notification.title}
                          </h3>

                          {!notification.is_read && (
                            <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                              NEW
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 mt-2 leading-relaxed">
                          {notification.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                          <span>
                            📌 {notification.type}
                          </span>

                          <span>
                            🕐 {formatTime(notification.created_at)}
                          </span>
                        </div>
                      </div>

                      {!notification.is_read && (
                        <div className="sm:self-center">
                          <button
                            onClick={() =>
                              markAsRead(notification.id)
                            }
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition"
                          >
                            Mark as Read
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 px-6">
                  <div className="text-5xl mb-4">
                    🎉
                  </div>

                  <h3 className="text-xl font-bold text-gray-700">
                    No notifications found
                  </h3>

                  <p className="text-gray-500 mt-2">
                    There are no notifications in this category.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default NotificationCenter;