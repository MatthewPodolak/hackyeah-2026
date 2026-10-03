"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Search01Icon, SearchRemoveIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InnovationCard } from "@/components/innovation-card";
import formCategories from "@/data/form-categories.json";

const PROBLEM_CATEGORIES = Object.entries(formCategories.problemCategories);
const WHO_CATEGORIES = Object.entries(formCategories.whoCategories);

function normalize(text) {
  return (text ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
}

function searchableText(innovation) {
  return normalize(
    [
      innovation.name,
      innovation.shortDescription,
      innovation.description,
      innovation.problem,
      innovation.targetGroupDescription,
      innovation.whoCanImplement,
    ].join(" ")
  );
}

function CategoryChip({ active, icon, label, count, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
      )}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {label}
      <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground")}>
        {count}
      </span>
    </button>
  );
}

export default function InnovationsBrowser({ innovations }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(null);
  const [who, setWho] = useState("");
  const deferredQuery = useDeferredValue(query);

  const indexed = useMemo(
    () => innovations.map((innovation) => ({ innovation, text: searchableText(innovation) })),
    [innovations]
  );

  const matchingSearchAndWho = useMemo(() => {
    const words = normalize(deferredQuery).split(/\s+/).filter(Boolean);
    return indexed
      .filter(({ text }) => words.every((word) => text.includes(word)))
      .filter(({ innovation }) => !who || innovation.whoCategories.includes(who))
      .map(({ innovation }) => innovation);
  }, [indexed, deferredQuery, who]);

  const counts = useMemo(() => {
    const result = {};
    for (const innovation of matchingSearchAndWho) {
      for (const key of innovation.problemCategories) result[key] = (result[key] ?? 0) + 1;
    }
    return result;
  }, [matchingSearchAndWho]);

  const visible = category
    ? matchingSearchAndWho.filter((innovation) => innovation.problemCategories.includes(category))
    : matchingSearchAndWho;

  const activeCategory = category && formCategories.problemCategories[category];
  const hasFilters = query || category || who;

  const reset = () => {
    setQuery("");
    setCategory(null);
    setWho("");
  };

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex flex-col gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex flex-col gap-2 sm:flex-row">
          <InputGroup className="sm:flex-1">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={query}
              placeholder="Szukaj innowacji, np. seniorzy, samotność, transport..."
              aria-label="Szukaj innowacji"
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" aria-label="Wyczyść" onClick={() => setQuery("")}>
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>

          <NativeSelect className="sm:w-64" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Dla kogo">
            <NativeSelectOption value="">Dla kogo: wszyscy</NativeSelectOption>
            {WHO_CATEGORIES.map(([key, item]) => (
              <NativeSelectOption key={key} value={key}>
                {item.icon} {item.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="flex flex-wrap gap-2">
          <CategoryChip
            active={!category}
            label="Wszystkie"
            count={matchingSearchAndWho.length}
            onClick={() => setCategory(null)}
          />
          {PROBLEM_CATEGORIES.map(([key, item]) => (
            <CategoryChip
              key={key}
              active={category === key}
              icon={item.icon}
              label={item.label}
              count={counts[key] ?? 0}
              onClick={() => setCategory(category === key ? null : key)}
            />
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">
            {activeCategory ? (
              <>
                <span aria-hidden="true">{activeCategory.icon}</span> {activeCategory.label}
              </>
            ) : (
              "Wszystkie innowacje"
            )}
          </h2>
          {activeCategory && (
            <p className="text-sm text-muted-foreground">Np. {activeCategory.example}</p>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {visible.length} z {innovations.length}
          </span>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={reset}>
              Wyczyść filtry
            </Button>
          )}
        </div>
      </div>

      {visible.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((innovation) => (
            <li key={innovation.id}>
              <InnovationCard innovation={innovation} />
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={SearchRemoveIcon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Brak wyników</EmptyTitle>
            <EmptyDescription>Nie znaleźliśmy innowacji pasujących do wybranych filtrów.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={reset}>
              Wyczyść filtry
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </>
  );
}
