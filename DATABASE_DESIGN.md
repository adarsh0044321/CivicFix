# CivicFix: Database Design & Schema Specifications

---

## 1. Relational & Geospatial Schema Architecture

CivicFix uses **PostgreSQL 16** with the **PostGIS** extension to enable spatial queries, geometric indexing, and relational integrity.

```
┌──────────────────┐               1:N               ┌───────────────────────┐
│      users       ├────────────────────────────────►│      complaints       │
│  (Role-based)    │ (reported_by / assigned_worker) │     (Core Entity)     │
└────────┬─────────┘                                 └───────────┬───────────┘
         │                                                       │
         │ 1:N                                                   │ 1:N
         ▼                                                       ▼
┌──────────────────┐                                 ┌───────────────────────┐
│   departments    │                                 │      status_logs      │
│   (5 sample)     │                                 │ (Immutable Audit Log) │
└──────────────────┘                                 └───────────┬───────────┘
                                                                 │
                                                                 │ 1:1
                                                                 ▼
                                                     ┌───────────────────────┐
                                                     │   resolution_proofs   │
                                                     │ (Worker Fix Evidence) │
                                                     └───────────────────────┘
```

---

## 2. PostgreSQL & PostGIS DDL Specification

```sql
-- 1. Enable PostGIS extension for geospatial types and functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Enumerations
CREATE TYPE user_role AS ENUM ('CITIZEN', 'ADMIN', 'WORKER');

CREATE TYPE complaint_category AS ENUM (
    'ROAD_DAMAGE',
    'GARBAGE_WASTE',
    'STREETLIGHT',
    'DRAINAGE',
    'WATER_SUPPLY'
);

CREATE TYPE complaint_status AS ENUM (
    'SUBMITTED',
    'ASSIGNED',
    'IN_PROGRESS',
    'WORK_COMPLETED',
    'AWAITING_VERIFICATION',
    'VERIFIED_RESOLVED',
    'REOPENED_DISPUTED'
);

CREATE TYPE urgency_level AS ENUM ('LOW', 'MODERATE', 'HIGH');

CREATE TYPE location_confidence AS ENUM (
    'HIGH_EXACT_GPS',
    'LANDMARK_RESOLVED',
    'LOW_VAGUE_TRIAGE'
);

-- 3. Departments Table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    contact_email VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'CITIZEN',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Complaints Table (Core Entity)
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id VARCHAR(32) UNIQUE NOT NULL, -- e.g., CFX-2026-10001
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category complaint_category NOT NULL,
    status complaint_status NOT NULL DEFAULT 'SUBMITTED',
    urgency urgency_level NOT NULL DEFAULT 'MODERATE',
    
    -- Priority calculation (0 to 15 points)
    priority_score INT NOT NULL DEFAULT 5 CHECK (priority_score >= 0 AND priority_score <= 15),
    priority_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    priority_override_reason TEXT,
    
    -- Geospatial Fields
    location_geometry GEOMETRY(Point, 4326), -- PostGIS Spatial Point (SRID 4326: WGS 84)
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    address_text VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Bhubaneswar',
    ward VARCHAR(50),
    location_confidence location_confidence NOT NULL DEFAULT 'HIGH_EXACT_GPS',
    
    -- Media & Regional Input
    image_url VARCHAR(500),
    audio_url VARCHAR(500),
    original_language_text TEXT,
    detected_language VARCHAR(30),
    
    -- Community & SLA
    upvote_count INT NOT NULL DEFAULT 0,
    sla_hours INT NOT NULL DEFAULT 120,
    sla_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    is_overdue BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Deduplication
    is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    parent_complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
    duplicate_group_id VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Status & Assignment Audit Log
CREATE TABLE status_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    changed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    from_status complaint_status,
    to_status complaint_status NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Resolution Proof Table
CREATE TABLE resolution_proofs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID UNIQUE NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    before_image_url VARCHAR(500),
    after_image_url VARCHAR(500) NOT NULL,
    worker_notes TEXT,
    ai_verification_score INT CHECK (ai_verification_score >= 0 AND ai_verification_score <= 100),
    ai_verification_notes TEXT,
    citizen_feedback TEXT,
    citizen_rating INT CHECK (citizen_rating >= 1 AND citizen_rating <= 5),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE
);

-- 8. Spatial and Query Optimization Indexes
CREATE INDEX idx_complaints_geom ON complaints USING GIST (location_geometry);
CREATE INDEX idx_complaints_status ON complaints (status);
CREATE INDEX idx_complaints_category ON complaints (category);
CREATE INDEX idx_complaints_priority ON complaints (priority_score DESC);
CREATE INDEX idx_complaints_reporter ON complaints (reporter_id);
CREATE INDEX idx_complaints_worker ON complaints (assigned_worker_id);
CREATE INDEX idx_complaints_sla_deadline ON complaints (sla_deadline) WHERE is_overdue = FALSE;
CREATE INDEX idx_status_logs_complaint ON status_logs (complaint_id);
```

---

## 3. Spatial Queries with PostGIS

### Finding Potential Duplicates within 150m Radius
Using PostGIS spatial indexing (`GIST`), we query candidates instantly without table-scanning:

```sql
SELECT 
    id, complaint_id, title, category, status,
    ST_Distance(
        location_geometry::geography, 
        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
    ) AS distance_meters
FROM complaints
WHERE 
    category = :category
    AND status NOT IN ('VERIFIED_RESOLVED')
    AND ST_DWithin(
        location_geometry::geography, 
        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, 
        150 -- 150 meter search radius
    )
ORDER BY distance_meters ASC;
```

---

## 4. Complaint Lifecycle State Machine

```
   [Citizen Submits]
          │
          ▼
     SUBMITTED ────────(Admin routes to dept)────────► ASSIGNED
          │                                                │
          │                                                ▼
          │                                           IN_PROGRESS
          │                                                │
          │                                      (Worker finishes work)
          │                                                │
          │                                                ▼
          │                                         WORK_COMPLETED
          │                                                │
          │                                  (Uploads after-photo proof)
          │                                                │
          │                                                ▼
          └───────────────────────────────────► AWAITING_VERIFICATION
                                                       │
                                      ┌────────────────┴────────────────┐
                                      │                                 │
                            (Citizen confirms)                  (Citizen disputes)
                                      │                                 │
                                      ▼                                 ▼
                              VERIFIED_RESOLVED                 REOPENED_DISPUTED
                              (Permanent Close)                 (Priority +2, Re-route)
```

| State | Allowed Transitions To | Trigger / Actor |
| :--- | :--- | :--- |
| `SUBMITTED` | `ASSIGNED`, `AWAITING_VERIFICATION` | Admin routes ticket, or auto-assigned by category |
| `ASSIGNED` | `IN_PROGRESS`, `ASSIGNED` (reassigned) | Worker accepts job / Admin reassigns |
| `IN_PROGRESS` | `WORK_COMPLETED` | Worker completes physical maintenance |
| `WORK_COMPLETED`| `AWAITING_VERIFICATION` | Worker uploads post-repair photograph |
| `AWAITING_VERIFICATION` | `VERIFIED_RESOLVED`, `REOPENED_DISPUTED` | Citizen approves fix OR disputes ongoing issue |
| `REOPENED_DISPUTED` | `ASSIGNED`, `IN_PROGRESS` | Admin re-dispatches worker with elevated urgency |
| `VERIFIED_RESOLVED`| *(Terminal State)* | Ticket closed; karma points recorded |
