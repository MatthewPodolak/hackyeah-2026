package com.example.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "problems")
@Getter
@Setter
public class Problem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    private String title;

    private String description;

    private Double latitude;
    private Double longitude;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private AppUser author;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    private Instant localDate;

    private String street;

    @Enumerated(EnumType.STRING)
    private ProblemCategory category;

    @Enumerated(EnumType.STRING)
    private TargetGroup targetGroup;
}
