import { useEffect, useRef } from "react";
import { useToast } from "@/helpers/ToastProvider.jsx";
import { ERROR_MSG, CONNECTION_FAIL_MSG, ONLINE_MSG } from "./Errors";

export default function GlobalErrorCatcher({ children }) {
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;
  const lastToast = useRef(0);

  useEffect(() => {
    const toast = (msg, type) => {
      const now = Date.now();
      if (now - lastToast.current < 3000) return;
      lastToast.current = now;
      showToastRef.current(msg, type);
    };

    const shouldIgnore = (m) =>
      ["aborterror", "timeout", "canceled", "resizeobserver"].some(k => m.includes(k));

    const isNetworkLike = (m) =>
      ["networkerror", "failed to fetch", "load failed", "the network connection was lost", "cors"].some(k => m.includes(k));

    const classify = (raw) => {
      const m = String(raw || "").toLowerCase();
      if (shouldIgnore(m)) return;
      if (navigator?.onLine === false) return toast(CONNECTION_FAIL_MSG, "error");
      if (isNetworkLike(m)) return toast(CONNECTION_FAIL_MSG, "error");
      toast(ERROR_MSG, "error");
    };

    const onError = (e) => classify(e?.error?.message || e?.message || "");

    const onRejection = (e) => {
      const raw = e?.reason?.message || e?.reason?.toString?.() || "";
      const m = raw.toLowerCase();
      if (isNetworkLike(m) && !shouldIgnore(m)) e.preventDefault();
      classify(raw);
    };

    const onOffline = () => toast(CONNECTION_FAIL_MSG, "error");
    const onOnline = () => toast(ONLINE_MSG, "success");

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return children;
}