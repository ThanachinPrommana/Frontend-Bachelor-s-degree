// src/components/ui/toast.jsx
import React from "react";

const palette = {
  default: "bg-white text-gray-900 border",
  success: "bg-green-50 text-green-900 border border-green-200",
  destructive: "bg-red-50 text-red-900 border border-red-200",
  warning: "bg-yellow-50 text-yellow-900 border border-yellow-200",
  info: "bg-blue-50 text-blue-900 border border-blue-200",
};

export function Toast({ title, description, onClose, variant = "default" }) {
  return (
    <div
      className={`w-[320px] rounded-md shadow-lg px-4 py-3 flex gap-3 ${
        palette[variant] || palette.default
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex-1">
        {title ? <div className="font-semibold">{title}</div> : null}
        {description ? (
          <div className="text-sm opacity-90 mt-0.5">{description}</div>
        ) : null}
      </div>
      <button
        onClick={onClose}
        className="shrink-0 rounded-md px-2 py-1 text-sm hover:bg-black/5"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}
