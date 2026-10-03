package com.example.backend.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {
    public String convertToDatabaseColumn(List<String> l) { return l == null ? null : String.join(",", l); }
    public List<String> convertToEntityAttribute(String s) {
        return s == null || s.isBlank() ? new ArrayList<>() : new ArrayList<>(Arrays.asList(s.split(",")));
    }
}
