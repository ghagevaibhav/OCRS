package com.ocrs.backend.service;

import com.ocrs.backend.client.AuthServiceClient;
import com.ocrs.backend.dto.ApiResponse;
import com.ocrs.backend.dto.AuthorityDTO;
import com.ocrs.backend.dto.FIRRequest;
import com.ocrs.backend.dto.UpdateRequest;
import com.ocrs.backend.entity.FIR;
import com.ocrs.backend.entity.Update;
import com.ocrs.backend.repository.FIRRepository;
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
 * Unit tests for FIRService - updated to use AuthServiceClient instead of
 * AuthorityRepository
 */
@ExtendWith(MockitoExtension.class)
class FIRServiceTest {

        @Mock
        private FIRRepository firRepository;

        @Mock
        private AuthServiceClient authServiceClient;

        @Mock
        private UpdateRepository updateRepository;

        @Mock
        private ExternalServiceClient externalServiceClient;

        @InjectMocks
        private FIRService firService;

        private FIRRequest firRequest;
        private FIR testFir;
        private AuthorityDTO testAuthorityDTO;

        @BeforeEach
        void setUp() {
                // setup test fir request
                firRequest = new FIRRequest();
                firRequest.setCategory("THEFT");
                firRequest.setTitle("Test FIR");
                firRequest.setDescription("Test description");
                firRequest.setIncidentDate(LocalDate.now());
                firRequest.setIncidentLocation("Test Location");

                // setup test authority DTO (from Auth service via Feign)
                testAuthorityDTO = AuthorityDTO.builder()
                                .id(1L)
                                .fullName("Test Officer")
                                .email("officer@test.com")
                                .isActive(true)
                                .build();

                // setup test fir entity
                testFir = FIR.builder()
                                .id(1L)
                                .firNumber("FIR-TEST123")
                                .userId(1L)
                                .authorityId(1L)
                                .category(FIR.Category.THEFT)
                                .title("Test FIR")
                                .description("Test description")
                                .status(FIR.Status.PENDING)
                                .build();
        }

        @Test
        void fileFIR_success() {
                // arrange
                when(firRepository.save(any(FIR.class))).thenReturn(testFir);

                // act
                ApiResponse<FIR> response = firService.fileFIR(1L, firRequest);

                // assert
                assertTrue(response.isSuccess());
                assertEquals("FIR filed successfully", response.getMessage());
                assertNotNull(response.getData());
                verify(externalServiceClient).logEvent(eq("FIR_FILED"), anyLong(), anyString());
        }

        @Test
        void getFIRById_found() {
                // arrange
                when(firRepository.findById(1L)).thenReturn(Optional.of(testFir));

                // act
                ApiResponse<FIR> response = firService.getFIRById(1L);

                // assert
                assertTrue(response.isSuccess());
                assertEquals("FIR found", response.getMessage());
                assertEquals(testFir, response.getData());
        }

        @Test
        void getFIRById_notFound() {
                // arrange
                when(firRepository.findById(99L)).thenReturn(Optional.empty());

                // act
                ApiResponse<FIR> response = firService.getFIRById(99L);

                // assert
                assertFalse(response.isSuccess());
                assertEquals("FIR not found", response.getMessage());
        }

        @Test
        void getFIRsByUser_returnsList() {
                // arrange
                when(firRepository.findByUserId(1L)).thenReturn(Arrays.asList(testFir));

                // act
                List<FIR> result = firService.getFIRsByUser(1L);

                // assert
                assertEquals(1, result.size());
                assertEquals(testFir, result.get(0));
        }

        @Test
        void updateFIRStatus_success() {
                // arrange
                UpdateRequest updateRequest = new UpdateRequest();
                updateRequest.setNewStatus("UNDER_INVESTIGATION");
                updateRequest.setUpdateType("STATUS_CHANGE");
                updateRequest.setComment("Started investigation");

                when(firRepository.findById(1L)).thenReturn(Optional.of(testFir));
                when(firRepository.save(any(FIR.class))).thenReturn(testFir);
                when(updateRepository.save(any(Update.class))).thenReturn(new Update());
                when(authServiceClient.getAuthorityById(1L))
                                .thenReturn(ApiResponse.success("Authority found", testAuthorityDTO));

                // act
                ApiResponse<FIR> response = firService.updateFIRStatus(1L, 1L, updateRequest);

                // assert
                assertTrue(response.isSuccess());
                assertEquals("FIR updated successfully", response.getMessage());
                verify(externalServiceClient).logEvent(eq("FIR_UPDATED"), anyLong(), anyString(), anyString());
        }

        @Test
        void updateFIRStatus_unauthorized() {
                // arrange
                UpdateRequest updateRequest = new UpdateRequest();
                when(firRepository.findById(1L)).thenReturn(Optional.of(testFir));

                // act - different authority id
                ApiResponse<FIR> response = firService.updateFIRStatus(1L, 99L, updateRequest);

                // assert
                assertFalse(response.isSuccess());
                assertEquals("You are not authorized to update this FIR", response.getMessage());
        }

        @Test
        void reassignFIR_success() {
                // arrange
                AuthorityDTO newAuthorityDTO = AuthorityDTO.builder()
                                .id(2L)
                                .fullName("New Officer")
                                .isActive(true)
                                .build();
                when(firRepository.findById(1L)).thenReturn(Optional.of(testFir));
                when(authServiceClient.getAuthorityById(2L))
                                .thenReturn(ApiResponse.success("Authority found", newAuthorityDTO));
                when(firRepository.save(any(FIR.class))).thenReturn(testFir);
                when(updateRepository.save(any(Update.class))).thenReturn(new Update());

                // act
                ApiResponse<FIR> response = firService.reassignFIR(1L, 2L);

                // assert
                assertTrue(response.isSuccess());
                assertEquals("FIR reassigned successfully", response.getMessage());
        }

        @Test
        void reassignFIR_sameAuthority_fails() {
                // arrange
                when(firRepository.findById(1L)).thenReturn(Optional.of(testFir));
                when(authServiceClient.getAuthorityById(1L))
                                .thenReturn(ApiResponse.success("Authority found", testAuthorityDTO));

                // act
                ApiResponse<FIR> response = firService.reassignFIR(1L, 1L);

                // assert
                assertFalse(response.isSuccess());
                assertEquals("Cannot reassign to the same authority", response.getMessage());
        }

        @Test
        void reassignFIR_authorityNotFound() {
                // arrange
                when(firRepository.findById(1L)).thenReturn(Optional.of(testFir));
                when(authServiceClient.getAuthorityById(99L))
                                .thenReturn(ApiResponse.error("Authority not found"));

                // act
                ApiResponse<FIR> response = firService.reassignFIR(1L, 99L);

                // assert
                assertFalse(response.isSuccess());
                assertEquals("Authority not found", response.getMessage());
        }

        @Test
        void updateFIRStatus_closedCase_fails() {
                // arrange - create a CLOSED FIR
                FIR closedFir = FIR.builder()
                                .id(2L)
                                .firNumber("FIR-CLOSED1")
                                .userId(1L)
                                .authorityId(1L)
                                .category(FIR.Category.THEFT)
                                .title("Closed FIR")
                                .description("This case is closed")
                                .status(FIR.Status.CLOSED)
                                .build();

                UpdateRequest updateRequest = new UpdateRequest();
                updateRequest.setNewStatus("UNDER_INVESTIGATION");
                updateRequest.setUpdateType("STATUS_CHANGE");
                updateRequest.setComment("Attempt to reopen");

                when(firRepository.findById(2L)).thenReturn(Optional.of(closedFir));

                // act - try to update a closed FIR
                ApiResponse<FIR> response = firService.updateFIRStatus(2L, 1L, updateRequest);

                // assert
                assertFalse(response.isSuccess());
                assertEquals("Cannot update a closed case. Closed cases are final and cannot be modified.",
                                response.getMessage());
                verify(firRepository, never()).save(any(FIR.class));
        }
}
