package com.civicfix.dto;

import com.civicfix.model.enums.UserRole;
import java.util.UUID;

public class UserSummaryDto {

    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private UserRole role;
    private String departmentName;

    public UserSummaryDto() {}

    public UserSummaryDto(UUID id, String email, String fullName, String phone, UserRole role, String departmentName) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.phone = phone;
        this.role = role;
        this.departmentName = departmentName;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
}
