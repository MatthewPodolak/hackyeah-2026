package com.example.backend.service;

import com.example.backend.dto.ProblemRequest;
import com.example.backend.dto.ProblemResponse;
import com.example.backend.mapper.ProblemMapper;
import com.example.backend.model.AppUser;
import com.example.backend.model.Problem;
import com.example.backend.repository.AppUserRepository;
import com.example.backend.repository.ProblemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProblemServiceTest {

    @Mock private ProblemRepository problemRepository;
    @Mock private ProblemMapper problemMapper;
    @Mock private AppUserRepository appUserRepository;

    @InjectMocks private ProblemService problemService;

    @Test
    void shouldReportProblemSuccessfully() {
        ProblemRequest request = new ProblemRequest("Tytuł", "Opis", 50.0, 19.0, "http://img.url", 1L);
        Problem problem = new Problem();
        AppUser user = new AppUser();
        Problem savedProblem = new Problem();
        ProblemResponse expectedResponse = new ProblemResponse(1L, "Tytuł", "Opis", 50.0, 19.0, "http://img.url");

        when(problemMapper.toEntity(request)).thenReturn(problem);
        when(appUserRepository.findById(1L)).thenReturn(Optional.of(user));
        when(problemRepository.save(problem)).thenReturn(savedProblem);
        when(problemMapper.toResponse(savedProblem)).thenReturn(expectedResponse);

        ProblemResponse actualResponse = problemService.reportProblem(request);

        assertNotNull(actualResponse);
        assertEquals("Tytuł", actualResponse.title());
        assertEquals("http://img.url", actualResponse.imageUrl());
        assertEquals(user, problem.getAuthor());
        verify(problemRepository, times(1)).save(problem);
    }

    @Test
    void shouldThrowExceptionWhenAuthorNotFound() {
        ProblemRequest request = new ProblemRequest("Tytuł", "Opis", 50.0, 19.0, null, 99L);
        Problem problem = new Problem();

        when(problemMapper.toEntity(request)).thenReturn(problem);
        when(appUserRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> problemService.reportProblem(request));

        verify(problemRepository, never()).save(any());
    }
}