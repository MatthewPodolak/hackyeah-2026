package com.example.backend.repository;

import com.example.backend.model.GrantCall;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface GrantCallRepository extends JpaRepository<GrantCall, Long> {
    List<GrantCall> findByOpenFromLessThanEqualAndOpenToGreaterThanEqual(LocalDate a, LocalDate b);

}
