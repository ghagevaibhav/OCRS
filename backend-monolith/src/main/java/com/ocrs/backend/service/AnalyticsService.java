package com.ocrs.backend.service;

import com.ocrs.backend.dto.AuthorityAnalyticsResponse;
import com.ocrs.backend.dto.AnalyticsResponse;
import com.ocrs.backend.entity.FIR;
import com.ocrs.backend.entity.MissingPerson;
import com.ocrs.backend.repository.AuthorityRepository;
import com.ocrs.backend.repository.FIRRepository;
import com.ocrs.backend.repository.MissingPersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

        @Autowired
        private FIRRepository firRepository;

        @Autowired
        private MissingPersonRepository missingPersonRepository;

        @Autowired
        private AuthorityRepository authorityRepository;

        public AnalyticsResponse getAnalytics() {
                // ... (existing code remains same)
                // FIR counts
                Long totalFirs = firRepository.count();
                Long pendingFirs = firRepository.countByStatus(FIR.Status.PENDING);
                Long resolvedFirs = firRepository.countByStatus(FIR.Status.RESOLVED);

                // Missing person counts
                Long totalMissingPersons = missingPersonRepository.count();
                Long foundPersons = missingPersonRepository.countByStatus(MissingPerson.MissingStatus.FOUND);

                // Authority count (only active)
                Long totalAuthorities = authorityRepository.countByIsActiveTrue();

                // FIRs by category
                Map<String, Long> firsByCategory = new HashMap<>();
                List<Object[]> categoryData = firRepository.countByCategory();
                for (Object[] row : categoryData) {
                        firsByCategory.put(row[0].toString(), (Long) row[1]);
                }

                // FIRs by status
                Map<String, Long> firsByStatus = new HashMap<>();
                List<Object[]> statusData = firRepository.countGroupByStatus();
                for (Object[] row : statusData) {
                        firsByStatus.put(row[0].toString(), (Long) row[1]);
                }

                // Missing persons by status
                Map<String, Long> missingByStatus = new HashMap<>();
                List<Object[]> missingStatusData = missingPersonRepository.countGroupByStatus();
                for (Object[] row : missingStatusData) {
                        missingByStatus.put(row[0].toString(), (Long) row[1]);
                }

                // Top authorities by case count (FIRs)
                Map<String, Long> topAuthorities = new HashMap<>();
                List<Object[]> officerData = firRepository.countGroupByOfficer();
                for (Object[] row : officerData) {
                        topAuthorities.put(row[0].toString(), (Long) row[1]);
                }

                return AnalyticsResponse.builder()
                                .totalFirs(totalFirs)
                                .pendingFirs(pendingFirs)
                                .resolvedFirs(resolvedFirs)
                                .totalMissingPersons(totalMissingPersons)
                                .foundPersons(foundPersons)
                                .totalAuthorities(totalAuthorities)
                                .firsByCategory(firsByCategory)
                                .firsByStatus(firsByStatus)
                                .missingByStatus(missingByStatus)
                                .topAuthorities(topAuthorities)
                                .build();
        }

        public AuthorityAnalyticsResponse getAuthorityAnalytics(Long authorityId) {
                Long assignedFIRs = firRepository.countByAuthorityId(authorityId);
                Long pendingFIRs = firRepository.countByAuthorityIdAndStatus(authorityId, FIR.Status.PENDING);
                Long resolvedFIRs = firRepository.countByAuthorityIdAndStatus(authorityId, FIR.Status.RESOLVED);

                Long assignedMissing = missingPersonRepository.countByAuthorityId(authorityId);
                Long foundMissing = missingPersonRepository.countByAuthorityIdAndStatus(authorityId,
                                MissingPerson.MissingStatus.FOUND);

                Map<String, Long> firsByStatus = new HashMap<>();
                for (Object[] row : firRepository.countGroupByStatusByAuthority(authorityId)) {
                        firsByStatus.put(row[0].toString(), (Long) row[1]);
                }

                Map<String, Long> missingByStatus = new HashMap<>();
                for (Object[] row : missingPersonRepository.countGroupByStatusByAuthority(authorityId)) {
                        missingByStatus.put(row[0].toString(), (Long) row[1]);
                }

                return AuthorityAnalyticsResponse.builder()
                                .assignedFIRs(assignedFIRs)
                                .pendingFIRs(pendingFIRs)
                                .resolvedFIRs(resolvedFIRs)
                                .assignedMissingReports(assignedMissing)
                                .foundMissingReports(foundMissing)
                                .firsByStatus(firsByStatus)
                                .missingByStatus(missingByStatus)
                                .build();
        }
}
