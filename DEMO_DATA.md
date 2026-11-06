# CivicFix: Development Seed Data & Demo Accounts Specification

---

## 1. Controlled Development Accounts

All demo accounts use the standard test domain `@civicfix.internal`. These credentials are strictly active under the Spring Boot `dev` profile.

| Role | Email | Development Password | Display Name | Assigned Department |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin@civicfix.internal` | `AdminDemo#2026` | Municipal Admin Officer | Central Grievance Cell |
| **Citizen (Primary)** | `citizen.priya@civicfix.internal` | `CitizenDemo#2026` | Priya Mohapatra | N/A (Resident, Ward 23) |
| **Citizen (Secondary)**| `citizen.rahul@civicfix.internal` | `CitizenDemo#2026` | Rahul Verma | N/A (Resident, Ward 14) |
| **Worker (Roads)** | `worker.bikram@civicfix.internal` | `WorkerDemo#2026` | Bikram Rout | Road Maintenance Department |
| **Worker (Electricity)**| `worker.suresh@civicfix.internal` | `WorkerDemo#2026` | Suresh Jena | Streetlight & Electricity Department |
| **Worker (Sanitation)**| `worker.arun@civicfix.internal` | `WorkerDemo#2026` | Arun Naik | Sanitation & Waste Management |

---

## 2. Seed Departments

| Department Name | Code | Default SLA Hours | Contact Email |
| :--- | :--- | :---: | :--- |
| **Road Maintenance Department** | `ROAD_MAINTENANCE` | 72h (3 days) | `roads@civicfix.internal` |
| **Sanitation & Waste Management**| `SANITATION_WASTE` | 48h (2 days) | `sanitation@civicfix.internal` |
| **Streetlight & Electricity Dept**| `ELECTRICITY_LIGHT` | 24h (1 day) | `electric@civicfix.internal` |
| **Drainage & Sewerage Department**| `DRAINAGE_SEWER` | 48h (2 days) | `drainage@civicfix.internal` |
| **Water Supply Works** | `WATER_SUPPLY` | 24h (1 day) | `water@civicfix.internal` |

---

## 3. Seed Demonstration Scenarios (30 Controlled Records)

The seed data models a real municipal ecosystem centered in Bhubaneswar, Odisha (around ITER, Jagmohan Nagar, Khandagiri, Master Canteen, and Baramunda).

### Highlight Demo Scenarios

#### Scenario A: Intelligent Duplicate Grouping (`DUP-ROAD-001`)
- **Complaint 1 (Master)**: `CFX-2026-10001`
  - *Title*: "Severe road crater outside ITER Main Gate"
  - *Coordinates*: `[85.79581, 20.25052]`
  - *Status*: `IN_PROGRESS`
  - *Upvotes*: 3
- **Complaint 2 (Child Duplicate)**: `CFX-2026-10002`
  - *Title*: "Big hole on road near ITER entrance"
  - *Coordinates*: `[85.79595, 20.25068]` (18 meters apart)
  - *Status*: `SUBMITTED` (Linked to `CFX-2026-10001` as duplicate)
- **Reviewer Demo**: Submitting a third complaint near ITER triggers the **Duplicate Radar**, prompting the user to upvote rather than create a third ticket.

#### Scenario B: Automated SLA Breach & Escalation
- **Complaint**: `CFX-2026-10005`
  - *Title*: "Major storm drain clogged causing waterlogging near Master Canteen underpass"
  - *Category*: `DRAINAGE`
  - *Priority Score*: 14/15 (`HIGH`)
  - *Reported*: 4 days ago (SLA deadline was 3 days)
  - *Status*: `ASSIGNED`, `is_overdue = true`
- **Reviewer Demo**: Highlighted in bold red on the Admin Dashboard with a blinking **"OVERDUE - Escalated to Zonal Commissioner"** alert.

#### Scenario C: Vague Landmark Description (Anti-Silent Rejection)
- **Complaint**: `CFX-2026-10008`
  - *Title*: "Garbage dumped behind college water tank"
  - *Description*: "People dumping plastic waste behind the back gate near the old overhead tank."
  - *Coordinates*: Approximate centroid of Khandagiri ward (`location_confidence: LOW_VAGUE_TRIAGE`)
  - *Status*: `SUBMITTED`
- **Reviewer Demo**: Shows that CivicFix accepted the complaint despite missing GPS coordinates, tagging it for administrator review.

#### Scenario D: Proof of Resolution & Citizen Verification
- **Complaint**: `CFX-2026-10006`
  - *Title*: "Drinking water main pipeline burst on Baramunda Overbridge"
  - *Category*: `WATER_SUPPLY`
  - *Status*: `AWAITING_VERIFICATION`
  - *Proof Uploaded*: Before photo (water gushing) + After photo (repaired coupling sleeve)
- **Reviewer Demo**: Citizen logs in as Priya, views before-and-after photographs side-by-side, and clicks **"Confirm Resolved"** (or tests the **"Dispute / Reopen"** flow).

---

## 4. Seed Data Reset Mechanism

Under the `dev` Spring profile:
```http
POST /api/v1/dev/seed-reset
Authorization: Bearer <ADMIN_JWT_TOKEN>
```
This triggers a transactional truncate and re-populates all 6 demo accounts and 30 demonstration complaints in less than 3 seconds. It is completely disabled when `spring.profiles.active=prod`.
