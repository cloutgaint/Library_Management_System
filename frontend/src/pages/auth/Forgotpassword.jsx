import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import AuthCard from "../../components/ui/AuthCard";

import InputField from "../../components/ui/InputField";

import PasswordField from "../../components/ui/PasswordField";

import Button from "../../components/ui/Button";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setEmailError("");
    setPasswordError("");
    setConfirmError("");
    setSuccessMessage("");
    setErrorMessage("");

    let valid = true;

    if (email.trim() === "") {
      setEmailError("Email is required");
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Enter a valid email");
      valid = false;
    }

    if (newPassword === "") {
      setPasswordError("New Password is required");
      valid = false;
    } else if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    }

    if (confirmPassword === "") {
      setConfirmError("Confirm Password is required");
      valid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match");
      valid = false;
    }

    if (!valid) return;

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            newPassword: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Failed to update password");
        return;
      }

      setSuccessMessage(data.message || "Password Updated Successfully");

      setEmail("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Forgot Password Error:", error);

      setErrorMessage(
        "Unable to connect to server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-100 to-blue-100 flex items-center justify-center px-4">
      <AuthCard
        title="Library Management System"
        subtitle="Reset your password"
      >
        <form onSubmit={handleSubmit}>
          <InputField
            label="Email Address"
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
          />

          <PasswordField
            label="New Password"
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={passwordError}
          />

          <PasswordField
            label="Confirm New Password"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmError}
          />

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-100 text-red-700 text-sm">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-lg bg-green-100 text-green-700 text-sm">
              {successMessage}
            </div>
          )}

          <Button
            text={loading ? "Updating Password..." : "Update Password"}
            type="submit"
          />

          <div className="text-center mt-6">
            <Link
              to="/"
              className="text-blue-600 font-semibold hover:underline"
            >
              ← Back to Login
            </Link>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}

export default ForgotPassword;