import { useQuery } from "@tanstack/react-query";
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
