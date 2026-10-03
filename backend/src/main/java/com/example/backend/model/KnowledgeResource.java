package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "knowledge_resources")
public class KnowledgeResource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String title;
    @Column(columnDefinition = "TEXT") private String description;
    @Enumerated(EnumType.STRING) private ResourceType type;
    @Column(columnDefinition = "TEXT") private String url;
    private String challengeArea;
}