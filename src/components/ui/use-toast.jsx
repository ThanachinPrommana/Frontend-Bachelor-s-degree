// src/components/ui/use-toast.jsx
import { useCallback } from "react";

/**
 * usage:
 * const { toast } = useToast();
 * toast({ title: "สำเร็จ", description: "บันทึกแล้ว", variant: "success" });
 */
export function useToast() {
  const toast = useCallback(
    ({
      title = "",
      description = "",
      variant = "default",
      duration = 3500,
    } = {}) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const event = new CustomEvent("app:toast", {
        detail: { id, title, description, variant, duration },
      });
      window.dispatchEvent(event);
    },
    []
  );
  return { toast };
}
