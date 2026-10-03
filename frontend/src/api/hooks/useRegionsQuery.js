import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ConfigService } from "@/api/services/ConfigService";
import { GeoService } from "@/api/services/GeoService";
import { indexGminy } from "@/lib/gminy";

export function useRegions() {
  return useQuery({
    queryKey: ["config", "regions"],
    queryFn: ({ signal }) => ConfigService.regions({ ct: signal }),
    staleTime: Infinity,
  });
}

// gmina id → gmina (with its powiat), empty until the regions are loaded
export function useGminyIndex() {
  const regions = useRegions();
  return useMemo(() => indexGminy(regions.data), [regions.data]);
}

export function useGminyShapes() {
  return useQuery({
    queryKey: ["geo", "gminy"],
    queryFn: ({ signal }) => GeoService.gminy({ ct: signal }),
    staleTime: Infinity,
  });
}
