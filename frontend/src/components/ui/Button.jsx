function Button({
  text,
  type = "button",
  onClick,
  className = "",
  disabled = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full
        bg-blue-600
        text-white
        py-3
        rounded-lg
        font-semibold
        hover:bg-blue-700
        transition
        duration-300
        disabled:bg-gray-400
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      {text}
    </button>
  );
}

export default Button;