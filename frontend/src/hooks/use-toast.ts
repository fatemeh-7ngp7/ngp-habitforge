// hooks/use-toast.ts
// Thin wrapper around sonner's toast — keeps call-sites consistent
// and lets us swap the underlying lib without touching every component.

import { toast as sonnerToast } from "sonner";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

function toast({ title, description, variant = "default", duration = 4000 }: ToastOptions) {
  const message = title ?? description ?? "";
  const opts = {
    description: title && description ? description : undefined,
    duration,
  };

  switch (variant) {
    case "success":
      return sonnerToast.success(message, opts);
    case "error":
      return sonnerToast.error(message, opts);
    case "warning":
      return sonnerToast.warning(message, opts);
    case "info":
      return sonnerToast.info(message, opts);
    default:
      return sonnerToast(message, opts);
  }
}

// Convenience shortcuts so call-sites can do: toast.success(...)
toast.success = (title: string, description?: string) =>
  toast({ title, description, variant: "success" });

toast.error = (title: string, description?: string) =>
  toast({ title, description, variant: "error" });

toast.warning = (title: string, description?: string) =>
  toast({ title, description, variant: "warning" });

toast.info = (title: string, description?: string) =>
  toast({ title, description, variant: "info" });

export function useToast() {
  return { toast };
}

export { toast };