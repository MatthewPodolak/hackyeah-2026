package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

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
}
