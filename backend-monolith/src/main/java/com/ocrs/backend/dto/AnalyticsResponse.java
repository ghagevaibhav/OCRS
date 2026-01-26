package com.ocrs.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsResponse {
        private Long totalFirs;
        private Long pendingFirs;
        private Long resolvedFirs;
        private Long totalMissingPersons;
        private Long foundPersons;
        private Long totalAuthorities;
        private Map<String, Long> firsByCategory;
        private Map<String, Long> firsByStatus;
        private Map<String, Long> missingByStatus;
        private Map<String, Long> topAuthorities;
        private Double averageResolutionTime;
        private Double firGrowthRate;
}
