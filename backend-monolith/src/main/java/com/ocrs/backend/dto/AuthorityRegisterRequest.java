package com.ocrs.backend.dto;

import lombok.Data;

@Data
public class AuthorityRegisterRequest {
        private String email;
        private String password;
        private String fullName;
        private String badgeNumber;
        private String designation;
        private String stationName;
        private String stationAddress;
        private String phone;
}
