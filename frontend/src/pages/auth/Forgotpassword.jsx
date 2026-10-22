import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";
export default function ForgotPassword() {
  const [email, setEmail] = useState(""),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const { ok, data } = await apiRequest("/api/auth/forgot-password", {
      method: "POST",
      body: { email: email.trim() },
    });
    setResult({
      ok,
      message:
        data.message ||
        (ok ? "Request completed" : "Password recovery is unavailable"),
    });
    setBusy(false);
  };
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-xl border p-6"
      >
        <h1 className="text-xl font-bold">Reset password</h1>
        <p>Enter your account email to receive a time-limited reset link.</p>
        <label className="block">
          Email
          <input
            type="email"
            autoComplete="username"
            required
            className="block w-full rounded border p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button
          disabled={busy}
          className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-60"
        >
          {busy ? "Sending..." : "Send reset link"}
        </button>
        {result && (
          <p
            role={result.ok ? "status" : "alert"}
            className={result.ok ? "text-green-700" : "text-red-600"}
          >
            {result.message}
          </p>
        )}
        <Link to="/" className="block underline">
          Back to login
        </Link>
      </form>
    </main>
  );
}
