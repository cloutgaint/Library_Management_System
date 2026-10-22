import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthCard from "../../components/ui/AuthCard";
import InputField from "../../components/ui/InputField";
import PasswordField from "../../components/ui/PasswordField";
import Button from "../../components/ui/Button";

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
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
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

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: name,
            email: email,
            password: password,
            role: "member",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setRegisterError(data.message || "Registration failed");
        return;
      }

      alert("Registration Successful!");

      navigate("/");
    } catch (error) {
      console.error("Registration Error:", error);

      setRegisterError(
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
        subtitle="Create your account"
      >
        <form onSubmit={handleRegister}>
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
          />

          <PasswordField
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmError}
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
              <p className="text-red-500 text-sm mt-2">
                {termsError}
              </p>
            )}
          </div>

          {registerError && (
            <p className="text-red-600 text-sm mb-4">
              {registerError}
            </p>
          )}

          <Button
            text={loading ? "Creating Account..." : "Create Account"}
            type="submit"
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