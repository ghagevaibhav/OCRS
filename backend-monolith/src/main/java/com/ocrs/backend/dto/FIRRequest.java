package com.ocrs.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FIRRequest {

        @NotBlank(message = "Category is required")
        private String category;

        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Description is required")
        private String description;

        @NotNull(message = "Incident date is required")
        private LocalDate incidentDate;

        @NotNull(message = "Incident time is required")
        private LocalTime incidentTime;

        @NotBlank(message = "Incident location is required")
        private String incidentLocation;

        private String priority;

        private String evidenceUrls;
}
