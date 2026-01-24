package com.ocrs.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MissingPersonRequest {

        @NotBlank(message = "Missing person name is required")
        private String missingPersonName;

        private Integer age;

        private String gender;

        private String height;

        private String weight;

        private String complexion;

        private String identifyingMarks;

        @NotNull(message = "Last seen date is required")
        private LocalDate lastSeenDate;

        @NotBlank(message = "Last seen location is required")
        private String lastSeenLocation;

        private String description;

        private String photoUrl;

        private String contactPhone;
}
