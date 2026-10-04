package com.example.backend.repository;

import com.example.backend.model.NeedsSurveyResponse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NeedsSurveyResponseRepository extends JpaRepository<NeedsSurveyResponse, Long> {

    List<NeedsSurveyResponse> findByGminaId(String gminaId);
}
