import { useState } from "react";

import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import AuthCard from "../../components/ui/AuthCard";

import InputField from "../../components/ui/InputField";

import PasswordField from "../../components/ui/PasswordField";

import Button from "../../components/ui/Button";

import { useAuth } from "../../auth/authContext";

import { dashboardPathForRole, postLoginPath } from "../../auth/roles";

// One login page for every role. The role is decided by the server from the
// account record, never chosen by the user.
function Login() {
  const navigate = useNavigate();

  const location = useLocation();

  const { status, user, login, notice, clearNotice } = useAuth();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");

  const [passwordError, setPasswordError] = useState("");

  const [loginError, setLoginError] = useState("");

  const [loading, setLoading] = useState(false);

  // Already signed in (for example after a browser refresh): go to the verified dashboard.
  if (status === "authenticated" && !loading) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();

    setEmailError("");

    setPasswordError("");

    setLoginError("");

    clearNotice();

    let valid = true;

    if (email.trim() === "") {
      setEmailError("Email is required");
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Enter a valid email");
      valid = false;
    }

    if (password === "") {
      setPasswordError("Password is required");
      valid = false;
    }

    if (!valid) return;

    setLoading(true);

    const result = await login(email.trim(), password);

    if (!result.ok) {
      setLoading(false);
      setLoginError(result.message);
      return;
    }

    navigate(postLoginPath(result.user.role, location.state?.from), {
      replace: true,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-gray-100 to-blue-100 px-4">
      <AuthCard
        title="📚 Library Management System"
        subtitle="Welcome Back! Sign in to continue"
      >
        <form onSubmit={handleLogin} noValidate>
          {location.state?.registered && !notice && !loginError && (
            <p
              role="status"
              className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800"
            >
              Registration successful. Log in with your new account.
            </p>
          )}

          {notice && (
            <p
              role="status"
              className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              {notice}
            </p>
          )}

          <InputField
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            autoComplete="username"
          />

          <PasswordField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
          />

          {loginError && (
            <p role="alert" className="mb-4 text-sm text-red-600">
              {loginError}
            </p>
          )}

          <div className="mb-6 flex items-center justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <Button
            text={loading ? "Logging in..." : "Login"}
            type="submit"
            disabled={loading}
          />

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?
              <Link
                to="/register"
                className="ml-2 font-semibold text-blue-600 hover:underline"
              >
                Register
              </Link>
            </p>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}

export default Login;
