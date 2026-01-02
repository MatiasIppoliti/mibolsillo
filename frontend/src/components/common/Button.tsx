import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "ghost"
    | "outline"
    | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  className = "",
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2 font-semibold rounded-xl
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `;

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-blue-500 to-blue-600
      text-white shadow-md shadow-blue-500/20
      hover:shadow-lg hover:shadow-blue-500/30
      hover:scale-[1.02] active:scale-[0.98]
      focus:ring-blue-500
    `,
    secondary: `
      bg-slate-100 text-slate-900
      border border-slate-200
      hover:bg-slate-200 hover:border-slate-300
      hover:shadow-md
      focus:ring-blue-500
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-400
      text-white shadow-md shadow-red-500/20
      hover:shadow-lg hover:shadow-red-500/30
      hover:scale-[1.02] active:scale-[0.98]
      focus:ring-red-500
    `,
    success: `
      bg-gradient-to-r from-emerald-500 to-emerald-400
      text-white shadow-md shadow-emerald-500/20
      hover:shadow-lg hover:shadow-emerald-500/30
      hover:scale-[1.02] active:scale-[0.98]
      focus:ring-emerald-500
    `,
    ghost: `
      text-slate-600 hover:text-slate-900
      hover:bg-slate-100
      focus:ring-blue-500
    `,
    outline: `
      border-2 border-blue-500 text-blue-500
      hover:bg-blue-500 hover:text-white
      hover:shadow-md hover:shadow-blue-500/20
      focus:ring-blue-500
    `,
  };

  const sizeStyles = {
    sm: "px-3.5 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
};

export default Button;
