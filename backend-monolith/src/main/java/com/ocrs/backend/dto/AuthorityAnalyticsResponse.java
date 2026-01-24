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
public class AuthorityAnalyticsResponse {
        private Long assignedFIRs;
        private Long pendingFIRs;
        private Long resolvedFIRs;
        private Long assignedMissingReports;
        private Long foundMissingReports;
        private Map<String, Long> firsByStatus;
        private Map<String, Long> missingByStatus;
}
