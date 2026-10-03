import { toast } from "sonner";
import { ERROR_MSG, SUCCESS_MSG } from "./Errors";

const DEFAULT_MSG = {
  error: ERROR_MSG,
  success: SUCCESS_MSG,
};

export function showToast(message = null, type = "info", { duration = type === "error" ? 8000 : 6000, id } = {}) {
  const fn = toast[type] ?? toast.info;
  return fn(message ?? DEFAULT_MSG[type] ?? "", { duration, id });
}

export function removeToast(id) {
  toast.dismiss(id);
}

export function useToast() {
  return { showToast, removeToast };
}