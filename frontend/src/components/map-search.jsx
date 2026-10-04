"use client";

import { useId, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertDiamondIcon, Building03Icon, Cancel01Icon, Home01Icon, Loading03Icon, Location01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { GeocodeService } from "@/api/services/GeocodeService";
import { usePlaceSuggestions } from "@/api/hooks/useStreetQuery";

const KIND_ICON = {
  Ulica: Location01Icon,
  Adres: Home01Icon,
};

export function normalize(text) {
  return (text ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
}

function words(text) {
  return normalize(text).split(/[\s,]+/).filter(Boolean);
}

function matchesQuery(place, query) {
  const haystack = normalize(`${place.name} ${place.place}`);
  return words(query).every((word) => /^\d+[a-z]?$/.test(word) || haystack.includes(word));
}

function placeLabel(place) {
  return place.place ? `${place.name}, ${place.place}` : place.name;
}

export default function MapSearch({ value, onChange, problems, bias, onPickPlace, onPickProblem, className }) {
  const uid = useId();
  const listId = `${uid}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const places = usePlaceSuggestions(value, bias);
  const query = value.trim();

  const problemMatches = useMemo(() => {
    const ws = words(query);
    if (query.length < 2) return [];
    return problems
      .filter((problem) => {
        const text = normalize([problem.title, problem.street, problem.description].join(" "));
        return ws.every((word) => text.includes(word));
      })
      .sort((a, b) => Number(normalize(b.title).includes(normalize(query))) - Number(normalize(a.title).includes(normalize(query))))
      .slice(0, 5);
  }, [problems, query]);

  const placeOptions = query.length >= 3 ? places.data ?? [] : [];
  const problemsFirst = problemMatches.some((problem) => normalize(problem.title).includes(normalize(query)));
  const placeItems = placeOptions.map((place) => ({ id: `${uid}-place-${place.id}`, type: "place", place }));
  const problemItems = problemMatches.map((problem) => ({ id: `${uid}-problem-${problem.id}`, type: "problem", problem }));
  const options = problemsFirst ? [...problemItems, ...placeItems] : [...placeItems, ...problemItems];
  const expanded = open && options.length > 0;
  const activeOption = expanded && active >= 0 ? options[active] : null;

  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  const pick = (option) => {
    close();
    if (option.type === "place") {
      onPickPlace(option.place);
      setMessage(`Pokazano na mapie: ${placeLabel(option.place)}`);
    } else {
      onPickProblem(option.problem);
      setMessage(`Pokazano zgłoszenie: ${option.problem.title}`);
    }
  };

  const submit = async () => {
    if (activeOption) return pick(activeOption);
    if (query.length < 2) return;
    const titleMatch = problemMatches.find((problem) => normalize(problem.title).includes(normalize(query)));
    if (titleMatch) return pick({ type: "problem", problem: titleMatch });
    if (query.length < 3) {
      if (problemMatches[0]) pick({ type: "problem", problem: problemMatches[0] });
      return;
    }
    let place = placeOptions.find((candidate) => matchesQuery(candidate, query));
    if (!place) {
      setSearching(true);
      try {
        const fresh = await GeocodeService.suggest(query, { bias });
        place = fresh.find((candidate) => matchesQuery(candidate, query));
      } catch {
        place = null;
      } finally {
        setSearching(false);
      }
    }
    if (place) pick({ type: "place", place });
    else if (problemMatches[0]) pick({ type: "problem", problem: problemMatches[0] });
    else {
      close();
      setMessage(`Nie znaleziono ulicy, miejsca ani zgłoszenia „${query}”.`);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      if (options.length) setActive((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      if (options.length) setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      if (expanded) {
        e.preventDefault();
        close();
      } else if (value) {
        e.preventDefault();
        onChange("");
      }
    }
  };

  const busy = searching || (places.isFetching && query.length >= 3);
  const suggestionsStatus = expanded
    ? `${options.length} ${options.length === 1 ? "podpowiedź" : "podpowiedzi"}. Użyj strzałek, aby wybrać.`
    : "";

  const placesGroup = placeItems.length > 0 && (
          <div role="group" aria-labelledby={`${uid}-places`}>
            <div id={`${uid}-places`} role="presentation" className="border-t border-border px-5 pt-3 pb-1 text-xs font-semibold text-muted-foreground">Ulice i miejsca</div>
            {placeItems.map((option) => (
              <Option key={option.id} option={option} active={option === activeOption} onPick={pick} onHover={() => setActive(options.indexOf(option))}>
                <HugeiconsIcon icon={KIND_ICON[option.place.kind] ?? Building03Icon} strokeWidth={1.8} aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{option.place.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{[option.place.kind, option.place.place].filter(Boolean).join(" · ")}</span>
                </span>
              </Option>
            ))}
          </div>
        );
  const problemsGroup = problemItems.length > 0 && (
          <div role="group" aria-labelledby={`${uid}-problems`}>
            <div id={`${uid}-problems`} role="presentation" className="border-t border-border px-5 pt-3 pb-1 text-xs font-semibold text-muted-foreground">Zgłoszenia</div>
            {problemItems.map((option) => (
              <Option key={option.id} option={option} active={option === activeOption} onPick={pick} onHover={() => setActive(options.indexOf(option))}>
                <HugeiconsIcon icon={AlertDiamondIcon} strokeWidth={1.8} aria-hidden="true" className="size-5 shrink-0 text-destructive" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{option.problem.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{["Zgłoszenie", option.problem.street].filter(Boolean).join(" · ")}</span>
                </span>
              </Option>
            ))}
          </div>
        );

  return (
    <div role="search" className={cn("relative z-10 w-full", className)}>
      <label htmlFor={`${uid}-input`} className="sr-only">Szukaj ulicy, miejsca lub zgłoszenia</label>
      <HugeiconsIcon icon={Search01Icon} strokeWidth={2} aria-hidden="true" className="pointer-events-none absolute top-[22px] left-4 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        id={`${uid}-input`}
        type="text"
        role="combobox"
        autoComplete="off"
        spellCheck={false}
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={activeOption?.id}
        aria-describedby={`${uid}-hint`}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
          setMessage("");
        }}
        onFocus={() => setOpen(true)}
        onBlur={close}
        onKeyDown={onKeyDown}
        placeholder="Szukaj ulicy, miejsca lub zgłoszenia…"
        className={cn(
          "h-11 w-full rounded-full border border-border bg-card pr-12 pl-12 text-sm text-foreground shadow-elevation-2 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
          expanded && "rounded-b-none rounded-t-[22px] border-b-transparent"
        )}
      />
      <span id={`${uid}-hint`} className="sr-only">Wpisz nazwę ulicy lub zgłoszenia i naciśnij Enter, aby przybliżyć mapę. Tekst filtruje też zgłoszenia na mapie.</span>
      <div className="absolute top-0 right-1 flex h-11 items-center">
        {busy && <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} aria-hidden="true" className="mr-1 size-4 animate-spin text-muted-foreground" />}
        {value && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange("");
              setMessage("");
              close();
            }}
            aria-label="Wyczyść wyszukiwanie"
            className="flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>

      <div
        id={listId}
        role="listbox"
        aria-label="Podpowiedzi wyszukiwania"
        hidden={!expanded}
        className="absolute inset-x-0 top-full max-h-[min(60vh,420px)] overflow-y-auto rounded-b-[22px] border border-t-0 border-border bg-card pb-2 shadow-elevation-3"
      >
        {problemsFirst ? <>{problemsGroup}{placesGroup}</> : <>{placesGroup}{problemsGroup}</>}
      </div>

      <p aria-live="polite" className="sr-only">{suggestionsStatus}</p>
      {message && (
        <p role="status" className="mx-auto mt-2 w-fit max-w-full rounded-full border border-border bg-card/95 px-3 py-1 text-center text-xs font-medium text-foreground shadow-elevation-1 backdrop-blur">
          {message}
        </p>
      )}
    </div>
  );
}

function Option({ option, active, onPick, onHover, children }) {
  return (
    <div
      id={option.id}
      role="option"
      aria-selected={active}
      onMouseDown={(e) => e.preventDefault()}
      onMouseMove={onHover}
      onClick={() => onPick(option)}
      className={cn("flex min-h-12 cursor-pointer items-center gap-3 px-5 py-2 text-sm", active && "bg-muted")}
    >
      {children}
    </div>
  );
}
