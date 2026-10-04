package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "needs_survey_responses")
@Getter
@Setter
@NoArgsConstructor
public class NeedsSurveyResponse {

    public enum Loneliness { NEVER, SOMETIMES, OFTEN, NO_ANSWER }

    public enum AgeGroup { UNDER_30, AGE_30_44, AGE_45_64, AGE_65_PLUS, NO_ANSWER }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Convert(converter = StringListConverter.class)
    @Column(length = 200)
    private List<String> priorities = new ArrayList<>();

    private int serviceAccess;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Loneliness loneliness;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private AgeGroup ageGroup;

    @Column(length = 100)
    private String gminaId;

    private Instant createdAt = Instant.now();
}
