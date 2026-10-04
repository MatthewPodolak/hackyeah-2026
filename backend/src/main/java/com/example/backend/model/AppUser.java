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

    // optional applicant details for grant applications (filled in the grant tab, saved to the account)
    private String phone;
    private String street;
    private String postalCode;
    private String city;
    // where the applicant lives or works – separate from gminaId, which is the gmina a JST account manages
    private String residenceGminaId;
    private String krs;
    private String regon;

    // organisations: people and experience reused in every application (never sent to the AI except roles/experience)
    private String representativeFunction;
    private String representativeName;
    private String representativePhone;
    private String representativeEmail;
    private String contactFunction;
    private String contactName;
    private String contactPhone;
    private String contactEmail;
    @Column(columnDefinition = "TEXT")
    private String experience;
    // [{name, role, experience}]
    @Column(columnDefinition = "TEXT")
    private String teamJson;

    public AccountStatus effectiveStatus() {
        return accountStatus == null ? AccountStatus.ACTIVE : accountStatus;
    }

    public boolean isApprovedInstitution() {
        return (role == Role.JST || role == Role.ROPS) && effectiveStatus() == AccountStatus.ACTIVE;
    }
}
