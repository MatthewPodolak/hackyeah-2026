package com.example.backend.controller;

import com.example.backend.dto.ProblemRequest;
import com.example.backend.dto.ProblemResponse;
import com.example.backend.service.ProblemService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProblemControllerTest {

    @Mock
    private ProblemService problemService;

    @InjectMocks
    private ProblemController problemController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(problemController).build();
    }

    @Test
    void shouldCreateProblemAndReturn201Created() throws Exception {
        ProblemRequest request = new ProblemRequest(
                "Brak zjazdu",
                "Wysoki krawężnik blokuje wózki",
                50.06143,
                19.93658,
                "https://imgur.com/test.jpg",
                1L
        );

        ProblemResponse response = new ProblemResponse(
                1L,
                "Brak zjazdu",
                "Wysoki krawężnik blokuje wózki",
                50.06143,
                19.93658,
                "https://imgur.com/test.jpg"
        );

        when(problemService.reportProblem(any(ProblemRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/problems")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))

                .andExpect(status().isCreated())

                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.title").value("Brak zjazdu"))
                .andExpect(jsonPath("$.imageUrl").value("https://imgur.com/test.jpg"));

        verify(problemService, times(1)).reportProblem(any(ProblemRequest.class));
    }
}