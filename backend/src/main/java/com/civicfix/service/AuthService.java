package com.civicfix.service;

import com.civicfix.dto.AuthResponseDto;
import com.civicfix.dto.LoginRequestDto;
import com.civicfix.dto.RegisterRequestDto;
import com.civicfix.dto.UserSummaryDto;
import com.civicfix.entity.Department;
import com.civicfix.entity.User;
import com.civicfix.exception.ResourceNotFoundException;
import com.civicfix.model.enums.UserRole;
import com.civicfix.repository.DepartmentRepository;
import com.civicfix.repository.UserRepository;
import com.civicfix.security.JwtTokenProvider;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider
    ) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * Authenticate user with email and password
     */
    @Transactional(readOnly = true)
    public AuthResponseDto login(LoginRequestDto loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtTokenProvider.generateToken(user);
        return new AuthResponseDto(token, toSummaryDto(user));
    }

    /**
     * Register a new user
     */
    @Transactional
    public AuthResponseDto register(RegisterRequestDto registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new IllegalArgumentException("Email address already registered: " + registerRequest.getEmail());
        }

        User user = new User();
        user.setEmail(registerRequest.getEmail());
        user.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
        user.setFullName(registerRequest.getFullName());
        user.setPhone(registerRequest.getPhone());
        user.setRole(registerRequest.getRole());

        if (registerRequest.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(registerRequest.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", registerRequest.getDepartmentId()));
            user.setDepartment(dept);
        }

        User saved = userRepository.save(user);
        String token = jwtTokenProvider.generateToken(saved);
        return new AuthResponseDto(token, toSummaryDto(saved));
    }

    /**
     * Get user profile by ID
     */
    @Transactional(readOnly = true)
    public UserSummaryDto getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return toSummaryDto(user);
    }

    private UserSummaryDto toSummaryDto(User user) {
        String deptName = user.getDepartment() != null ? user.getDepartment().getName() : null;
        return new UserSummaryDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole(),
                deptName
        );
    }

    /**
     * Automatically seed demo accounts in Supabase if not present
     */
    @Override
    public void run(String... args) {
        seedUserIfNotExists("admin@civicfix.gov.in", "Admin@123", "Elena Vance", "+91 94370 12345", UserRole.ADMIN);
        seedUserIfNotExists("citizen@civicfix.gov.in", "Citizen@123", "Rohan Sharma", "+91 98610 54321", UserRole.CITIZEN);
        seedUserIfNotExists("worker@civicfix.gov.in", "Worker@123", "ABC Construction Ltd", "+91 97780 98765", UserRole.WORKER);
        seedUserIfNotExists("solai@civicfix.gov.in", "Solai@123", "Solai", "+91 98765 11223", UserRole.CITIZEN);
    }

    private void seedUserIfNotExists(String email, String rawPassword, String name, String phone, UserRole role) {
        if (!userRepository.existsByEmail(email)) {
            User u = new User(email, passwordEncoder.encode(rawPassword), name, phone, role);
            userRepository.save(u);
        }
    }
}
