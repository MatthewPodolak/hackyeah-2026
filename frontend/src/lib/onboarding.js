const KEY = "hubmiOnboarding";
const EVENT = "hubmi-onboarding";

export function isOnboardingDone() {
  try {
    return localStorage.getItem(KEY) === "done";
  } catch {
    return true;
  }
}

export function markOnboardingDone() {
  try {
    localStorage.setItem(KEY, "done");
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeOnboarding(listener) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

export const onboardingServerSnapshot = () => true;
