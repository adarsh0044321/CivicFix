# CivicFix: Master Development Roadmap & Implementation Plan
## Problem Statement PS-09: Municipal Grievance Triage, Deduplication & Accountability

---

## 1. Project Scope & Alignment with PS-09

### 1.1 Objective & Review Focus
**CivicFix** is an AI-assisted municipal grievance management platform designed to automate complaint triage, group duplicate reports, compute transparent priority scores, route tasks to municipal departments, track service-level agreement (SLA) deadlines, and verify resolution integrity.

The project strictly fulfills all requirements of **PS-09**:
- **5 Mandated Sample Categories**:
  1. `ROAD_DAMAGE`: Road damage and potholes
  2. `GARBAGE_WASTE`: Garbage and waste management
  3. `STREETLIGHT`: Streetlight failures & electrical hazards
  4. `DRAINAGE`: Drainage and waterlogging
  5. `WATER_SUPPLY`: Water supply and pipe bursts
- **The Core Constraint**:
  > **"Do not silently reject complaints or hide how priority is assigned."**
  - Uncertain locations (vague descriptions) are accepted with low location confidence and routed to an administrator review queue.
  - Priority scores are calculated deterministically through an explainable multi-factor formula, never via an opaque black-box response.

---

## 2. Final Feature List

### 2.1 Citizen Module
- **Multimodal Input**: Submit complaints via text description, image upload, and regional voice-to-text (Hindi, Odia, English).
- **Location Pinpointing**: GPS location capture with permission or manual Mapbox map pin placement; reverse geocoding to human-readable street address.
- **Vague Location Handling**: Accepts descriptions like *"near ITER main gate"* or *"behind college water tank"*, resolving landmarks or flagging for administrative review.
- **AI Preview & Confirmation**: Review extracted category, urgency, and description prior to final submission.
- **Public & Authenticated Tracking**: Track status, assigned department, target SLA deadline, and timeline using a unique Complaint ID (`CFX-YYYY-XXXXX`).
- **Community Confirmation & Upvoting**: View nearby open issues on a local map and upvote/confirm existing issues instead of creating duplicate tickets.
- **Resolution Verification**: Review worker "after" photographs; approve closure or dispute/reopen if the problem persists.

### 2.2 Administrator Module
- **Command Dashboard**: Centralized view of pending, assigned, overdue, and resolved grievances across all 5 categories.
- **AI Triage & Review**: Review AI-suggested category, severity, and deterministic priority breakdown. Correct classifications when necessary.
- **Department & Worker Routing**: Assign complaints to specific municipal departments and dispatch individual field repair workers.
- **Live SLA Monitoring**: Real-time SLA countdown timers, automated escalation alerts for breached targets, and audit logs.
- **Geospatial & Heatmap Analytics**: True Mapbox GPU-accelerated density heatmap and cluster views filtered by category, status, and ward.
- **Deduplication Radar**: Review grouped duplicate clusters; merge or decouple linked complaints.

### 2.3 Repair / Maintenance Worker Module
- **Worker Workspace**: Dedicated mobile-responsive interface showing assigned repair tasks.
- **Task Detail & Navigation**: Access complaint description, photos, citizen contact (masked), and mapped coordinates.
- **Progress Tracking**: Update status from `ASSIGNED` $\to$ `IN_PROGRESS` $\to$ `WORK_COMPLETED`.
- **Proof of Resolution Upload**: Mandatory upload of post-repair completion photographs and completion remarks.

---

## 3. User Roles & Permissions Matrix

| Operation / Endpoint | Citizen | Repair Worker | Administrator | Public (Unauthenticated) |
| :--- | :---: | :---: | :---: | :---: |
| Submit New Complaint | Yes | No | Yes | No |
| View Public Heatmap / City Health | Yes | Yes | Yes | Yes |
| Track Complaint by ID (`CFX-...`) | Yes | Yes | Yes | Yes (Masked PII) |
| Upvote / Confirm Existing Issue | Yes | No | No | No |
| View Assigned Work Queue | No | Yes | Yes | No |
| Update Work Status (`IN_PROGRESS`) | No | Yes | Yes | No |
| Upload Resolution Proof Photo | No | Yes | Yes | No |
| Approve Closure / Dispute Fix | Yes (Reporter) | No | Yes | No |
| Reassign Department / Worker | No | No | Yes | No |
| Override Priority / Category | No | No | Yes | No |
| Manage User Roles & Seed Data | No | No | Yes (Dev only) | No |

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT TIER (React + TypeScript)                  │
│   ┌─────────────────────┐   ┌────────────────────┐   ┌───────────────────┐  │
│   │ Citizen Portal      │   │ Admin Command Ctr  │   │ Worker Workspace  │  │
│   │ (Mobile Responsive) │   │ (Analytics & Maps) │   │ (Field Execution) │  │
│   └──────────┬──────────┘   └─────────┬──────────┘   └─────────┬─────────┘  │
└──────────────┼────────────────────────┼────────────────────────┼────────────┘
               │                        │                        │
               ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REVERSE PROXY / REST API GATEWAY                      │
│                (Vite Dev Server Proxy / Spring Web MVC Router)              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION TIER (Spring Boot 3.x)                  │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ Security & JWT Filter │  │ Complaint Controller │  │ Admin Controller │  │
│  └──────────┬────────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
│             │                          │                       │            │
│  ┌──────────▼──────────────────────────▼───────────────────────▼─────────┐  │
│  │                          CORE SERVICE LAYER                           │  │
│  │  • PriorityEngineService (15-pt explainable formula)                  │  │
│  │  • DuplicateRadarService (PostGIS spatial + text similarity)          │  │
│  │  • SLAEscalationService (Target monitoring & automated alert)         │  │
│  │  • ResolutionVerificationService (Worker proof & citizen confirm)     │  │
│  │  • MediaStorageService (Secure evidence file storage)                 │  │
│  └─────────────────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────────────────┼────────────────────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
┌───────────────────────────────────┐   ┌─────────────────────────────────────┐
│       EXTERNAL SERVICES           │   │            DATA TIER                │
│ • Google Gemini 1.5 Flash         │   │ • PostgreSQL 16                     │
│   (Multimodal Vision & Audio API) │   │ • PostGIS Extension                 │
│ • Mapbox Geocoding & GL JS        │   │   (Spatial indexing `ST_DWithin`)   │
│ • OpenStreetMap Nominatim         │   │ • Flyway / Seed Migrations          │
└───────────────────────────────────┘   └─────────────────────────────────────┘
```

---

## 5. Proposed Database Entities & Relationships

### 5.1 Entity-Relationship Overview
```
┌──────────────┐         1:N         ┌───────────────────┐
│    users     ├────────────────────►│    complaints     │
│ (Role-based) │ (reporter / worker) │ (Core Entity)     │
└──────┬───────┘                     └───┬───────────┬───┘
       │                                 │ 1         │ 1
       │ 1:N                             │           │
       ▼                                 ▼ 1:N       ▼ 1:N
┌──────────────┐             ┌───────────────┐   ┌────────────────────┐
│ departments  │             │ status_logs   │   │ duplicate_links    │
│  (Municipal) │             │ (Audit Trail) │   │ (Cluster Grouping) │
└──────────────┘             └───────────────┘   └────────────────────┘
                                         │ 1
                                         ▼ 1:1
                             ┌───────────────────────┐
                             │  resolution_proofs    │
                             │ (Worker Photo & Notes)│
                             └───────────────────────┘
```

### 5.2 Core Database Schema Definitions
1. **`users`**:
   - `id` (UUID, PK)
   - `email` (VARCHAR, Unique), `password_hash` (VARCHAR)
   - `full_name` (VARCHAR), `phone` (VARCHAR)
   - `role` (ENUM: `CITIZEN`, `ADMIN`, `WORKER`)
   - `department_id` (UUID, FK $\to$ `departments`, nullable)
   - `created_at` (TIMESTAMP)

2. **`departments`**:
   - `id` (UUID, PK)
   - `name` (VARCHAR: Road, Sanitation, Electricity, Drainage, Water)
   - `code` (VARCHAR: `ROAD_MAINTENANCE`, etc.)
   - `contact_email` (VARCHAR)

3. **`complaints`**:
   - `id` (UUID, PK)
   - `complaint_id` (VARCHAR, Unique: `CFX-2026-10001`)
   - `reporter_id` (UUID, FK $\to$ `users`)
   - `assigned_worker_id` (UUID, FK $\to$ `users`, nullable)
   - `department_id` (UUID, FK $\to$ `departments`, nullable)
   - `title` (VARCHAR), `description` (TEXT)
   - `category` (ENUM: `ROAD_DAMAGE`, `GARBAGE_WASTE`, `STREETLIGHT`, `DRAINAGE`, `WATER_SUPPLY`)
   - `status` (ENUM: `SUBMITTED`, `ASSIGNED`, `IN_PROGRESS`, `WORK_COMPLETED`, `AWAITING_VERIFICATION`, `VERIFIED_RESOLVED`, `REOPENED_DISPUTED`)
   - `urgency` (ENUM: `LOW`, `MODERATE`, `HIGH`)
   - `priority_score` (INT: 0 to 15)
   - `priority_breakdown` (JSONB: `{severity: 4, safety: 3, people: 2, duration: 1, confirmations: 1}`)
   - `location_geometry` (`GEOMETRY(Point, 4326)`) — spatial coordinates (PostGIS)
   - `latitude` (DECIMAL), `longitude` (DECIMAL)
   - `address_text` (VARCHAR), `city` (VARCHAR), `ward` (VARCHAR)
   - `location_confidence` (ENUM: `HIGH_EXACT_GPS`, `LANDMARK_RESOLVED`, `LOW_VAGUE_TRIAGE`)
   - `image_url` (VARCHAR, nullable)
   - `audio_url` (VARCHAR, nullable)
   - `original_language_text` (TEXT, nullable)
   - `upvote_count` (INT, default 0)
   - `sla_hours` (INT)
   - `sla_deadline` (TIMESTAMP)
   - `is_overdue` (BOOLEAN, default false)
   - `is_duplicate` (BOOLEAN, default false)
   - `parent_complaint_id` (UUID, FK $\to$ `complaints`, nullable)
   - `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP)

4. **`status_logs`**:
   - `id` (UUID, PK)
   - `complaint_id` (UUID, FK $\to$ `complaints`)
   - `changed_by_user_id` (UUID, FK $\to$ `users`)
   - `from_status` (VARCHAR), `to_status` (VARCHAR)
   - `remarks` (TEXT)
   - `created_at` (TIMESTAMP)

5. **`resolution_proofs`**:
   - `id` (UUID, PK)
   - `complaint_id` (UUID, FK $\to$ `complaints`, unique)
   - `worker_id` (UUID, FK $\to$ `users`)
   - `before_image_url` (VARCHAR), `after_image_url` (VARCHAR)
   - `worker_notes` (TEXT)
   - `ai_verification_score` (INT, 0--100)
   - `ai_verification_notes` (TEXT)
   - `citizen_feedback` (TEXT, nullable)
   - `citizen_rating` (INT, 1--5, nullable)
   - `submitted_at` (TIMESTAMP)

---

## 6. API & External Service Dependencies

| Service | Purpose | Authentication | Fallback Mechanism |
| :--- | :--- | :--- | :--- |
| **Google Gemini 1.5 Flash** | Multimodal image classification & regional speech transcription | API Key stored securely in backend `application.yml` | Deterministic keyword regex classifier & manual triage queue |
| **Mapbox GL JS** | Interactive map, marker clusters & GPU heatmap | Public token in frontend `.env` | Fallback to OpenStreetMap raster tiles if quota is reached |
| **OSM Nominatim** | Reverse geocoding (Lat/Lng $\to$ Street Address) | User-Agent header (no secret key) | Manual user entry without blocking submission |
| **PostGIS Engine** | Geospatial indexing & distance queries (`ST_DWithin`) | Built into PostgreSQL container | Haversine trigonometric formula in Java |

---

## 7. UI Implementation Strategy

The user will provide a dedicated UI design reference file. We will follow this strict protocol:
1. **Inspect Before Coding**: Completely inspect all screens, color codes, spacing, component hierarchy, and interaction flows.
2. **Component Inventory**: Map reference elements to reusable React + TypeScript components (StatusBadges, UrgencyPills, PriorityCards, MapViewers, TimelineTracks).
3. **Screen-by-Screen Execution**: Build individual screen workflows (Citizen, Worker, Admin) incrementally without generating generic templates.
4. **Verification Against Reference**: Audit every completed screen directly against the design reference to fix visual discrepancies.

---

## 8. Controlled Demo Accounts & Seed Data Strategy

All demo accounts and seed data will be managed via a dedicated development database seeder (`DbSeeder.java` / SQL migration), never hardcoded into React components.

### 8.1 Demo Accounts
| Role | Email | Password (Dev) | Display Name | Assigned Department |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin@civicfix.internal` | `AdminDemo#2026` | Municipal Admin Officer | Central Grievance Cell |
| **Citizen (Primary)** | `citizen.priya@civicfix.internal` | `CitizenDemo#2026` | Priya Mohapatra | N/A (Ward 23) |
| **Citizen (Secondary)**| `citizen.rahul@civicfix.internal` | `CitizenDemo#2026` | Rahul Verma | N/A (Ward 14) |
| **Worker (Roads)** | `worker.bikram@civicfix.internal` | `WorkerDemo#2026` | Bikram Rout (Roads) | Road Maintenance |
| **Worker (Electricity)**| `worker.suresh@civicfix.internal` | `WorkerDemo#2026` | Suresh Jena (Electric) | Streetlight & Electricity |
| **Worker (Sanitation)**| `worker.arun@civicfix.internal` | `WorkerDemo#2026` | Arun Naik (Sanitation) | Sanitation & Waste |

### 8.2 Seed Complaints Dataset Matrix (Across 5 Categories)
The seed dataset includes 30 controlled test records covering:
- **Duplicate Pairs**: Two differently phrased complaints for the same road crater outside ITER main gate.
- **Overdue Issues**: Clogged drain in Master Canteen exceeding its 3-day target to demonstrate SLA escalation.
- **Vague Location**: *"Garbage dumped behind college water tank"* demonstrating low-confidence landmark resolution.
- **Resolved with Proof**: Water pipe burst at Baramunda containing before and after photos ready for citizen verification.

---

## 9. Master Development Roadmap: Phase-by-Phase Plan

```
Phase 0  ──► Requirement Analysis & Scope Freeze
Phase 1  ──► Architecture, Schemas & API Contract Design
Phase 2  ──► Development Environment & Multi-tier Skeleton Setup
Phase 3  ──► Database Layer & Backend CRUD Fundamentals
Phase 4  ──► UI Reference Analysis & Core Frontend Implementation
Phase 5  ──► Authentication & Role-Based Access Control (RBAC)
Phase 6  ──► Development Seed Data & Demo Scenarios
Phase 7  ──► Complaint Intake, Media Handling & Geocoding
Phase 8  ──► Gemini AI Multimodal Triage Service
Phase 9  ──► PostGIS Deduplication, Mapbox Heatmap & Spatial Indexing
Phase 10 ──► Transparent 15-Point Priority Engine & SLA Escalation
Phase 11 ──► Department Routing & Worker Task Dispatch
Phase 12 ──► Worker Execution & Citizen Resolution Verification
Phase 13 ──► Administrator Analytics, Audit Trail & Workflow Integration
Phase 14 ──► End-to-End Verification, Security Hardening & Documentation
```

---

### Phase 0: Requirement Analysis & Project Planning
- **Objectives**: Dissect PS-09, lock scope boundaries, finalize functional and non-functional requirements, establish acceptance criteria.
- **Prerequisites**: Master Prompt received and approved.
- **Implementation Tasks**:
  - Draft formal `REQUIREMENTS.md` documenting the 5 categories, 3 roles, and constraints.
  - Document risk register and technical assumptions.
  - Establish definition of done (DoD) for all subsequent phases.
- **Files Created/Modified**: `REQUIREMENTS.md`, `ROADMAP.md`.
- **Concepts to Learn**: Requirement traceability, architectural boundaries, civic grievance lifecycle.
- **Acceptance Criteria**: Scope document reviewed and approved by user with zero ambiguous items.
- **Testing & Verification**: Manual review checklist against PS-09 problem statement text.
- **Learning Checkpoint**: Can you explain why we locked the categories to exactly five?

---

### Phase 1: Architecture, Database Design & API Planning
- **Objectives**: Design relational schema, PostGIS spatial models, RESTful API endpoints, and authentication patterns.
- **Prerequisites**: Phase 0 complete.
- **Implementation Tasks**:
  - Design ER model with JPA entities: `User`, `Department`, `Complaint`, `StatusLog`, `ResolutionProof`.
  - Design PostGIS spatial column integration (`geometry(Point, 4326)`).
  - Draft `API_DOCUMENTATION.md` covering all REST endpoints, query params, and JSON schemas.
- **Files Created/Modified**: `ARCHITECTURE.md`, `DATABASE_DESIGN.md`, `API_DOCUMENTATION.md`.
- **Concepts to Learn**: Relational database normalization, foreign keys, spatial reference identifiers (SRID 4326), REST API design principles.
- **Acceptance Criteria**: Schema maps 100% of required complaint lifecycle states without circular dependencies.
- **Testing & Verification**: Schema validation against mock entity payloads.
- **Learning Checkpoint**: Why do we store both numeric `latitude/longitude` and a PostGIS `geometry` point?

---

### Phase 2: Development Environment & Project Setup
- **Objectives**: Initialize a production-ready repository skeleton with Spring Boot 3 (Java 21, Maven) and React 18+ (TypeScript, Vite).
- **Prerequisites**: Phase 1 complete.
- **Implementation Tasks**:
  - Generate Spring Boot backend with dependencies: Spring Web, Spring Data JPA, PostGIS Hibernate spatial, Flyway/Liquibase, Spring Security, Lombok.
  - Generate React + TypeScript frontend with Vite, Tailwind CSS, Lucide icons, React Router DOM.
  - Set up PostgreSQL with PostGIS extension locally or via Docker Compose.
  - Configure `.env` and `application.yml` profiles (`dev`, `test`).
- **Files Created/Modified**: `backend/pom.xml`, `backend/src/main/resources/application.yml`, `frontend/package.json`, `frontend/vite.config.ts`, `docker-compose.yml`.
- **Concepts to Learn**: Multi-tier architecture, Maven dependency management, Vite bundler proxy configuration, Dockerized databases.
- **Acceptance Criteria**: Both backend (`mvn spring-boot:run`) and frontend (`npm run dev`) start cleanly, communicating via a `/api/health` probe.
- **Testing & Verification**: Curl `http://localhost:8080/api/health` returns status `UP` with database connectivity verified.
- **Learning Checkpoint**: What is the purpose of the Vite server proxy when connecting to the Spring Boot backend?

---

### Phase 3: Database & Backend Fundamentals
- **Objectives**: Implement JPA entities, Spring Data repositories, DTO layer, validation, and standard CRUD APIs for complaints.
- **Prerequisites**: Phase 2 complete.
- **Implementation Tasks**:
  - Implement Java entities: `UserEntity`, `DepartmentEntity`, `ComplaintEntity`, `StatusLogEntity`.
  - Build Spring Data JPA Repositories with custom derived queries.
  - Implement DTOs: `CreateComplaintRequestDto`, `ComplaintResponseDto`, `ComplaintSummaryDto`.
  - Build `GlobalExceptionHandler` with standardized error responses (`ErrorResponseDto`).
  - Implement `ComplaintController` and `ComplaintService` for basic complaint creation and retrieval.
- **Files Created/Modified**: `backend/src/main/java/com/civicfix/entity/*`, `repository/*`, `service/*`, `controller/*`, `dto/*`, `exception/*`.
- **Concepts to Learn**: JPA Lifecycle, DTO pattern (why we never expose entities directly), Controller-Service-Repository pattern, Jakarta Bean Validation.
- **Acceptance Criteria**: Can create a complaint via `POST /api/complaints` and retrieve it via `GET /api/complaints/{id}` with validation errors returning HTTP 400.
- **Testing & Verification**: Unit tests with JUnit 5 & Mockito; Postman/curl requests verifying payload constraints.
- **Learning Checkpoint**: Why should an entity class never be returned directly in a REST controller response?

---

### Phase 4: UI Reference Analysis & Core Frontend Implementation
- **Objectives**: Inspect the supplied design reference, build common UI components, layout structures, and navigation.
- **Prerequisites**: Phase 3 complete and UI reference file provided.
- **Implementation Tasks**:
  - Perform visual audit of reference screens; map layouts and colors to Tailwind theme tokens.
  - Build shared layout components: `Navbar`, `Sidebar`, `PageHeader`, `Footer`.
  - Build design components: `StatusBadge`, `UrgencyPill`, `PriorityMeter`, `Card`, `Button`, `Modal`.
  - Build screen shells for Citizen, Administrator, and Worker portals with React Router.
  - Connect React query/axios service to backend complaint APIs.
- **Files Created/Modified**: `frontend/src/components/*`, `frontend/src/pages/*`, `frontend/src/services/api.ts`.
- **Concepts to Learn**: Atomic design pattern, TypeScript component typing (`React.FC<Props>`), CSS grid/flexbox responsiveness, state lifting.
- **Acceptance Criteria**: Frontend renders all screen shells matching the reference layout on desktop (1920px) and mobile (375px).
- **Testing & Verification**: Visual comparison against reference screens in browser viewport emulator.
- **Learning Checkpoint**: How does TypeScript interface typing for API responses protect the frontend from runtime errors?

---

### Phase 5: Authentication & Role-Based Access Control (RBAC)
- **Objectives**: Implement secure JWT authentication, password hashing, and role guards for Citizen, Admin, and Worker.
- **Prerequisites**: Phase 4 complete.
- **Implementation Tasks**:
  - Configure Spring Security with `BCryptPasswordEncoder` and `SecurityFilterChain`.
  - Implement `JwtTokenProvider` and `JwtAuthenticationFilter`.
  - Create `AuthController` endpoints: `POST /api/auth/login`, `POST /api/auth/register`.
  - Build frontend `AuthContext`, login page, and `ProtectedRoute` components enforcing role restrictions.
  - Build an easy "Quick Demo Switcher" button in the development UI.
- **Files Created/Modified**: `backend/src/main/java/com/civicfix/security/*`, `frontend/src/context/AuthContext.tsx`, `frontend/src/components/ProtectedRoute.tsx`.
- **Concepts to Learn**: Stateless authentication, JWT signing and claims, password hashing vs encryption, HTTP Authorization Bearer headers.
- **Acceptance Criteria**: Accessing `/admin/*` as a citizen redirects to an unauthorized page; backend rejects unauthorized API calls with 403 Forbidden.
- **Testing & Verification**: Automated tests with `@WithMockUser`; frontend login tests with each demo role.
- **Learning Checkpoint**: Where should JWT tokens be stored on the client, and what are the security trade-offs of localStorage vs HTTP-only cookies?

---

### Phase 6: Development Seed Data & Demo Scenarios
- **Objectives**: Construct a reproducible database seeder with realistic test cases covering all 5 categories, duplicate pairs, and SLA breaches.
- **Prerequisites**: Phase 5 complete.
- **Implementation Tasks**:
  - Implement `DbSeederService` running on `dev` profile.
  - Seed 6 demo users (1 Admin, 2 Citizens, 3 Workers) with documented passwords.
  - Seed 5 municipal departments.
  - Seed 30 realistic complaints with realistic coordinates (Bhubaneswar/Khandagiri area), duplicate groups, overdue timestamps, and proof photos.
  - Provide an administrative `POST /api/dev/reset-seed` endpoint (disabled in production).
- **Files Created/Modified**: `backend/src/main/java/com/civicfix/seed/*`, `DEMO_DATA.md`.
- **Concepts to Learn**: Database seeding vs migrations, test fixture isolation, synthetic data generation, spatial coordinate accuracy.
- **Acceptance Criteria**: Database can be wiped and re-seeded in under 5 seconds with all demo scenarios immediately demonstrable.
- **Testing & Verification**: Trigger seed reset and verify records in PostgreSQL via psql and REST GET endpoints.
- **Learning Checkpoint**: Why is it critical to keep seed data separate from production database migrations?

---

### Phase 7: Complaint Submission, Media Handling & Geocoding
- **Objectives**: Build the complete citizen reporting workflow with image upload, browser GPS capture, reverse geocoding, and vague description resolution.
- **Prerequisites**: Phase 6 complete.
- **Implementation Tasks**:
  - Implement multipart image upload service with file size and type validation (JPG/PNG $\le 5\text{ MB}$).
  - Implement frontend geolocation permission handler.
  - Integrate OSM Nominatim reverse geocoding service: Lat/Lng $\to$ auto-fills street, ward, city, and state.
  - Build vague landmark resolution service (keyword dictionary + bounding box fallback).
  - Implement citizen review screen before submission, assigning a formatted ID (`CFX-2026-XXXXX`).
- **Files Created/Modified**: `backend/src/main/java/com/civicfix/service/MediaStorageService.java`, `frontend/src/pages/ReportIssuePage.tsx`, `frontend/src/services/geocodingService.ts`.
- **Concepts to Learn**: Multipart form data handling, browser Geolocation API, asynchronous geocoding requests, defensive location confidence flags.
- **Acceptance Criteria**: Submitting a report with GPS auto-populates the address; submitting a vague description *"near ITER gate"* resolves coordinates and flags location confidence.
- **Testing & Verification**: Submit complaints with GPS, manual pin, and text-only landmark; verify database record attributes.
- **Learning Checkpoint**: How does the system ensure that a complaint with an uncertain location is not silently rejected?

---

### Phase 8: Gemini AI Integration (Multimodal & Voice)
- **Objectives**: Connect Google Gemini 1.5 Flash for image classification, severity suggestion, and regional speech transcription (Odia/Hindi/English).
- **Prerequisites**: Phase 7 complete.
- **Implementation Tasks**:
  - Build backend `GeminiService` calling Google Generative Language REST API with backend-secured API key.
  - Implement multimodal prompt: analyze complaint photo $\to$ return category, estimated severity, suggested title.
  - Implement audio processing prompt: transcribe Odia/Hindi voice note $\to$ translate to English + extract structured complaint fields.
  - Add fallback logic: if Gemini is unreachable, use deterministic keyword rules; never drop complaints.
- **Files Created/Modified**: `backend/src/main/java/com/civicfix/service/GeminiAiService.java`, `backend/src/main/java/com/civicfix/dto/ai/*`, `frontend/src/components/VoiceRecorderModal.tsx`.
- **Concepts to Learn**: Multimodal LLM prompting, JSON schema enforcement in LLM outputs, graceful degradation, streaming audio blobs.
- **Acceptance Criteria**: Uploading a pothole photo returns `ROAD_DAMAGE` with severity suggestion; recording Odia voice returns both Odia transcript and English translation.
- **Testing & Verification**: Mock API tests; live API calls with test images and audio clips.
- **Learning Checkpoint**: Why must the Gemini API key be stored exclusively on the Spring Boot backend?

---

### Phase 9: Location, Mapbox, Deduplication & True Heatmap
- **Objectives**: Implement PostGIS spatial distance calculations, semantic duplicate grouping, Mapbox GL JS cluster maps, and GPU-accelerated heatmap layers.
- **Prerequisites**: Phase 8 complete.
- **Implementation Tasks**:
  - Build `DuplicateRadarService`:
    - PostGIS spatial query: `ST_DWithin(location_geometry, ST_MakePoint(lon, lat), 150)`
    - Issue category exact match
    - Text similarity: Jaccard token set / Levenshtein distance $\ge 0.65$
  - Group detected duplicates under a Master Complaint; allow citizens to upvote rather than submit duplicates.
  - Build Mapbox frontend component:
    - GPU Heatmap layer (`type: 'heatmap'`) weighted by priority score ($0\text{--}15$)
    - Clustered marker layer with expand-on-click at zoom $\ge 14$
    - Category and status filters.
- **Files Created/Modified**: `backend/src/main/java/com/civicfix/service/DuplicateRadarService.java`, `frontend/src/components/TrueMapboxHeatmap.tsx`.
- **Concepts to Learn**: PostGIS spatial indexing (`GIST`), Haversine formula, Mapbox GL JS paint properties, spatial clustering algorithms.
- **Acceptance Criteria**: Submitting a report within 150m of an existing same-category issue flags a duplicate alert; heatmap displays continuous color gradient from blue to red based on actual complaint density.
- **Testing & Verification**: Submit two complaints at identical coordinates; verify duplicate grouping in DB; verify heatmap layer in browser inspector.
- **Learning Checkpoint**: What is the difference between rendering individual HTML circle markers and rendering a GPU-accelerated Mapbox heatmap layer?

---

### Phase 10: Priority Scoring Engine & SLA Escalation
- **Objectives**: Implement the transparent, deterministic 15-point priority scoring formula and automated SLA countdown/escalation tracker.
- **Prerequisites**: Phase 9 complete.
- **Implementation Tasks**:
  - Implement `PriorityCalculationService` implementing the exact formula:
    - Issue severity (0--5)
    - Public safety risk (0--4)
    - People affected (0--3)
    - Duration unresolved (0--2)
    - Community confirmations (0--1)
    - Total: 0--15 points
  - Map target deadlines: High (11--15 pts $\to$ 3 days), Moderate (6--10 pts $\to$ 5 days), Low (0--5 pts $\to$ 7 days).
  - Implement scheduled background task (`@Scheduled`) checking for SLA breaches and flagging `is_overdue = true`.
  - Build frontend `PriorityScoreBreakdownCard` displaying point-by-point explanation for both citizen and administrator.
- **Files Created/Modified**: `backend/src/main/java/com/civicfix/service/PriorityCalculationService.java`, `backend/src/main/java/com/civicfix/service/SlaEscalationScheduler.java`, `frontend/src/components/PriorityBreakdownCard.tsx`.
- **Concepts to Learn**: Deterministic business rule engines, Spring Task Scheduling (`@Scheduled`, `@EnableScheduling`), SLA state machines.
- **Acceptance Criteria**: Priority calculation matches the formula with 100% mathematical precision; overdue complaints highlight red with live countdown timer.
- **Testing & Verification**: Unit tests for all scoring permutations; advance test timestamps to trigger automated escalation flag.
- **Learning Checkpoint**: Why does PS-09 explicitly demand a deterministic priority score breakdown rather than an opaque LLM priority label?

---

### Phase 11: Department & Worker Management
- **Objectives**: Implement department routing suggestions, administrator manual overrides, and field worker task dispatch.
- **Prerequisites**: Phase 10 complete.
- **Implementation Tasks**:
  - Auto-map complaints to departments based on category (e.g., `ROAD_DAMAGE` $\to$ Road Maintenance).
  - Build Admin Assignment Panel: select department, filter available field workers, assign worker.
  - Implement assignment audit log (`status_logs` recording admin ID, previous worker, new worker, timestamp).
  - Build worker notification event (email or in-app task badge).
- **Files Created/Modified**: `backend/src/main/java/com/civicfix/service/DepartmentRoutingService.java`, `backend/src/main/java/com/civicfix/controller/AdminController.java`, `frontend/src/pages/admin/AssignmentModal.tsx`.
- **Concepts to Learn**: Role-based dispatch workflows, audit logging, relational foreign key updates within transactional boundaries (`@Transactional`).
- **Acceptance Criteria**: Admin can reassign a complaint to another department or worker; assignment history is fully preserved and visible.
- **Testing & Verification**: Assign worker in UI; verify database transaction and status log creation.
- **Learning Checkpoint**: Why must department reassignments be executed within an ACID database transaction?

---

### Phase 12: Worker Execution & Resolution Verification
- **Objectives**: Build the field worker task execution flow, proof upload, and the citizen 2-step verification and reopening loop.
- **Prerequisites**: Phase 11 complete.
- **Implementation Tasks**:
  - Build Worker Workspace: view assigned tickets, update status to `IN_PROGRESS`.
  - Build Worker Completion Flow: upload "After" repair photo and completion remarks $\to$ status moves to `AWAITING_VERIFICATION` (does NOT close complaint).
  - Run optional Gemini Before/After image check to suggest repair quality confidence.
  - Build Citizen Verification Screen: reporter can inspect before/after photos, click **Confirm Resolved** (moves to `VERIFIED_RESOLVED`) or **Dispute / Reopen** (reopens ticket and adds +2 urgency points).
- **Files Created/Modified**: `backend/src/main/java/com/civicfix/service/ResolutionVerificationService.java`, `frontend/src/pages/worker/WorkerDashboard.tsx`, `frontend/src/pages/citizen/VerificationModal.tsx`.
- **Concepts to Learn**: Multi-party closure state machines, visual verification workflows, dispute handling mechanisms.
- **Acceptance Criteria**: Uploading a completion photo moves status to `AWAITING_VERIFICATION`; only the citizen or admin can transition it to `VERIFIED_RESOLVED`. Disputing reopens the ticket.
- **Testing & Verification**: Execute complete worker upload $\to$ citizen dispute $\to$ worker re-fix $\to$ citizen confirmation.
- **Learning Checkpoint**: Why must worker photo upload NEVER automatically close a civic complaint?

---

### Phase 13: Administrator Analytics & Full Workflow Integration
- **Objectives**: Construct executive dashboard metrics, department performance tables, and public transparency portal.
- **Prerequisites**: Phase 12 complete.
- **Implementation Tasks**:
  - Implement backend analytics queries: complaints by category, average resolution time, overdue percentage per department.
  - Build Admin Analytics Dashboard with Chart.js / Recharts:
    - Category distribution pie chart
    - Department SLA compliance bar chart
    - Hotspot ward summary
  - Build Public Tracking Portal: unauthenticated search by Complaint ID (`CFX-...`) showing timeline, assigned department, and verification status without leaking citizen phone/email.
- **Files Created/Modified**: `backend/src/main/java/com/civicfix/service/AnalyticsService.java`, `frontend/src/pages/admin/AnalyticsDashboard.tsx`, `frontend/src/pages/public/PublicTrackerPage.tsx`.
- **Concepts to Learn**: SQL aggregation queries (`COUNT`, `AVG`, `GROUP BY`), analytical indexing, data masking for public privacy.
- **Acceptance Criteria**: Admin dashboard displays live metrics calculated from actual complaint rows; public tracker displays complaint timeline without requiring login.
- **Testing & Verification**: Compare SQL aggregation outputs directly with frontend dashboard numbers.
- **Learning Checkpoint**: Why must citizen personal information (phone number, email) be masked when displaying public complaint tracking?

---

### Phase 14: Testing, Security Hardening & Deployment
- **Objectives**: Comprehensive test coverage, upload sanitization, security review, Docker containerization, and final demo verification.
- **Prerequisites**: Phase 13 complete.
- **Implementation Tasks**:
  - Write integration tests using Spring Boot `@SpringBootTest` and MockMvc for all critical API endpoints.
  - Write frontend integration tests using Vitest and React Testing Library.
  - Audit security: SQL injection prevention, file upload mime-type verification, CORS configuration, JWT expiry.
  - Create production multi-stage `Dockerfile` and `docker-compose.prod.yml`.
  - Update all project documentation (`README.md`, `IMPLEMENTATION_LOG.md`, `KNOWN_ISSUES.md`).
- **Files Created/Modified**: `backend/src/test/*`, `frontend/src/test/*`, `Dockerfile`, `docker-compose.prod.yml`, `README.md`.
- **Concepts to Learn**: Multi-stage Docker builds, integration test mocking, CORS security, OWASP top 10 civic tech vulnerabilities.
- **Acceptance Criteria**: All automated tests pass (`mvn test`, `npm test`); `docker compose up` starts the entire system from scratch cleanly.
- **Testing & Verification**: Execute complete end-to-end demo script starting from login to report, duplicate detection, triage, worker fix, and citizen verification.
- **Learning Checkpoint**: What are the key differences between unit tests and integration tests in Spring Boot?

---

## 10. Technical Risks, Shortcomings & Mitigations

| Identified Risk / Pitfall | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Opaque AI Priority Calculation** | Violates core PS-09 constraint | Use a strict mathematical 15-point formula; AI only provides parameter suggestions with full formula breakdown displayed. |
| **Silent Dropping of Vague Complaints** | Violates core PS-09 constraint | When geocoding fails, save complaint with `location_confidence: LOW_VAGUE_TRIAGE` and route to admin manual triage queue. |
| **Mapbox Rate Limiting / Token Failure** | Breaks map and heatmap visualizer | Cache tile assets, configure fallback to standard OpenStreetMap raster tiles if Mapbox token is missing. |
| **401 Lockout on Public Tracking** | Frustrates citizens tracking reports | Implement dedicated unauthenticated public tracking endpoint `/api/public/complaints/{complaintId}` with masked citizen PII. |
| **Worker Upload Auto-Closing Issues** | Corrupts municipal accountability | Enforce two-stage verification state: `WORK_COMPLETED` $\to$ `AWAITING_VERIFICATION` $\to$ `VERIFIED_RESOLVED`. |

---

## 11. Scope Segmentation: MVP vs. Hackathon-Ready vs. Future Work

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. MINIMUM VIABLE PRODUCT (MVP) — (Phases 0 to 6)                           │
│ • Full relational schema (PostgreSQL + PostGIS)                             │
│ • Authentication & RBAC (Citizen, Admin, Worker)                            │
│ • 5 categories complaint CRUD & Seed Data                                   │
│ • Basic UI layout & navigation                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. HACKATHON-READY SYSTEM (PS-09 COMPLIANT) — (Phases 7 to 13)              │
│ • Multilingual voice intake (Odia, Hindi, English)                          │
│ • Gemini multimodal vision triage & audio translation                       │
│ • PostGIS duplicate radar & community upvoting                              │
│ • Transparent 15-point priority scoring breakdown                           │
│ • True Mapbox GPU heatmap & cluster map                                     │
│ • SLA countdown timers & automated escalation alerts                        │
│ • Worker proof upload & citizen 48h dispute/verification loop               │
│ • Public unauthenticated complaint tracker                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. FUTURE EXTENSIONS (Post-Hackathon)                                       │
│ • WhatsApp chatbot complaint submission                                     │
│ • IoT sensor integration for water pressure and bin levels                  │
│ • Citizen karma token rewards & civic perk marketplace                      │
│ • Municipal budget and contractor invoice reconciliation                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Phase Completion Template (For All Subsequent Phases)

Every phase will strictly culminate with this verification report:

```markdown
### Phase [X] Completion Report
- **Phase Name**: [Name]
- **Status**: COMPLETE / BLOCKED / IN_PROGRESS
- **Tasks Executed**: [Summary of completed tasks]
- **Files Created/Modified**: [Clickable file links]
- **Concepts Learned**: [Key technical concepts and architecture lessons]
- **Verification Commands Executed**:
  ```bash
  [Commands used to test the phase]
  ```
- **Acceptance Criteria Verification**:
  - [x] Criterion 1 verified (Result)
  - [x] Criterion 2 verified (Result)
- **Known Limitations / Unresolved Items**: [Any non-blocking caveats]
- **Next Phase Dependency**: [What Phase X+1 requires]
```
