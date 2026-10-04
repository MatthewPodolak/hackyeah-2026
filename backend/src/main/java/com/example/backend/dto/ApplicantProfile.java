package com.example.backend.dto;

import java.util.List;

// optional details for grant applications, saved once and reused; all fields may be null.
// krs, regon, the two people, experience and team apply to organisations only
public record ApplicantProfile(
        String phone,
        String street,
        String postalCode,
        String city,
        String gminaId,
        String krs,
        String regon,
        ContactPerson representative,
        ContactPerson contact,
        String experience,
        List<TeamMember> team
) {
    public record ContactPerson(String function, String name, String phone, String email) {}

    public record TeamMember(String name, String role, String experience) {}
}
