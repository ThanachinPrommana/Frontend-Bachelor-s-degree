// src/components/ui/toaster.jsx
import React from "react";
import { createPortal } from "react-dom";
import { Toast } from "./toast";

export function Toaster() {
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    const handler = (e) => {
      const item = e.detail;
      setToasts((prev) => [...prev, item]);

      // auto-dismiss
      const t = setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== item.id));
      }, item.duration ?? 3500);

      // cleanup หากปิดก่อนเวลา
      item.__timer = t;
    };
    window.addEventListener("app:toast", handler);
    return () => window.removeEventListener("app:toast", handler);
  }, []);

  const onClose = (id) => {
    setToasts((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target?.__timer) clearTimeout(target.__timer);
      return prev.filter((x) => x.id !== id);
    });
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          title={t.title}
          description={t.description}
          variant={t.variant}
          onClose={() => onClose(t.id)}
        />
      ))}
    </div>,
    document.body
  );
}
