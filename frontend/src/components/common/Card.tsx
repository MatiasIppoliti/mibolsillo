import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "bordered" | "glass" | "gradient";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "default",
  padding = "md",
  hover = false,
  onClick,
}) => {
  const variantStyles = {
    default: "bg-white border border-slate-200 shadow-sm",
    elevated: "bg-white shadow-lg",
    bordered: "bg-white border-2 border-slate-200",
    glass: "bg-white/90 backdrop-blur-xl border border-white/50",
    gradient:
      "bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm",
  };

  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const hoverStyles = hover
    ? "cursor-pointer transition-all duration-300 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1"
    : "transition-all duration-300";

  return (
    <div
      className={`
        rounded-2xl
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hoverStyles}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export default Card;
