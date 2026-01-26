package com.ocrs.auth.controller;

import com.ocrs.auth.dto.ApiResponse;
import com.ocrs.auth.dto.AuthorityDTO;
import com.ocrs.auth.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/authority")
public class AuthorityController {

        @Autowired
        private AuthService authService;

        @PutMapping("/{id}")
        public ResponseEntity<ApiResponse<AuthorityDTO>> updateAuthority(
                        @PathVariable Long id,
                        @RequestBody AuthorityDTO request) {
                ApiResponse<AuthorityDTO> response = authService.updateAuthority(id, request);
                if (response.isSuccess()) {
                        return ResponseEntity.ok(response);
                }
                return ResponseEntity.badRequest().body(response);
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<ApiResponse<Boolean>> deleteAuthority(@PathVariable Long id) {
                ApiResponse<Boolean> response = authService.deleteAuthority(id);
                if (response.isSuccess()) {
                        return ResponseEntity.ok(response);
                }
                return ResponseEntity.badRequest().body(response);
        }
}
