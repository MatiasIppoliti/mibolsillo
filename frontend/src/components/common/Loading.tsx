import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  size = "md",
  text,
  fullScreen = false,
}) => {
  const sizeStyles = {
    sm: 20,
    md: 32,
    lg: 48,
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2 size={sizeStyles[size]} className="animate-spin text-blue-500" />
      {text && (
        <p className="text-sm font-medium text-slate-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
