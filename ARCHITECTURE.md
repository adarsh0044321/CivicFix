# CivicFix: System Architecture & Technical Specifications

---

## 1. High-Level Multi-Tier Architecture

CivicFix is designed around a decoupled, multi-tier enterprise architecture. This guarantees clear separation of concerns, independent scalability, and testability.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT TIER (React 18 + TypeScript)               │
│  ┌─────────────────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │ Citizen Portal          │  │ Admin Dashboard  │  │ Worker Workspace   │  │
│  │ (Mobile-first PWA)      │  │ (Command Center) │  │ (Field Execution)  │  │
│  └────────────┬────────────┘  └────────┬─────────┘  └─────────┬──────────┘  │
│               │                        │                      │             │
│               └────────────────────────┼──────────────────────┘             │
│                                        │ (Axios / Fetch + JWT Bearer)       │
└────────────────────────────────────────┼────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION TIER (Spring Boot 3.x)                  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Spring Security Filter Chain (CORS, CSRF disable, JWT Auth Filter)    │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │ REST Controllers (API Exposure, DTO Validation, Role-Based Access)    │  │
│  │ • AuthController        • ComplaintController  • AdminController      │  │
│  │ • WorkerController      • PublicController     • HeatmapController    │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │ Core Business Service Layer                                           │  │
│  │ • ComplaintService       • PriorityEngineService (15-pt formula)      │  │
│  │ • DuplicateRadarService  • SLAEscalationService (Task Scheduler)     │  │
│  │ • GeminiAiService        • ResolutionVerificationService              │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │ Data Access Layer (Spring Data JPA Repositories + Hibernate Spatial)   │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
                 ┌─────────────────────┴─────────────────────┐
                 ▼                                           ▼
┌─────────────────────────────────────┐     ┌─────────────────────────────────┐
│           DATA TIER                 │     │        EXTERNAL SERVICES        │
│ • PostgreSQL 16                     │     │ • Google Gemini 1.5 Flash API   │
│ • PostGIS Extension (Geometry/GIST) │     │   (Multimodal Vision & Audio)   │
│ • Database Seeder (Dev fixtures)    │     │ • Mapbox GL JS & Vector Tiles   │
│ • Flyway Migration Engine           │     │ • OpenStreetMap Nominatim API   │
└─────────────────────────────────────┘     └─────────────────────────────────┘
```

---

## 2. Frontend & Backend Separation Strategy

1. **Stateless HTTP REST Communication**:
   - The React frontend runs independently on Vite (`http://localhost:5173`).
   - The Spring Boot backend runs on port `8080` (`http://localhost:8080`).
   - In development, Vite's dev proxy forwards `/api/*` requests to the backend, avoiding cross-origin issues.
2. **Authentication via Bearer Token**:
   - Authentication is strictly token-based (JWT). No server-side HTTP session state (`STATELESS`) is maintained by Spring Security.
   - Every protected request includes the header: `Authorization: Bearer <JWT_TOKEN>`.
3. **Data Transfer Object (DTO) Boundary**:
   - Entities (`ComplaintEntity`, `UserEntity`) are internal to the persistence layer.
   - Controllers strictly consume `RequestDto` and return `ResponseDto` objects.
   - This prevents sensitive columns (e.g. `password_hash`, internal database IDs, citizen PII) from ever leaking to client responses.

---

## 3. End-to-End System Workflows

### 3.1 Complaint Intake & Duplicate Triage Workflow
```
[Citizen] ──(Submits Text/Voice/Image + GPS)──► [POST /api/complaints]
                                                        │
                                                        ▼
                                            [Reverse Geocode / Vague Resolver]
                                                        │
                                                        ▼
                                            [Gemini Multimodal Analysis]
                                            (Extract Category & Severity)
                                                        │
                                                        ▼
                                            [Duplicate Radar Service]
                                            (PostGIS Spatial <= 150m + Text Sim)
                                                        │
                                  ┌─────────────────────┴─────────────────────┐
                                  │ (Duplicate Detected?)                     │
                                 Yes                                         No
                                  ▼                                           ▼
                    [Link to Parent Complaint]                   [Create Master Complaint]
                    [Increment Duplicate Count]                  [Calculate Priority (0-15)]
                    [Boost Priority Score]                       [Assign Initial SLA Clock]
                                  │                                           │
                                  └─────────────────────┬─────────────────────┘
                                                        ▼
                                            [Persist to PostgreSQL]
                                            [Record Initial StatusLog]
                                            [Return Complaint ID CFX-...]
```

---

### 3.2 Resolution & Citizen Verification Workflow
```
[Repair Worker] ──(Uploads 'After' Photo + Notes)──► [POST /api/worker/tasks/{id}/proof]
                                                              │
                                                              ▼
                                                   [Validate Photo Integrity]
                                                   [Run Gemini Before/After Check]
                                                              │
                                                              ▼
                                                   [Update Complaint Status]
                                                   ('AWAITING_VERIFICATION')
                                                   *(Ticket Remains OPEN)*
                                                              │
                                                              ▼
                                              [Notify Reporting Citizen / Portal]
                                                              │
                                      ┌───────────────────────┴───────────────────────┐
                                      │ (Citizen Verification Decision)               │
                                   Approved                                       Disputed
                                      ▼                                               ▼
                         [POST .../verify]                              [POST .../dispute]
                         [Status: 'VERIFIED_RESOLVED']                  [Status: 'REOPENED_DISPUTED']
                         [Ticket Permanently Closed]                    [Priority Score Boosted +2]
                         [Log Status & Citizen Rating]                  [Re-routed to Department Head]
```

---

## 4. Security & Access Control Design

1. **Password Security**:
   - Passwords encoded using Spring Security's `BCryptPasswordEncoder` with strength factor 12.
2. **JWT Security Lifecycle**:
   - JWT tokens signed using HMAC-SHA256 (`HS256`) with a 256-bit secret stored in backend environment variables.
   - Token payload includes: `subject` (user ID), `email`, `role`, `issuedAt`, and `expiration` (default 24 hours).
3. **Role-Based Authorization Chain**:
   ```java
   // Conceptual Spring Security configuration
   http
     .authorizeHttpRequests(auth -> auth
       .requestMatchers("/api/auth/**", "/api/public/**").permitAll()
       .requestMatchers("/api/admin/**").hasRole("ADMIN")
       .requestMatchers("/api/worker/**").hasRole("WORKER")
       .requestMatchers("/api/citizen/**").hasRole("CITIZEN")
       .anyRequest().authenticated()
     )
   ```
4. **CORS Defense**:
   - Explicitly configured to allow requests only from approved origins (e.g., `http://localhost:5173`).
   - Standard headers permitted: `Authorization`, `Content-Type`, `Accept`.

---

## 5. Technology Selection Rationale

| Component | Selected Technology | Why it was chosen over alternatives |
| :--- | :--- | :--- |
| **Backend** | Spring Boot 3.x (Java 21) | Robust enterprise MVC pattern, strict compile-time type safety, built-in transaction management (`@Transactional`), and first-class PostGIS spatial support via Hibernate Spatial. |
| **Frontend** | React 18 + TypeScript (Vite) | Fast development cycle, strict interface typing matching backend DTOs, reactive component updates for map and SLA countdown clocks. |
| **Database** | PostgreSQL 16 + PostGIS | PostGIS is the industry standard for GIS operations. Allows spatial distance queries (`ST_DWithin`) directly on spatial indexes (`GIST`) without in-memory calculations. |
| **Mapping** | Mapbox GL JS | GPU-accelerated client-side rendering capable of rendering continuous density heatmaps (`type: 'heatmap'`) and vector marker clusters without lag. |
| **AI Engine** | Google Gemini 1.5 Flash | Fast multimodal token generation; natively handles both image recognition (potholes, garbage, wires) and regional audio transcription within a single API suite. |
