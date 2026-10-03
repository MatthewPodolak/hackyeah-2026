package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RegionsData(String source,
                          Integer year,
                          Map<String, String> gminaTypes,
                          List<Powiat> powiaty) {
    public record Powiat(String id,
                         String name,
                         String label,
                         @JsonProperty("isCity")
                         boolean isCity,
                         Integer population,
                         List<Gmina> gminy) {}
    public record Gmina(String id,
                        String name,
                        String label,
                        String type,
                        Integer population,
                        Double urbanizationPct) {}
}
