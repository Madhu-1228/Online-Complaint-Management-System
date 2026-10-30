# CivicCare - Online Complaint Management System
> **B.Tech IT Capstone Project**  
> Modern Full-Stack Public Grievance Redressal & Civic Infrastructure Management System

---

## 🏛️ Project Overview

**CivicCare** is a modern, production-grade full-stack web application designed for municipal corporations and smart cities. It bridges the communication gap between citizens and local government bodies, providing end-to-end transparency, automated SLA escalation, verifiable status timelines, department assignment, and citizen satisfaction (CSAT) feedback.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Axios, Vanilla CSS (Modern Light Theme SaaS Design System) |
| **Backend** | Java 22, Spring Boot 4.1.2, Spring Security 7, Spring Data MongoDB, JJWT 0.12.6 |
| **Database** | MongoDB (Local service / Compass / Atlas compatible) |
| **Authentication** | Stateless JWT (JSON Web Token) with Role-Based Access Control (`ROLE_USER`, `ROLE_ADMIN`) |
| **Architecture** | RESTful Micro-Controller APIs, Repository Pattern, Real-Time Polling Notifications |

---

## 🚀 Key Features

### 1. Citizen Interface
- **Public & Authenticated Lodging**: File grievances with title, department category, priority, exact location, and description.
- **Photo Evidence Attachment**: Attach on-site photographs with instant thumbnail preview (stored with record metadata).
- **Unique Reference ID**: Auto-generates cryptographically distinct tracking numbers (e.g., `CMP-2026-XXXXXXXX`).
- **Live Status Timeline Stepper**: Full audit history with timestamps, department milestone remarks, and assigned officers.
- **In-App Notification Center**: Real-time bell badge alerting citizens when cases are assigned, escalated, or resolved.
- **Citizen Satisfaction (CSAT) & Reopening**:
  - Rate completed works on a 1–5 star scale with written feedback.
  - Reopen grievances under the Right to Public Service if the underlying issue remains unresolved.

### 2. Administrator Command Center
- **Operational Grievance Board**: Search, sort, and filter across departments, priorities, and statuses.
- **Department Assignment**: Route complaints to divisions (Water Supply, Roads & Highway, Electricity, Sanitation, Drainage, Public Safety) and assign designated field engineers.
- **SLA Deadline & Automated Escalation**: Automatic deadline computation (Urgent = 24h, High = 48h, Medium = 72h, Low = 5 days). Automatically flags overdue cases as `ESCALATED`.
- **Real-Time Analytics & Charts**: Live CSS bar charts of department workload distribution, CSAT satisfaction scores, and resolution turnaround times.
- **Executive CSV Export**: Export compliance reports in CSV format with a single click.

---

## 📂 Project Structure

```text
Online Complaint management system/
│
├── backend/
│   ├── src/main/java/compliant_api/
│   │   ├── ComplaintApiApplication.java    # Spring Boot Main Entry Point
│   │   ├── Complaint.java                 # MongoDB Document Model
│   │   ├── ComplaintRepository.java       # MongoRepository Data Access
│   │   ├── ComplaintController.java       # Grievance REST Endpoints & Analytics
│   │   ├── User.java                      # User Entity Model
│   │   ├── UserRepository.java            # User MongoDB Repository
│   │   ├── AuthController.java            # Registration, Login & Demo Seeder
│   │   ├── Notification.java              # In-App Notification Entity
│   │   ├── NotificationRepository.java    # Notification MongoDB Repository
│   │   ├── NotificationController.java    # Notification Endpoints
│   │   ├── StatusHistoryItem.java         # Milestone History Item
│   │   ├── SecurityConfig.java            # Spring Security 7 & CORS Configuration
│   │   ├── JwtService.java                # Token Generation & Verification
│   │   └── JwtAuthFilter.java             # Bearer Token Filter
│   ├── src/main/resources/
│   │   └── application.properties         # Server port (8081), MongoDB URI, JWT Secrets
│   ├── pom.xml                            # Maven Build Configuration
│   └── mvnw.cmd                           # Maven Wrapper for Windows
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx                 # Top Navigation, Status Pill, Notification Bell
│   │   │   ├── Home.jsx                   # Modern SaaS Hero, Live Metrics, Workflows
│   │   │   ├── SubmitComplaint.jsx        # Grievance Form & Evidence Photo Upload
│   │   │   ├── TrackComplaint.jsx         # Live Timeline, CSAT Rating & Reopen Modal
│   │   │   ├── MyComplaints.jsx           # Citizen Dashboard & Status Filter Tabs
│   │   │   ├── AdminPortal.jsx            # Operational Command Center, Assignments & Charts
│   │   │   └── AuthModal.jsx              # Modal Login / Register with 1-Click Demo Logins
│   │   ├── services/
│   │   │   └── api.js                     # Centralized Axios Client & Interceptors
│   │   ├── App.jsx                        # State Coordinator & Page Router
│   │   ├── App.css                        # Light Theme Stylesheet & Dashboard Layout
│   │   └── index.css                      # Design Tokens, Palette & Animations
│   ├── package.json                       # React 19, Vite 8, Axios
│   └── vite.config.js                     # Vite Configuration
│
└── README.md                              # Complete System Documentation
```

---

## ⚙️ Prerequisites & Setup

Ensure the following tools are installed on your Windows machine:
- **Java JDK 21 or 22** (`java -version`)
- **Node.js v20+** and **npm** (`node -v`, `npm -v`)
- **MongoDB Server** (Installed as a Windows service on port 27017)

---

## 🏃 Running the Application

### 1. Verify MongoDB Server
In Windows PowerShell:
```powershell
# Verify MongoDB service status
Get-Service MongoDB

# If stopped, start the service:
Start-Service MongoDB

# Test connectivity via MongoDB Shell:
mongosh complaint_management_db --eval "db.adminCommand('ping')"
```

### 2. Start the Spring Boot Backend
Open a PowerShell terminal in the `backend/` directory:
```powershell
cd "backend"
.\mvnw.cmd spring-boot:run
```
> **Backend runs on**: `http://localhost:8081`  
> Health diagnostic URL: `http://localhost:8081/api/complaints/debug/database`

### 3. Start the React + Vite Frontend
Open a second PowerShell terminal in the `frontend/` directory:
```powershell
cd "frontend"
npm run dev
```
> **Frontend runs on**: `http://localhost:5173`

---

## 🔑 Demo Credentials (For Evaluation & Interviews)

For immediate testing, use the **One-Click Demo Buttons** on the Sign-In modal:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **👑 Platform Super Admin** | `superadmin@civiccare.com` | `admin123` | Platform-wide tenant governance, onboarding institutions, tenant status activation/suspension |
| **🏛️ Municipal Org Admin** | `admin@civiccare.com` | `admin123` | Municipal operational queue, department assignment, dynamic category configurator, CSV export |
| **🎓 College Org Admin** | `collegeadmin@apex.edu` | `admin123` | Campus grievances (Hostel, Wi-Fi, Labs), student department triage, SLA compliance tracking |
| **🛠️ Staff Field Officer** | `officer@civiccare.com` | `admin123` | Department-assigned tasks, status progress milestones, field inspection remarks |
| **👤 Citizen / Student User** | `devan@example.com` | `password123` | Multi-tenant grievance lodging, photo evidence upload, timeline tracking, CSAT rating & reopening |

---

## 🔒 Security & Architecture Highlights

1. **Spring Security 7 Integration**: Stateless `SessionCreationPolicy.STATELESS` with JWT bearer authentication.
2. **Strict Multi-Tenant Isolation**: Enforces tenant boundaries via `organizationId` matching in controller and repository layers.
3. **Dynamic Domain Configurator**: Runtime configuration of categories, default priorities, SLA thresholds, and departments per organization.
4. **Auditable Timeline Engine**: Immutable `StatusHistoryItem` records tracking every status transition with actor details and timestamps.
5. **Automated SLA Escalation**: Calculates target resolution dates based on category rules; automatically flags overdue and reopened cases as `ESCALATED`.
6. **In-App Notification Hub**: Real-time polling alert center notifying citizens of assignments, progress milestones, and resolutions.
7. **Zero Data Loss Guarantee**: Preserved all legacy database collections (`users`, `complaints`, `organizations`, `notifications`) in `complaint_management_db`.

---

## 🎓 Placement Viva & Interview Talking Points

1. **Why MongoDB over relational SQL for this architecture?**
   - Multi-tenant complaints feature semi-structured data: dynamic category definitions, embedded vertical status history timelines (`List<StatusHistoryItem>`), and flexible attachments. Document modeling stores the full grievance lifecycle in a single cohesive document, eliminating expensive multi-table JOINs while maintaining ACID guarantees at the document level.
2. **How is Tenant Isolation enforced?**
   - Every complaint record carries an immutable `organizationId`. All controller queries retrieve the caller's JWT claims. For Org Admins and Officers, the repository query `findByOrganizationId` guarantees that queries can never cross tenant boundaries.
3. **How does SLA calculation and escalation work?**
   - Rather than hardcoding deadlines, SLA duration is configured per category. On submission, Spring Boot computes `targetResolutionDate = now + slaHours`. When grievances exceed this timestamp or when citizens dispute a resolution by reopening, the system marks `isEscalated = true` and generates priority notification alerts.
4. **Why Stateless JWT over Session Cookies?**
   - Stateless JWT tokens scale horizontally across backend instances without server-side session synchronization. Role, organization ID, and department are cryptographically signed in the JWT payload, allowing immediate authorization checks on every incoming request without hitting the database for session lookups.
