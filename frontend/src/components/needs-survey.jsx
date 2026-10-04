"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CheckListIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import Modal from "@/components/modal";
import { DialogBody, DialogFooter, DialogHeader, DialogPanel } from "@/components/dialog-parts";
import { IconTile } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import { useRegions } from "@/api/hooks/useRegionsQuery";
import { useSubmitSurvey } from "@/api/hooks/useSurvey";
import { useToast } from "@/helpers/ToastProvider";
import { SURVEY_ACCESS, SURVEY_AGE, SURVEY_LONELINESS, SURVEY_PRIORITIES, readSurveyState, writeSurveyState } from "@/lib/survey";
import { cn } from "@/lib/utils";
import { ROLES, useAuth } from "@/api/context/AuthContext";

const EMPTY = { priorities: [], serviceAccess: null, loneliness: null, ageGroup: null, gminaId: "" };
const STEPS = 4;
const INVITE_DELAY = 5000;

const tileClass = (checked, disabled) =>
  cn(
    "relative flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]",
    checked ? "border-primary bg-secondary/60 text-foreground dark:bg-secondary/40" : "border-outline hover:bg-muted/60",
    disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
  );

function ChoiceTile({ type = "radio", name, checked, disabled, onChange, icon, children }) {
  return (
    <label className={tileClass(checked, disabled)}>
      <input type={type} name={name} checked={checked} disabled={disabled} onChange={onChange} className="sr-only" />
      {icon && <span aria-hidden="true" className="text-2xl leading-none">{icon}</span>}
      <span className="min-w-0 flex-1">{children}</span>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          type === "checkbox" && "rounded-md",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-outline"
        )}
      >
        {checked && <span className={cn("block size-2 bg-primary-foreground", type === "checkbox" ? "rounded-[2px]" : "rounded-full")} />}
      </span>
    </label>
  );
}

function SurveyDialog({ open, onClose, onDone }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [sent, setSent] = useState(false);
  const submit = useSubmitSurvey();
  const regions = useRegions();
  const { showToast } = useToast();
  const headingRef = useRef(null);

  useEffect(() => {
    if (open) headingRef.current?.focus({ preventScroll: true });
  }, [step, sent, open]);

  const close = () => {
    onClose();
    setTimeout(() => {
      setStep(0);
      setForm(EMPTY);
      setSent(false);
    }, 200);
  };

  const togglePriority = (value) =>
    setForm((f) => ({
      ...f,
      priorities: f.priorities.includes(value) ? f.priorities.filter((v) => v !== value) : f.priorities.length < 2 ? [...f.priorities, value] : f.priorities,
    }));

  const answered = [
    form.priorities.length > 0,
    form.serviceAccess != null,
    form.loneliness != null,
    form.ageGroup != null,
  ][step];

  const next = async () => {
    if (step < STEPS - 1) return setStep(step + 1);
    try {
      await submit.mutateAsync({ ...form, gminaId: form.gminaId || null });
      writeSurveyState("done");
      setSent(true);
      onDone();
    } catch (err) {
      showToast(err?.body?.message ?? null, "error");
    }
  };

  const questions = [
    { title: "Co w Twojej okolicy najbardziej wymaga poprawy?", hint: "Wybierz jeden lub dwa obszary." },
    { title: "Jak łatwo jest u Ciebie uzyskać pomoc?", hint: "Na przykład opiekę, wsparcie, poradę w urzędzie." },
    { title: "Jak często Ty lub ktoś Ci bliski czuje się samotny?", hint: "Odpowiedź jest anonimowa." },
    { title: "Ile masz lat?", hint: "Gmina jest opcjonalna – pomoże samorządowi zobaczyć potrzeby swoich mieszkańców." },
  ];
  const q = questions[step];

  return (
    <Modal open={open} onClose={close} labelledBy="survey-heading" describedBy="survey-description" className="max-w-xl">
      <DialogPanel>
        <DialogHeader
          icon={CheckListIcon}
          eyebrow={sent ? "Ankieta wysłana" : `Głos mieszkańców · pytanie ${step + 1} z ${STEPS}`}
          title="Pomóż nam poznać potrzeby Małopolski"
          titleId="survey-heading"
          description="4 krótkie pytania, tylko klikanie. Bez logowania i danych osobowych."
          descriptionId="survey-description"
          onClose={close}
        >
          {!sent && (
            <div
              role="progressbar"
              aria-label="Postęp ankiety"
              aria-valuemin={1}
              aria-valuemax={STEPS}
              aria-valuenow={step + 1}
              aria-valuetext={`Pytanie ${step + 1} z ${STEPS}`}
              className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted"
            >
              <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${((step + 1) / STEPS) * 100}%` }} />
            </div>
          )}
        </DialogHeader>

        {sent ? (
          <>
            <DialogBody className="pt-2">
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <IconTile icon={CheckmarkCircle02Icon} tone="success" size="lg" />
                <h3 ref={headingRef} tabIndex={-1} className="font-heading text-xl font-bold tracking-tight outline-none">Dziękujemy!</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Twoje odpowiedzi trafią do ROPS Kraków i samorządów. Pomogą wybrać innowacje, które najbardziej przydadzą się w Twojej okolicy.
                </p>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button onClick={close}>Zamknij</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogBody className="pt-2">
              <fieldset className="min-w-0">
                <legend className="mb-4 w-full">
                  <span ref={headingRef} tabIndex={-1} className="block font-heading text-lg font-bold tracking-tight outline-none">{q.title}</span>
                  <span className="block text-sm text-muted-foreground">{q.hint}</span>
                </legend>

                {step === 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SURVEY_PRIORITIES.map((option) => {
                      const checked = form.priorities.includes(option.value);
                      return (
                        <ChoiceTile
                          key={option.value}
                          type="checkbox"
                          name="survey-priorities"
                          icon={option.icon}
                          checked={checked}
                          disabled={!checked && form.priorities.length >= 2}
                          onChange={() => togglePriority(option.value)}
                        >
                          {option.label}
                        </ChoiceTile>
                      );
                    })}
                  </div>
                )}

                {step === 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {SURVEY_ACCESS.map((option) => {
                      const checked = form.serviceAccess === option.value;
                      return (
                        <label key={option.value} className={cn(tileClass(checked), "flex-col gap-2 px-1 py-4 text-center text-xs")}>
                          <input
                            type="radio"
                            name="survey-access"
                            checked={checked}
                            onChange={() => setForm((f) => ({ ...f, serviceAccess: option.value }))}
                            className="sr-only"
                          />
                          <span aria-hidden="true" className="text-3xl leading-none">{option.icon}</span>
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SURVEY_LONELINESS.map((option) => (
                      <ChoiceTile
                        key={option.value}
                        name="survey-loneliness"
                        checked={form.loneliness === option.value}
                        onChange={() => setForm((f) => ({ ...f, loneliness: option.value }))}
                      >
                        {option.label}
                      </ChoiceTile>
                    ))}
                  </div>
                )}

                {step === 3 && (
                  <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {SURVEY_AGE.map((option) => (
                        <ChoiceTile
                          key={option.value}
                          name="survey-age"
                          checked={form.ageGroup === option.value}
                          onChange={() => setForm((f) => ({ ...f, ageGroup: option.value }))}
                        >
                          {option.label}
                        </ChoiceTile>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="survey-gmina" className="text-sm font-medium">Twoja gmina (opcjonalnie)</label>
                      <NativeSelect
                        id="survey-gmina"
                        className="w-full"
                        value={form.gminaId}
                        disabled={!regions.data}
                        onChange={(e) => setForm((f) => ({ ...f, gminaId: e.target.value }))}
                      >
                        <NativeSelectOption value="">Wolę nie podawać</NativeSelectOption>
                        {regions.data?.powiaty.map((powiat) => (
                          <NativeSelectOptGroup key={powiat.id} label={powiat.label}>
                            {powiat.gminy.map((gmina) => (
                              <NativeSelectOption key={gmina.id} value={gmina.id}>{gmina.label}</NativeSelectOption>
                            ))}
                          </NativeSelectOptGroup>
                        ))}
                      </NativeSelect>
                    </div>
                  </div>
                )}
              </fieldset>
            </DialogBody>
            <DialogFooter>
              {step > 0 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)}>Wstecz</Button>
              ) : (
                <Button variant="ghost" onClick={close}>Nie teraz</Button>
              )}
              <Button onClick={next} disabled={!answered || submit.isPending}>
                {step < STEPS - 1 ? "Dalej" : submit.isPending ? "Wysyłanie..." : "Wyślij odpowiedzi"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogPanel>
    </Modal>
  );
}

export default function NeedsSurvey({ className }) {
  const { isLoading, isLogged, role } = useAuth();
  const [status, setStatus] = useState(null);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = readSurveyState();
    const id = setTimeout(() => {
      if (saved?.status) setStatus(saved.status);
      else setInviteVisible(true);
    }, saved?.status ? 0 : INVITE_DELAY);
    return () => clearTimeout(id);
  }, []);

  const dismiss = () => {
    writeSurveyState("dismissed");
    setStatus("dismissed");
    setInviteVisible(false);
  };

  const start = () => {
    setInviteVisible(false);
    setOpen(true);
  };

  if (isLoading || (isLogged && role !== ROLES.CITIZEN && role !== ROLES.NGO)) return null;

  return (
    <>
      {status === null && inviteVisible && (
        <aside
          aria-labelledby="survey-invite-title"
          className={cn("w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-border bg-card p-5 shadow-elevation-3 animate-in fade-in slide-in-from-bottom-4 duration-300", className)}
        >
          <div className="flex items-start gap-3">
            <IconTile icon={CheckListIcon} size="sm" />
            <div className="min-w-0 flex-1">
              <h2 id="survey-invite-title" className="font-heading text-base font-bold tracking-tight">Masz 30 sekund?</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Odpowiedz na 4 pytania o potrzeby w Twojej okolicy. Tylko klikanie, bez logowania.</p>
            </div>
            <Button variant="ghost" size="icon-sm" className="-mt-1 -mr-2 shrink-0" onClick={dismiss} aria-label="Zamknij zaproszenie do ankiety">
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
            </Button>
          </div>
          <div className="mt-4 flex gap-2">
            <Button className="flex-1" onClick={start}>Wypełnij ankietę</Button>
            <Button variant="ghost" onClick={dismiss}>Nie teraz</Button>
          </div>
        </aside>
      )}
      {status === "dismissed" && !open && (
        <Button
          variant="outline"
          className={cn("h-11 border-border bg-card px-4 text-foreground shadow-elevation-2 hover:bg-muted", className)}
          onClick={start}
        >
          <HugeiconsIcon icon={CheckListIcon} strokeWidth={1.8} data-icon="inline-start" aria-hidden="true" />
          Ankieta · 30 s
        </Button>
      )}
      <SurveyDialog
        open={open}
        onClose={() => {
          setOpen(false);
          if (readSurveyState()?.status !== "done") {
            writeSurveyState("dismissed");
            setStatus("dismissed");
          }
        }}
        onDone={() => setStatus("done")}
      />
    </>
  );
}
