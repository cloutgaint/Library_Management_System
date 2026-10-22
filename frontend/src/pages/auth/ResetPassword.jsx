import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";
// Completes both password resets and staff/member invitations (token in the URL fragment).
export default function ResetPassword() {
  const [token] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
  );
  const [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setResult(null);
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
      return setResult({
        ok: false,
        message: "Password must contain at least one letter and one number",
      });
    if (password !== confirm)
      return setResult({ ok: false, message: "Passwords do not match" });
    setBusy(true);
    const { ok, data } = await apiRequest("/api/auth/reset-password", {
      method: "POST",
      body: { token, newPassword: password },
    });
    setResult({
      ok,
      message:
        data.message || (ok ? "Password updated" : "Unable to reset password"),
    });
    setBusy(false);
    // The token is single-use; remove it from the address bar and history.
    if (ok) window.history.replaceState(null, "", window.location.pathname);
  };
  const done = result?.ok;
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-xl border p-6"
      >
        <h1 className="text-xl font-bold">Choose a new password</h1>
        {!done && (
          <>
            <label className="block">
              New password
              <input
                type="password"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                required
                className="block w-full rounded border p-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="block">
              Confirm new password
              <input
                type="password"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                required
                className="block w-full rounded border p-2"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
            <p className="text-xs text-gray-500">
              At least 10 characters, including a letter and a number.
            </p>
            <button
              disabled={busy || !token}
              className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-60"
            >
              {busy ? "Updating..." : "Update password"}
            </button>
          </>
        )}
        {!token && !done && (
          <p role="alert" className="text-red-600">
            Reset token missing. Use the link from your email.
          </p>
        )}
        {result && (
          <p
            role={result.ok ? "status" : "alert"}
            className={result.ok ? "text-green-700" : "text-red-600"}
          >
            {result.message}
          </p>
        )}
        <Link to="/" className="block underline">
          {done ? "Continue to login" : "Back to login"}
        </Link>
      </form>
    </main>
  );
}
