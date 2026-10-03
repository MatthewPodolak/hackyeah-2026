package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "app_users")
@Getter
@Setter
public class AppUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    private String name;

    private String lastName;

    private int age;

    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    // JST only: the gmina this account works for (id from malopolska-units.json)
    private String gminaId;
}
