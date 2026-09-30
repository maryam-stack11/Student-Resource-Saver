"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AlertIcon, CheckIcon, CloseIcon } from "@/components/icons";

type ToastKind = "success" | "error";
type Toast = { id: number; message: string; kind: ToastKind };
type ShowToast = (message: string, kind?: ToastKind) => void;

const ToastContext = createContext<ShowToast>(() => {});

/** Call `const toast = useToast()` then `toast("Saved")` or `toast("Oops", "error")`. */
export function useToast(): ShowToast {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback<ShowToast>(
    (message, kind = "success") => {
      const id = nextId.current++;
      // Keep at most three on screen.
      setToasts((current) => [...current.slice(-2), { id, message, kind }]);
      window.setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${
              toast.kind === "error"
                ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
            }`}
          >
            {toast.kind === "error" ? (
              <AlertIcon className="mt-0.5 size-4 shrink-0" />
            ) : (
              <CheckIcon className="mt-0.5 size-4 shrink-0" />
            )}
            <p className="flex-1">
              <span className="sr-only">{toast.kind === "error" ? "Error: " : "Success: "}</span>
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="-m-1 cursor-pointer rounded p-1 opacity-70 hover:opacity-100"
              aria-label="Dismiss message"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
