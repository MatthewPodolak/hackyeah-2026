package com.example.backend.model;

import jakarta.persistence.*;

import java.time.Instant;
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

    // NGO only: 10-digit tax id, digits only
    @Column(length = 10)
    private String nip;
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private AccountStatus accountStatus;

    private Instant createdAt;

    public AccountStatus effectiveStatus() {
        return accountStatus == null ? AccountStatus.ACTIVE : accountStatus;
    }

    public boolean isApprovedInstitution() {
        return (role == Role.JST || role == Role.ROPS) && effectiveStatus() == AccountStatus.ACTIVE;
    }
}
