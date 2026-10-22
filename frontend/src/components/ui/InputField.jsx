import { useId } from "react";

function InputField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
}) {
  const id = useId();

  return (
    <div className="mb-5">
      <label htmlFor={id} className="block mb-2 font-medium text-gray-700">
        {label}
      </label>

      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
        ${
          error
            ? "border-red-500 focus:ring-red-400"
            : "border-gray-300 focus:ring-blue-500"
        }`}
      />

      {error && (
        <p className="text-red-500 text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default InputField;