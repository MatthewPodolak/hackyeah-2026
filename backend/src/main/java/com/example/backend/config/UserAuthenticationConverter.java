package com.example.backend.config;

import com.example.backend.model.AppUser;
import com.example.backend.model.Role;
import com.example.backend.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class UserAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final AppUserRepository users;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        List<GrantedAuthority> authorities = parseId(jwt.getSubject()) == null
                ? List.of()
                : users.findById(parseId(jwt.getSubject())).map(UserAuthenticationConverter::authorities).orElse(List.of());
        return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
    }

    static List<GrantedAuthority> authorities(AppUser user) {
        if (user.getRole() == null) return List.of();
        boolean institution = user.getRole() == Role.JST || user.getRole() == Role.ROPS;
        if (institution && !user.isApprovedInstitution()) {
            return List.of(new SimpleGrantedAuthority("ROLE_PENDING"));
        }
        return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    private static Long parseId(String subject) {
        try {
            return Long.valueOf(subject);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
