package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "grant_calls")
public class GrantCall {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String name;
    @Column(columnDefinition = "TEXT") private String description;
    private LocalDate openFrom;
    private LocalDate openTo;
    @Column(columnDefinition = "TEXT") private String requiredSections;

    // filled by GrantCallSeeder from data/grant-calls.json; null for calls typed in by ROPS
    @Column(unique = true) private String sourceKey;
    private String project;
    @Column(columnDefinition = "TEXT") private String goal;
    private Integer maxGrantPLN;
    private Boolean ownContributionRequired;
    @Convert(converter = StringListConverter.class) private List<String> applicantTypes = new ArrayList<>();
    @Column(length = 1000) private String sourceUrl;
    // demo = example call with invented dates, shown as "Nabór przykładowy (demo)"
    private Boolean demo;
    // real form: [{title, fillBy (AI_DRAFT / USER / USER_CONFIRM), questions?, aiRule?}] and evaluation criteria
    @Column(columnDefinition = "TEXT") private String sectionsJson;
    @Column(columnDefinition = "TEXT") private String criteriaJson;
}
