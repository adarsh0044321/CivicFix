# CivicFix: Agreed Project Requirements (PS-09)

---

## 1. Project Overview & Scope
**CivicFix** is an AI-powered municipal grievance management system developed for hackathon Problem Statement **PS-09: Grievance triage, deduplication and accountability**.

The system enables citizens to report local civic infrastructure failures, leverages AI and deterministic algorithms for triage, deduplication, and explainable prioritization, routes complaints to municipal departments, tracks SLA resolution targets, and enforces proof-of-resolution verification before ticket closure.

---

## 2. Core Functional Requirements

### 2.1 The Five Mandated Issue Categories
CivicFix exclusively supports exactly five core sample categories across all intake, classification, routing, dashboards, heatmaps, and seed data:
1. `ROAD_DAMAGE`: Potholes, road craters, cave-ins, broken footpaths.
2. `GARBAGE_WASTE`: Overflowing waste vats, uncollected trash, illegal dumping.
3. `STREETLIGHT`: Broken streetlights, dark stretches, hanging/sparking electrical wires.
4. `DRAINAGE`: Clogged drains, sewage overflow, urban waterlogging.
5. `WATER_SUPPLY`: Potable water pipeline bursts, contamination, supply outages.

---

### 2.2 Roles and Access Boundaries
The system strictly enforces three distinct roles:
1. **Citizen**:
   - Register, login, and manage profile.
   - Submit complaints via text description, image upload, and regional voice input (Odia, Hindi, English).
   - Capture location via browser GPS or interactive map pin placement.
   - Review AI classification and priority preview prior to final submission.
   - Publicly track complaints using a unique Complaint ID (`CFX-YYYY-XXXXX`).
   - View nearby community reports and upvote/confirm existing issues instead of creating duplicates.
   - Inspect repair completion evidence (worker photos) and either verify closure or dispute/reopen.
2. **Administrator**:
   - Access municipal administration command center.
   - Review city-wide grievance queue, filter by category, status, ward, and urgency.
   - Inspect AI classification confidence and deterministic priority score breakdowns.
   - Assign complaints to municipal departments and dispatch individual field workers.
   - Override categories, departments, or priority with recorded justification.
   - Monitor real-time SLA countdown timers and manage overdue complaints.
   - Explore GPU-accelerated Mapbox density heatmaps and cluster maps.
   - Review duplicate clusters and manage parent-child ticket linkages.
3. **Repair / Maintenance Worker**:
   - Access dedicated mobile-responsive worker workspace.
   - View list of assigned repair tickets with locations, descriptions, and citizen notes.
   - Transition ticket state: `ASSIGNED` $\to$ `IN_PROGRESS` $\to$ `WORK_COMPLETED`.
   - Upload mandatory post-repair completion photographs and completion notes.
   - View historical completed assignments.

---

### 2.3 Core Constraint: Anti-Silent-Rejection & Transparent Priority
1. **No Silent Rejection**:
   - Complaints with vague location descriptions (e.g. *"behind college water tank"*) or low AI confidence must **never** be rejected or dropped.
   - They must be accepted, marked with `location_confidence: LOW_VAGUE_TRIAGE`, and routed to an administrative review queue.
2. **Transparent Priority Scoring (15 Points)**:
   - Priority is computed deterministically, never via an opaque black-box response.
   - **Formula**:
     $$\text{Priority Score} = \text{Severity (0-5)} + \text{Public Safety (0-4)} + \text{People Affected (0-3)} + \text{Duration (0-2)} + \text{Confirmations (0-1)}$$
   - **Target Resolution SLA**:
     - **High Urgency (11--15 points)**: 3 days (72 hours).
     - **Moderate Urgency (6--10 points)**: 5 days (120 hours).
     - **Low Urgency (0--5 points)**: 7 days (168 hours).

---

### 2.4 Resolution Verification Requirement
- Worker uploading a completion photograph **does NOT** close a ticket.
- Upload transitions state to `AWAITING_VERIFICATION`.
- The reporting citizen or administrator must inspect the evidence:
  - **Confirm Resolved**: Ticket moves to `VERIFIED_RESOLVED`.
  - **Dispute / Reopen**: Ticket re-opens with $+2$ escalation points and returns to the department.

---

## 3. Non-Functional Requirements
- **Performance**: API responses under $300\text{ ms}$; Mapbox heatmap renders smoothly up to 5,000 points.
- **Security**: Passwords hashed with BCrypt; stateless JWT authentication; secret API keys (Gemini) stored exclusively in backend configuration.
- **Data Privacy**: Citizen phone numbers and email addresses masked on public tracking pages.
- **Responsiveness**: Interfaces fully responsive across mobile (375px) and desktop (1920px).
