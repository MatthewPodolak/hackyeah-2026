import { useCallback, useState } from "react";

const FOCUSABLE = "input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex='-1'])";

function focusField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const target = el.matches(FOCUSABLE) ? el : el.querySelector(FOCUSABLE) ?? el;
  if (target === el && !el.matches(FOCUSABLE)) el.setAttribute("tabindex", "-1");
  target.focus();
}

export function useFormErrors(prefix) {
  const [errors, setErrors] = useState({});

  const fail = useCallback((field, message) => {
    setErrors({ [field]: message });
    requestAnimationFrame(() => focusField(`${prefix}-${field}`));
  }, [prefix]);

  const clear = useCallback((field) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const reset = useCallback(() => setErrors({}), []);

  const fieldProps = (field, describedBy) => ({
    id: `${prefix}-${field}`,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": [errors[field] ? `${prefix}-${field}-error` : null, describedBy].filter(Boolean).join(" ") || undefined,
  });

  const errorProps = (field) => ({
    id: `${prefix}-${field}-error`,
    children: errors[field],
  });

  return { errors, fail, clear, reset, fieldProps, errorProps };
}
