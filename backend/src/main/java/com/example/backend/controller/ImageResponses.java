package com.example.backend.controller;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.net.URI;
import java.time.Duration;
import java.util.Base64;
import java.util.Optional;

final class ImageResponses {

    private ImageResponses() {}

    static ResponseEntity<byte[]> from(Optional<String> stored) {
        if (stored.isEmpty()) return ResponseEntity.notFound().build();
        String value = stored.get();
        int comma = value.indexOf(',');
        if (value.startsWith("data:image/") && comma > 0) {
            String mime = value.substring(5, value.indexOf(';'));
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(mime))
                    .cacheControl(CacheControl.maxAge(Duration.ofDays(1)).cachePrivate())
                    .body(Base64.getDecoder().decode(value.substring(comma + 1)));
        }
        if (value.startsWith("https://")) {
            return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(value)).build();
        }
        return ResponseEntity.notFound().build();
    }
}
