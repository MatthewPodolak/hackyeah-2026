package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "catalog_innovations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CatalogEntry {
    @Id
    @Column(length = 120)
    private String id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String data;

    private Integer position;

    private Instant updatedAt;
}
