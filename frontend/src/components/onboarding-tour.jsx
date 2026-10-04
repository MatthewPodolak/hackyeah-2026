"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { HelpCircleIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isOnboardingDone, markOnboardingDone, onboardingServerSnapshot, subscribeOnboarding } from "@/lib/onboarding";

const STEPS = [
  {
    targets: [],
    title: "Witaj w Małopolskim HubMI",
    text: "To miejsce, w którym mieszkańcy zgłaszają problemy swojej okolicy, a ROPS i gminy dopasowują do nich sprawdzone rozwiązania. Pokażemy Ci w minutę, jak z niego korzystać.",
  },
  {
    targets: ["search"],
    title: "Szukaj ulicy lub zgłoszenia",
    text: "Wpisz nazwę ulicy, miejsca albo problemu. Wybierz podpowiedź, a mapa sama przybliży to miejsce.",
  },
  {
    targets: ["legend"],
    title: "Pinezki to zgłoszenia mieszkańców",
    text: "Kolor pokazuje, na jakim etapie jest sprawa. Pinezka z liczbą to kilka zgłoszeń blisko siebie – kliknij ją, aby przybliżyć. Pojedyncza pinezka pokaże szczegóły zgłoszenia.",
  },
  {
    targets: ["report"],
    title: "Zgłoś problem w swojej okolicy",
    text: "Opisz problem i wskaż miejsce – możesz też mówić zamiast pisać. Od razu podpowiemy gotowe rozwiązania, a Twoją sprawę zobaczy gmina i ROPS.",
  },
  {
    targets: ["library"],
    title: "Sprawdzone rozwiązania",
    text: "W Bibliotece innowacji znajdziesz ponad 100 innowacji społecznych ROPS Kraków – z opisami i filmami.",
  },
  {
    targets: ["menu", "menu-trigger"],
    title: "Menu",
    text: "Tu znajdziesz swoje zgłoszenia i propozycje, partnerstwa oraz możliwość zaproponowania własnej innowacji. Po zalogowaniu także wiadomości.",
  },
  {
    targets: ["a11y", "menu-trigger"],
    title: "Ułatwienia dostępu",
    text: "Powiększ tekst albo włącz wysoki kontrast. Ustawienie zostanie zapamiętane na tym urządzeniu.",
  },
  {
    targets: ["help"],
    title: "Gotowe!",
    text: "Ten przewodnik możesz włączyć ponownie w każdej chwili tym przyciskiem.",
  },
];

const PAD = 8;
const EDGE = 4;
const GAP = 14;
const CARD_WIDTH = 384;

function findTarget(ids) {
  for (const id of ids) {
    const el = document.querySelector(`[data-tour="${id}"]`);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth)) continue;
    let top = r.top - PAD;
    let left = r.left - PAD;
    let bottom = r.bottom + PAD;
    let right = r.right + PAD;
    for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (!/(auto|scroll|hidden)/.test(style.overflowY + style.overflowX)) continue;
      const c = node.getBoundingClientRect();
      top = Math.max(top, c.top + EDGE);
      left = Math.max(left, c.left + EDGE);
      bottom = Math.min(bottom, c.bottom - EDGE);
      right = Math.min(right, c.right - EDGE);
    }
    top = Math.max(top, EDGE);
    left = Math.max(left, EDGE);
    bottom = Math.min(bottom, window.innerHeight - EDGE);
    right = Math.min(right, window.innerWidth - EDGE);
    if (bottom - top > 16 && right - left > 16) return { top, left, width: right - left, height: bottom - top };
  }
  return null;
}

function sameRect(a, b) {
  if (!a || !b) return a === b;
  return Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;
}

function placeCard(rect, cardHeight) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(CARD_WIDTH, vw - 32);
  const clampX = (x) => Math.max(16, Math.min(x, vw - width - 16));
  const clampY = (y) => Math.max(16, Math.min(y, vh - cardHeight - 16));
  if (!rect) return { width, left: (vw - width) / 2, top: Math.max(16, (vh - cardHeight) / 2) };
  const centerX = rect.left + rect.width / 2 - width / 2;
  if (rect.top + rect.height + GAP + cardHeight < vh - 16) return { width, left: clampX(centerX), top: rect.top + rect.height + GAP };
  if (rect.top - GAP - cardHeight > 16) return { width, left: clampX(centerX), top: rect.top - GAP - cardHeight };
  if (rect.left + rect.width + GAP + width < vw - 16) return { width, left: rect.left + rect.width + GAP, top: clampY(rect.top) };
  return { width, left: clampX(rect.left - GAP - width), top: clampY(rect.top) };
}

function Tour({ onFinish }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [cardHeight, setCardHeight] = useState(240);
  const cardRef = useRef(null);
  const headingRef = useRef(null);
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  useEffect(() => {
    let frame;
    let previous = null;
    const tick = () => {
      const next = findTarget(current.targets);
      if (!sameRect(next, previous)) {
        previous = next;
        setRect(next);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [current]);

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setCardHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onFinish();
    } else if (e.key === "Tab") {
      const focusable = [...cardRef.current.querySelectorAll("button")];
      if (!focusable.length) return;
      const first = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === headingRef.current)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const position = placeCard(rect, cardHeight);

  return createPortal(
    <div className="fixed inset-0 z-[2400]" onKeyDown={onKeyDown}>
      {rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-[20px] ring-3 ring-white/90 transition-all duration-300 ease-out"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, boxShadow: "0 0 0 9999px rgb(12 12 30 / 0.62)" }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-[rgb(12_12_30/0.62)] transition-opacity duration-300" />
      )}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
        className="fixed rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-elevation-3 transition-[top,left] duration-300 ease-out"
        style={{ top: position.top, left: position.left, width: position.width }}
      >
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Jak korzystać · krok {step + 1} z {STEPS.length}
        </p>
        <h2 id="tour-title" ref={headingRef} tabIndex={-1} className="mt-1 font-heading text-lg font-bold tracking-tight outline-none">
          {current.title}
        </h2>
        <p id="tour-text" className="mt-2 text-sm leading-relaxed text-muted-foreground">{current.text}</p>
        <div aria-hidden="true" className="mt-5 flex gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/50" : "w-1.5 bg-muted")} />
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2">
          {!last && (
            <Button variant="ghost" size="sm" className="-ml-2 mr-auto" onClick={onFinish}>
              Pomiń przewodnik
            </Button>
          )}
          {step > 0 && (
            <Button variant="outline" size="sm" className={cn(last && "mr-auto")} onClick={() => setStep(step - 1)}>
              Wstecz
            </Button>
          )}
          <Button size="sm" onClick={() => (last ? onFinish() : setStep(step + 1))}>
            {step === 0 ? "Pokaż mi" : last ? "Zaczynamy" : "Dalej"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function OnboardingTour({ className }) {
  const done = useSyncExternalStore(subscribeOnboarding, isOnboardingDone, onboardingServerSnapshot);
  const [open, setOpen] = useState(false);
  const helpRef = useRef(null);
  const restoreFocus = useRef(false);

  useEffect(() => {
    if (open || !restoreFocus.current) return;
    restoreFocus.current = false;
    helpRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (done) return;
    const id = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(id);
  }, [done]);

  const finish = () => {
    restoreFocus.current = true;
    setOpen(false);
    markOnboardingDone();
  };

  return (
    <>
      <Button
        ref={helpRef}
        variant="ghost"
        data-tour="help"
        className={cn("size-11 cursor-pointer border border-border bg-card p-0 text-foreground shadow-elevation-2 hover:bg-muted", className)}
        aria-label="Jak korzystać z mapy – przewodnik"
        title="Jak korzystać z mapy"
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={1.8} aria-hidden="true" className="size-5" />
      </Button>
      {open && <Tour onFinish={finish} />}
    </>
  );
}
