import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import AuthCard from "../../components/ui/AuthCard";

import InputField from "../../components/ui/InputField";

import PasswordField from "../../components/ui/PasswordField";

import Button from "../../components/ui/Button";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [role, setRole] = useState("admin");

  const [rememberMe, setRememberMe] = useState(false);

  const [emailError, setEmailError] = useState("");

  const [passwordError, setPasswordError] = useState("");

  const [loginError, setLoginError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setEmailError("");

    setPasswordError("");

    setLoginError("");

    let valid = true;

    if (email.trim() === "") {
      setEmailError("Email is required");
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Enter a valid email");
      valid = false;
    }

    if (password.trim() === "") {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    }

    if (!valid) return;

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);

      localStorage.setItem("user", JSON.stringify(data.user));

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      if (data.user.role === "admin") {
        navigate("/admin");
      } else if (data.user.role === "librarian") {
        navigate("/librarian");
      } else if (data.user.role === "member") {
        navigate("/student");
      } else {
        setLoginError("Unknown user role");
      }
    } catch (error) {
      console.error("Login Error:", error);

      setLoginError(
        "Unable to connect to server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-gray-100 to-blue-100 px-4">
      <AuthCard
        title="📚 Library Management System"
        subtitle="Welcome Back! Sign in to continue"
      >
        <form onSubmit={handleLogin}>
          <InputField
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
          />

          <PasswordField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
          />

          <div className="mb-5">
            <label className="mb-2 block font-medium text-gray-700">
              Login As
            </label>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="librarian">Librarian</option>
              <option value="member">Member</option>
            </select>
          </div>

          {loginError && (
            <p className="mb-4 text-sm text-red-600">
              {loginError}
            </p>
          )}

          <div className="mb-6 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />

              Remember Me
            </label>

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