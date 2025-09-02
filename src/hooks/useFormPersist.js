import { useEffect } from "react";

export function useFormPersist(form, storageKey) {
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        form.reset(parsed);
      } catch (e) {
        console.error("Failed to parse saved form data", e);
      }
    }
  }, [form, storageKey]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem(storageKey, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form, storageKey]);
}
