import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./authContext";
import { apiRequest } from "../lib/api";

const SESSION_EXPIRED = "Your session has expired. Please log in again.";

const storeSession = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

const clearStoredSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// Asks the server who the stored token belongs to and returns the resulting session state.
const fetchSession = async () => {
  const { ok, status, data } = await apiRequest("/api/auth/me");

  if (ok) {
    localStorage.setItem("user", JSON.stringify(data.user));
    return { status: "authenticated", user: data.user };
  }

  if (status === 401) {
    clearStoredSession();
    return { status: "anonymous", user: null, expired: true };
  }

  return { status: "error", user: null, message: data.message || "Unable to verify your session." };
};

const authorizationOf = (input, init) => {
  try {
    return new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)).get("Authorization");
  } catch {
    return null;
  }
};

// Holds the server-verified account. The stored token is re-checked with
// /api/auth/me on every page load, so a role edited in localStorage is never trusted.
export default function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(() =>
    localStorage.getItem("token") ? { status: "loading", user: null } : { status: "anonymous", user: null }
  );
  const [notice, setNotice] = useState("");
  const navigateRef = useRef(navigate);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const expireSession = useCallback((message = SESSION_EXPIRED) => {
    clearStoredSession();
    setSession({ status: "anonymous", user: null });
    setNotice(message);
    navigateRef.current("/", { replace: true });
  }, []);

  const verify = useCallback(async () => {
    setSession(await fetchSession());
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) return undefined;

    let active = true;
    fetchSession().then((next) => {
      if (!active) return;
      setSession(next);
      if (next.expired) setNotice(SESSION_EXPIRED);
    });

    return () => {
      active = false;
    };
  }, []);

  // Any API call rejected with 401 for the current token ends the session app-wide,
  // including pages that call fetch directly.
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (input, init) => {
      const response = await originalFetch(input, init);
      const token = localStorage.getItem("token");

      if (response.status === 401 && token && authorizationOf(input, init) === `Bearer ${token}`) {
        expireSession();
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [expireSession]);

  // Logging out in another tab logs out this one too.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === "token" && !event.newValue) {
        setSession({ status: "anonymous", user: null });
        navigateRef.current("/", { replace: true });
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback(async (email, password) => {
    const { ok, data } = await apiRequest("/api/auth/login", { method: "POST", body: { email, password } });

    if (!ok) {
      return { ok: false, message: data.message || "Login failed" };
    }

    storeSession(data.token, data.user);
    setNotice("");
    setSession({ status: "authenticated", user: data.user });
    return { ok: true, user: data.user };
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setSession({ status: "anonymous", user: null });
    navigateRef.current("/", { replace: true });
  }, []);

  const value = useMemo(
    () => ({
      ...session,
      notice,
      clearNotice: () => setNotice(""),
      login,
      logout,
      retry: verify,
    }),
    [session, notice, login, logout, verify]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
