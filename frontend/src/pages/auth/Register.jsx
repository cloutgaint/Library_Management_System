import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthCard from "../../components/ui/AuthCard";
import InputField from "../../components/ui/InputField";
import PasswordField from "../../components/ui/PasswordField";
import Button from "../../components/ui/Button";
import { apiRequest } from "../../lib/api";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmError("");
    setTermsError("");
    setRegisterError("");

    let valid = true;

    if (name.trim() === "") {
      setNameError("Full Name is required");
      valid = false;
    }

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
    } else if (password.length < 10 || password.length > 128) {
      setPasswordError("Password must be between 10 and 128 characters");
      valid = false;
    } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setPasswordError(
        "Password must contain at least one letter and one number",
      );
      valid = false;
    }

    if (confirmPassword === "") {
      setConfirmError("Confirm Password is required");
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      valid = false;
    }

    if (!acceptTerms) {
      setTermsError("Please accept Terms & Conditions");
      valid = false;
    }

    if (!valid) return;

    setLoading(true);

    // Public registration always creates a Member account; no role is sent.
    const { ok, status, data } = await apiRequest("/api/auth/register", {
      method: "POST",
      body: {
        full_name: name.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
      },
    });

    setLoading(false);

    if (!ok) {
      const fieldErrors = data.errors || {};

      if (fieldErrors.full_name) setNameError(fieldErrors.full_name);
      if (fieldErrors.email) setEmailError(fieldErrors.email);
      if (fieldErrors.password) setPasswordError(fieldErrors.password);
      if (fieldErrors.confirm_password)
        setConfirmError(fieldErrors.confirm_password);

      if (!Object.keys(fieldErrors).length || status === 0) {
        setRegisterError(data.message || "Registration failed");
      }

      return;
    }

    navigate("/", { replace: true, state: { registered: true } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-100 to-blue-100 flex items-center justify-center px-4">
      <AuthCard
        title="Library Management System"
        subtitle="Create your account"
      >
        <form onSubmit={handleRegister} noValidate>
          <InputField
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={nameError}
          />

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
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            autoComplete="new-password"
          />
          <p className="-mt-3 mb-5 text-xs text-gray-500">
            At least 10 characters, including a letter and a number.
          </p>

          <PasswordField
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmError}
            autoComplete="new-password"
          />

          <div className="mb-5">
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              I accept the Terms & Conditions
            </label>

            {termsError && (
              <p className="text-red-500 text-sm mt-2">{termsError}</p>
            )}
          </div>

          {registerError && (
            <p role="alert" className="text-red-600 text-sm mb-4">
              {registerError}
            </p>
          )}

          <Button
            text={loading ? "Creating Account..." : "Create Account"}
            type="submit"
            disabled={loading}
          />

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?
              <Link
                to="/"
                className="ml-2 text-blue-600 font-semibold hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}

export default Register;
