import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const mobileSheetRef = useRef<HTMLDivElement>(null);

  // Memoize the escape handler to avoid unnecessary re-renders
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  // Handle escape key and body overflow
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleEscape]);

  const sizeStyles = useMemo(
    () => ({
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      "3xl": "max-w-3xl",
      "4xl": "max-w-4xl",
      "5xl": "max-w-5xl",
    }),
    []
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Desktop Modal */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4">
        {/* Backdrop */}
        <div
          role="button"
          tabIndex={-1}
          aria-label="Cerrar modal"
          className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in cursor-pointer"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Enter" && onClose()}
        />

        {/* Modal content */}
        <div
          ref={dialogRef}
          className={`
            relative w-full ${sizeStyles[size]}
            bg-white border border-slate-200
            rounded-2xl shadow-2xl
            flex flex-col max-h-[90vh]
            animate-bounce-in
          `}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              {title && (
                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 hover:rotate-90"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-6 overflow-y-auto">{children}</div>
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <div className="md:hidden fixed inset-0 z-50">
        {/* Backdrop */}
        <div
          role="button"
          tabIndex={-1}
          aria-label="Cerrar modal"
          className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in cursor-pointer"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Enter" && onClose()}
        />

        {/* Bottom Sheet */}
        <div
          ref={mobileSheetRef}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] animate-slide-up"
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-slate-300 rounded-full" />
          </div>

          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-100">
              {title && (
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>

          {/* Safe area spacer for iOS */}
          <div
            className="bg-white"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          />
        </div>
      </div>
    </>
  );
};

export default Modal;
