import { useId, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  error,
  autoComplete = "current-password",
}) {
  const [showPassword, setShowPassword] = useState(false);
  const id = useId();

  return (
    <div className="mb-5">
      <label htmlFor={id} className="block mb-2 font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">

        <input
          id={id}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2
          ${
            error
              ? "border-red-500 focus:ring-red-400"
              : "border-gray-300 focus:ring-blue-500"
          }`}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>

      </div>

      {error && (
        <p className="text-red-500 text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default PasswordField;