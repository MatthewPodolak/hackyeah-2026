import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { GeocodeService } from "@/api/services/GeocodeService";

export function useStreet(location) {
  return useQuery({
    queryKey: ["street", location?.lat, location?.lon],
    queryFn: ({ signal }) => GeocodeService.reverse(location, { ct: signal }),
    enabled: !!location,
    staleTime: Infinity,
    retry: 1,
  });
}

export function usePlaceSuggestions(query, bias) {
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(id);
  }, [query]);
  const q = debounced.trim();
  return useQuery({
    queryKey: ["geo", "suggest", q.toLowerCase(), bias?.[0], bias?.[1]],
    queryFn: ({ signal }) => GeocodeService.suggest(q, { bias, ct: signal }),
    enabled: q.length >= 3,
    staleTime: 10 * 60_000,
    placeholderData: keepPreviousData,
    retry: false,
  });
}
