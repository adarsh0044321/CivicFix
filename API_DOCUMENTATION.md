# CivicFix: REST API Specifications & Contracts

---

## 1. Global Conventions & Standards

- **Base URL**: `/api/v1`
- **Content Type**: `application/json` (except multipart uploads: `multipart/form-data`)
- **Authentication**: `Authorization: Bearer <JWT_TOKEN>`
- **Standard Error Response Format**:
  ```json
  {
    "success": false,
    "timestamp": "2026-11-05T03:30:00Z",
    "status": 400,
    "error": "BAD_REQUEST",
    "message": "Title must be between 5 and 200 characters",
    "fieldErrors": [
      { "field": "title", "rejectedValue": "bad", "message": "Length too short" }
    ]
  }
  ```

---

## 2. Authentication Endpoints

### 2.1 Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "citizen.priya@civicfix.internal",
    "password": "CitizenDemo#2026"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "c1f7a28e-4a6b-4e6f-9988-123456789abc",
      "email": "citizen.priya@civicfix.internal",
      "fullName": "Priya Mohapatra",
      "role": "CITIZEN",
      "departmentId": null
    }
  }
  ```

---

## 3. Complaint Management Endpoints

### 3.1 Submit Complaint
- **Endpoint**: `POST /api/v1/complaints`
- **Access**: Citizen, Admin
- **Request Body**:
  ```json
  {
    "title": "Severe road crater outside ITER Main Gate",
    "description": "Deep pothole right after turning towards Jagmohan Nagar. Two bike skids happened this morning.",
    "category": "ROAD_DAMAGE",
    "imageUrl": "https://storage.civicfix.internal/images/pothole-101.jpg",
    "latitude": 20.25052,
    "longitude": 85.79581,
    "addressText": "ITER Main Gate, Jagmohan Nagar, Khandagiri",
    "city": "Bhubaneswar",
    "ward": "Ward 23",
    "locationConfidence": "HIGH_EXACT_GPS",
    "originalLanguageText": "ଆଇଟିଇଆର ମୁଖ୍ୟ ଫାଟକ ନିକଟରେ ରାସ୍ତାରେ ଏକ ବଡ଼ ଖାଲ ଅଛି...",
    "detectedLanguage": "Odia"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "complaint": {
      "id": "e4b2a19f-3c5d-4f8a-a1b2-c3d4e5f6a7b8",
      "complaintId": "CFX-2026-10001",
      "status": "SUBMITTED",
      "category": "ROAD_DAMAGE",
      "urgency": "HIGH",
      "priorityScore": 13,
      "priorityBreakdown": {
        "severity": 4,
        "publicSafety": 4,
        "peopleAffected": 3,
        "durationUnresolved": 1,
        "communityConfirmations": 1,
        "total": 13
      },
      "slaHours": 72,
      "slaDeadline": "2026-11-08T03:30:00Z",
      "duplicateDetected": false,
      "createdAt": "2026-11-05T03:30:00Z"
    }
  }
  ```

### 3.2 Public Complaint Tracking (Unauthenticated)
- **Endpoint**: `GET /api/v1/public/complaints/{complaintId}`
- **Access**: Public
- **Description**: Allows anyone with a Complaint ID (`CFX-2026-10001`) to track resolution status, SLA countdown, and departmental timeline without logging in. Masking hides citizen PII.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "complaint": {
      "complaintId": "CFX-2026-10001",
      "title": "Severe road crater outside ITER Main Gate",
      "category": "ROAD_DAMAGE",
      "status": "IN_PROGRESS",
      "urgency": "HIGH",
      "department": "Road Maintenance Department",
      "assignedWorker": "Bikram Rout (Field Team)",
      "address": "ITER Main Gate, Jagmohan Nagar, Khandagiri",
      "reportedAt": "2026-11-05T03:30:00Z",
      "slaDeadline": "2026-11-08T03:30:00Z",
      "hoursRemaining": 68,
      "isOverdue": false,
      "timeline": [
        { "status": "SUBMITTED", "timestamp": "2026-11-05T03:30:00Z", "remarks": "Issue lodged by citizen" },
        { "status": "ASSIGNED", "timestamp": "2026-11-05T04:15:00Z", "remarks": "Assigned to Road Maintenance" },
        { "status": "IN_PROGRESS", "timestamp": "2026-11-05T06:00:00Z", "remarks": "Field worker on site" }
      ]
    }
  }
  ```

### 3.3 Community Upvote / Confirmation
- **Endpoint**: `POST /api/v1/complaints/{id}/upvote`
- **Access**: Citizen
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "complaintId": "CFX-2026-10001",
    "newUpvoteCount": 4,
    "updatedPriorityScore": 14,
    "message": "Community confirmation registered. Priority increased."
  }
  ```

---

## 4. Administrator Operations

### 4.1 Department & Worker Assignment
- **Endpoint**: `PUT /api/v1/admin/complaints/{id}/assign`
- **Access**: Admin
- **Request Body**:
  ```json
  {
    "departmentId": "d3b1a8e4-1c2d-4f5a-9a8b-123456789abc",
    "workerId": "w8e2b1a9-3c4d-4f5e-a1b2-987654321cba",
    "remarks": "Priority crater dispatched to primary road maintenance squad."
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "complaintId": "CFX-2026-10001",
    "status": "ASSIGNED",
    "assignedWorker": "Bikram Rout",
    "department": "Road Maintenance Department"
  }
  ```

### 4.2 Manual Category & Priority Override
- **Endpoint**: `PUT /api/v1/admin/complaints/{id}/override`
- **Access**: Admin
- **Request Body**:
  ```json
  {
    "category": "ROAD_DAMAGE",
    "priorityScore": 15,
    "urgency": "HIGH",
    "overrideReason": "Vip convoy and school bus route passing this location."
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Priority override recorded in official audit log."
  }
  ```

---

## 5. Worker Field Operations

### 5.1 Get Assigned Tasks
- **Endpoint**: `GET /api/v1/worker/tasks`
- **Access**: Worker
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "tasks": [
      {
        "id": "e4b2a19f-3c5d-4f8a-a1b2-c3d4e5f6a7b8",
        "complaintId": "CFX-2026-10001",
        "title": "Severe road crater outside ITER Main Gate",
        "status": "ASSIGNED",
        "urgency": "HIGH",
        "slaDeadline": "2026-11-08T03:30:00Z",
        "address": "ITER Main Gate, Jagmohan Nagar, Khandagiri",
        "latitude": 20.25052,
        "longitude": 85.79581,
        "imageUrl": "https://storage.civicfix.internal/images/pothole-101.jpg"
      }
    ]
  }
  ```

### 5.2 Upload Completion Evidence
- **Endpoint**: `POST /api/v1/worker/tasks/{id}/proof`
- **Access**: Worker
- **Request Body (Multipart or JSON with image URL)**:
  ```json
  {
    "afterImageUrl": "https://storage.civicfix.internal/proof/fix-10001.jpg",
    "workerNotes": "Pothole filled with cold mix asphalt and steam rolled. Surface leveled."
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "complaintId": "CFX-2026-10001",
    "status": "AWAITING_VERIFICATION",
    "message": "Proof uploaded. Ticket transitioned to Awaiting Citizen Verification."
  }
  ```

---

## 6. Citizen Verification & Closure Loop

### 6.1 Confirm Resolution (Approve Closure)
- **Endpoint**: `POST /api/v1/citizen/complaints/{id}/verify`
- **Access**: Citizen (Reporter) or Admin
- **Request Body**:
  ```json
  {
    "action": "CONFIRM_RESOLVED",
    "rating": 5,
    "feedback": "Repaired cleanly within 24 hours. Excellent work by road team."
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": "VERIFIED_RESOLVED",
    "message": "Complaint closed permanently with citizen verification."
  }
  ```

### 6.2 Dispute Resolution (Reopen Ticket)
- **Endpoint**: `POST /api/v1/citizen/complaints/{id}/dispute`
- **Access**: Citizen (Reporter) or Admin
- **Request Body**:
  ```json
  {
    "action": "DISPUTE_PERSISTS",
    "feedback": "Asphalt washed away with morning rain; deep depression still remains."
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": "REOPENED_DISPUTED",
    "newPriorityScore": 15,
    "message": "Complaint reopened with escalated urgency."
  }
  ```

---

## 7. Geospatial & Public Heatmap

### 7.1 Public GeoJSON Heatmap Feed
- **Endpoint**: `GET /api/v1/public/heatmap`
- **Access**: Public
- **Query Params**: `?category=ROAD_DAMAGE&ward=Ward 23&status=OPEN`
- **Success Response (200 OK - GeoJSON FeatureCollection)**:
  ```json
  {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [85.79581, 20.25052]
        },
        "properties": {
          "complaintId": "CFX-2026-10001",
          "title": "Severe road crater outside ITER Main Gate",
          "category": "ROAD_DAMAGE",
          "urgency": "HIGH",
          "priorityScore": 13,
          "status": "IN_PROGRESS",
          "department": "Road Maintenance"
        }
      }
    ]
  }
  ```
