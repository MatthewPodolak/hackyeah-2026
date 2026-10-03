package com.example.backend.controller;

import com.example.backend.config.CreatorReferenceData;
import com.example.backend.dto.CanvasSpec;
import com.example.backend.dto.FormCategories;
import com.example.backend.dto.RegionsData;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/config")
@RequiredArgsConstructor
public class FormConfigController {
    private final CreatorReferenceData ref;

    @GetMapping("/canvas")          public CanvasSpec canvas() { return ref.canvas(); }          // front generuje formularz z tego
    @GetMapping("/form-categories") public FormCategories forms() { return ref.forms(); }
    @GetMapping("/regions")         public RegionsData regions() { return ref.regions(); }
}
