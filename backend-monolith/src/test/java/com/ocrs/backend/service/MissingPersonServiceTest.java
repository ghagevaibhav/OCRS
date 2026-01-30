package com.ocrs.backend.service;

import com.ocrs.backend.client.AuthServiceClient;
import com.ocrs.backend.dto.ApiResponse;
import com.ocrs.backend.dto.AuthorityDTO;
import com.ocrs.backend.dto.MissingPersonRequest;
import com.ocrs.backend.dto.UpdateRequest;
import com.ocrs.backend.entity.MissingPerson;
import com.ocrs.backend.entity.Update;
import com.ocrs.backend.repository.MissingPersonRepository;
import com.ocrs.backend.repository.UpdateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for MissingPersonService - updated to use AuthServiceClient
 * instead of AuthorityRepository
 */
@ExtendWith(MockitoExtension.class)
class MissingPersonServiceTest {

        @Mock
        private MissingPersonRepository missingPersonRepository;

        @Mock
        private AuthServiceClient authServiceClient;

        @Mock
        private UpdateRepository updateRepository;

        @Mock
        private ExternalServiceClient externalServiceClient;

        @InjectMocks
        private MissingPersonService missingPersonService;

        private MissingPersonRequest missingRequest;
        private MissingPerson testReport;
        private AuthorityDTO testAuthorityDTO;

        @BeforeEach
        void setUp() {
                // setup test request
                missingRequest = new MissingPersonRequest();
                missingRequest.setMissingPersonName("John Doe");
                missingRequest.setAge(25);
                missingRequest.setGender("MALE");
                missingRequest.setLastSeenDate(LocalDate.now().minusDays(1));
                missingRequest.setLastSeenLocation("Test Location");
                missingRequest.setDescription("Test description");
                missingRequest.setContactPhone("1234567890");

                // setup test authority DTO (from Auth service via Feign)
                testAuthorityDTO = AuthorityDTO.builder()
                                .id(1L)
                                .fullName("Test Officer")
                                .email("officer@test.com")
                                .isActive(true)
                                .build();

                // setup test report
                testReport = MissingPerson.builder()
                                .id(1L)
                                .caseNumber("MP-TEST123")
                                .userId(1L)
                                .authorityId(1L)
                                .missingPersonName("John Doe")
                                .status(MissingPerson.MissingStatus.MISSING)
                                .build();
        }

        @Test
        void fileReport_success() {
                // arrange
                when(missingPersonRepository.save(any(MissingPerson.class))).thenReturn(testReport);

                // act
                ApiResponse<MissingPerson> response = missingPersonService.fileReport(1L, missingRequest);

                // assert
                assertTrue(response.isSuccess());
                assertEquals("Missing person report filed successfully", response.getMessage());
                assertNotNull(response.getData());
                verify(externalServiceClient).logEvent(eq("MISSING_PERSON_FILED"), anyLong(), anyString());
        }

        @Test
        void getReportById_found() {
                // arrange
                when(missingPersonRepository.findById(1L)).thenReturn(Optional.of(testReport));

                // act
                ApiResponse<MissingPerson> response = missingPersonService.getReportById(1L);

                // assert
                assertTrue(response.isSuccess());
                assertEquals("Report found", response.getMessage());
                assertEquals(testReport, response.getData());
        }

        @Test
        void getReportById_notFound() {
                // arrange
                when(missingPersonRepository.findById(99L)).thenReturn(Optional.empty());

                // act
                ApiResponse<MissingPerson> response = missingPersonService.getReportById(99L);

                // assert
                assertFalse(response.isSuccess());
                assertEquals("Report not found", response.getMessage());
        }

        @Test
        void getReportsByUser_returnsList() {
                // arrange
                when(missingPersonRepository.findByUserId(1L)).thenReturn(Arrays.asList(testReport));

                // act
                List<MissingPerson> result = missingPersonService.getReportsByUser(1L);

                // assert
                assertEquals(1, result.size());
                assertEquals(testReport, result.get(0));
        }

        @Test
        void updateReportStatus_success() {
                // arrange
                UpdateRequest updateRequest = new UpdateRequest();
                updateRequest.setNewStatus("FOUND");
                updateRequest.setUpdateType("STATUS_CHANGE");
                updateRequest.setComment("Initiated search");

                when(missingPersonRepository.findById(1L)).thenReturn(Optional.of(testReport));
                when(missingPersonRepository.save(any(MissingPerson.class))).thenReturn(testReport);
                when(updateRepository.save(any(Update.class))).thenReturn(new Update());
                when(authServiceClient.getAuthorityById(1L))
                                .thenReturn(ApiResponse.success("Authority found", testAuthorityDTO));

                // act
                ApiResponse<MissingPerson> response = missingPersonService.updateReportStatus(1L, 1L, updateRequest);

                // assert
                assertTrue(response.isSuccess());
                assertEquals("Report updated successfully", response.getMessage());
                verify(externalServiceClient).logEvent(eq("MISSING_PERSON_UPDATED"), anyLong(), anyString(),
                                anyString());
        }

        @Test
        void updateReportStatus_unauthorized() {
                // arrange
                UpdateRequest updateRequest = new UpdateRequest();
                when(missingPersonRepository.findById(1L)).thenReturn(Optional.of(testReport));

                // act - different authority id
                ApiResponse<MissingPerson> response = missingPersonService.updateReportStatus(1L, 99L, updateRequest);

                // assert
                assertFalse(response.isSuccess());
                assertEquals("You are not authorized to update this report", response.getMessage());
        }

        @Test
        void reassignReport_success() {
                // arrange
                AuthorityDTO newAuthorityDTO = AuthorityDTO.builder()
                                .id(2L)
                                .fullName("New Officer")
                                .isActive(true)
                                .build();
                when(missingPersonRepository.findById(1L)).thenReturn(Optional.of(testReport));
                when(authServiceClient.getAuthorityById(2L))
                                .thenReturn(ApiResponse.success("Authority found", newAuthorityDTO));
                when(missingPersonRepository.save(any(MissingPerson.class))).thenReturn(testReport);
                when(updateRepository.save(any(Update.class))).thenReturn(new Update());

                // act
                ApiResponse<MissingPerson> response = missingPersonService.reassignReport(1L, 2L);

                // assert
                assertTrue(response.isSuccess());
                assertEquals("Report reassigned successfully", response.getMessage());
        }

        @Test
        void reassignReport_sameAuthority_fails() {
                // arrange
                when(missingPersonRepository.findById(1L)).thenReturn(Optional.of(testReport));
                when(authServiceClient.getAuthorityById(1L))
                                .thenReturn(ApiResponse.success("Authority found", testAuthorityDTO));

                // act
                ApiResponse<MissingPerson> response = missingPersonService.reassignReport(1L, 1L);

                // assert
                assertFalse(response.isSuccess());
                assertEquals("Cannot reassign to the same authority", response.getMessage());
        }

        @Test
        void reassignReport_authorityNotFound() {
                // arrange
                when(missingPersonRepository.findById(1L)).thenReturn(Optional.of(testReport));
                when(authServiceClient.getAuthorityById(99L))
                                .thenReturn(ApiResponse.error("Authority not found"));

                // act
                ApiResponse<MissingPerson> response = missingPersonService.reassignReport(1L, 99L);

                // assert
                assertFalse(response.isSuccess());
                assertEquals("Authority not found", response.getMessage());
        }

        @Test
        void updateReportStatus_closedCase_fails() {
                // arrange - create a CLOSED report
                MissingPerson closedReport = MissingPerson.builder()
                                .id(2L)
                                .caseNumber("MP-CLOSED1")
                                .userId(1L)
                                .authorityId(1L)
                                .missingPersonName("Closed Case Person")
                                .status(MissingPerson.MissingStatus.CLOSED)
                                .build();

                UpdateRequest updateRequest = new UpdateRequest();
                updateRequest.setNewStatus("SEARCHING");
                updateRequest.setUpdateType("STATUS_CHANGE");
                updateRequest.setComment("Attempt to reopen");

                when(missingPersonRepository.findById(2L)).thenReturn(Optional.of(closedReport));

                // act - try to update a closed report
                ApiResponse<MissingPerson> response = missingPersonService.updateReportStatus(2L, 1L, updateRequest);

                // assert
                assertFalse(response.isSuccess());
                assertEquals("Cannot update a closed case. Closed cases are final and cannot be modified.",
                                response.getMessage());
                verify(missingPersonRepository, never()).save(any(MissingPerson.class));
        }
}
