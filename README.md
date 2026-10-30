# 🏛️ CivicCare – Online Complaint Management System

> **B.Tech IT Capstone Project**  
> A Modern Full-Stack Public Grievance Redressal & Civic Infrastructure Management Platform.

CivicCare is a modern, full-stack web application designed to digitize and streamline public grievance management for municipal corporations, educational institutions, and other organizations.

The platform bridges the communication gap between citizens and administrators by providing a centralized system for complaint registration, department assignment, status tracking, automated SLA escalation, notifications, and citizen satisfaction feedback.

With a multi-tenant architecture and role-based access control, CivicCare ensures transparent complaint handling, accountability, and efficient grievance resolution.

---

## ✨ Key Features

### 👤 1. Citizen Portal

- **Citizen Registration & Authentication:** Secure registration and login.
- **Complaint Registration:** Submit complaints with title, description, category, priority, and location.
- **Photo Evidence Upload:** Attach supporting photographs with instant image previews.
- **Unique Complaint Reference ID:** Automatically generates unique tracking IDs such as `CMP-2026-XXXXXXXX`.
- **Complaint Tracking:** Track complaint progress using a unique reference ID.
- **Live Status Timeline:** View complaint history, timestamps, assigned officers, and administrative remarks.
- **Notification Center:** Receive notifications about complaint assignments, escalations, and resolutions.
- **Complaint History:** View and filter previously submitted complaints.
- **Citizen Satisfaction (CSAT):** Rate resolved complaints on a 1–5 star scale and provide written feedback.
- **Complaint Reopening:** Reopen complaints if the reported issue has not been properly resolved.

### 🛡️ 2. Administrator Command Center

- **Admin Dashboard:** Monitor complaint statistics and organizational activities.
- **Complaint Management:** View, search, sort, and filter complaints.
- **Department Assignment:** Assign complaints to relevant departments and field officers.
- **Priority Management:** Manage complaints based on urgency and importance.
- **SLA Monitoring:** Calculate complaint resolution deadlines based on priority.
- **Automated Escalation:** Identify overdue complaints and flag them for escalation.
- **Analytics Dashboard:** Monitor department workload, satisfaction ratings, and resolution performance.
- **CSV Report Export:** Download complaint and compliance reports.
- **Dynamic Category Configuration:** Configure complaint categories and organizational requirements.

### 🏢 3. Multi-Tenant Organization Management

- Support for multiple organizations within one platform.
- Separate complaint management for different organizations.
- Organization-specific complaint categories and departments.
- Organization-level data isolation.
- Platform-wide administration and organization management.

### 🔔 4. Notification & Tracking System

- In-app notification center.
- Notifications for complaint assignments.
- Status transition notifications.
- Escalation alerts.
- Resolution notifications.
- Timestamp-based complaint history.

---

## 👥 User Roles & Access Control

CivicCare supports five distinct user roles.

| Role | Responsibilities |
|---|---|
| Platform Super Admin | Manage organizations, onboarding, platform governance, and organization activation or suspension. |
| Municipal Organization Admin | Manage municipal complaints, departments, assignments, categories, and reports. |
| College Organization Admin | Manage campus complaints, student grievances, department assignments, and SLA compliance. |
| Staff Field Officer | View assigned complaints, update progress, and submit field inspection remarks. |
| Citizen / Student | Register complaints, upload evidence, track progress, provide feedback, and reopen complaints. |

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite 8, JavaScript |
| UI & Styling | HTML5, Vanilla CSS, Modern Light Theme Design System |
| API Integration | Axios |
| Backend | Java 22, Spring Boot 4.1.2 |
| Security | Spring Security 7 |
| Authentication | JWT (JSON Web Tokens), Role-Based Access Control |
| Database | MongoDB |
| Database Framework | Spring Data MongoDB |
| JWT Library | JJWT 0.12.6 |
| Architecture | RESTful APIs, Repository Pattern |
| Notifications | Real-Time Polling |
| Build Tool | Maven |
| Version Control | Git & GitHub |
| Development Tools | VS Code,  MongoDB Compass |

---

## 🏗️ System Architecture

CivicCare follows a layered client-server architecture consisting of a React frontend, Spring Boot backend, and MongoDB database.

### Application Workflow

1. Citizens and administrators access the application through the React frontend.
2. Users authenticate through the backend authentication services.
3. JWT tokens provide secure access to authorized application features.
4. The Spring Boot backend processes requests through RESTful APIs.
5. Spring Data MongoDB communicates with the MongoDB database.
6. The complaint management engine handles registration, assignment, tracking, and status updates.
7. The SLA engine calculates deadlines and identifies overdue complaints.
8. The notification system informs users about important complaint activities.
9. Citizens monitor complaint progress and submit satisfaction feedback.

---

## 📂 Project Structure

```text
Online Complaint management system/
│
├── backend/
│   ├── .mvn/
│   │   └── wrapper/
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── pom.xml
│   │
│   └── src/
│       ├── main/
│       │   ├── java/compliant_api/
│       │   │   ├── ComplaintApiApplication.java
│       │   │   ├── Complaint.java
│       │   │   ├── ComplaintRepository.java
│       │   │   ├── ComplaintController.java
│       │   │   ├── User.java
│       │   │   ├── UserRepository.java
│       │   │   ├── AuthController.java
│       │   │   ├── Notification.java
│       │   │   ├── NotificationRepository.java
│       │   │   ├── NotificationController.java
│       │   │   ├── StatusHistoryItem.java
│       │   │   ├── Organization.java
│       │   │   ├── OrganizationController.java
│       │   │   ├── OrganizationRepository.java
│       │   │   ├── CategoryConfig.java
│       │   │   ├── DepartmentConfig.java
│       │   │   ├── SecurityConfig.java
│       │   │   ├── JwtService.java
│       │   │   └── JwtAuthFilter.java
│       │   │
│       │   └── resources/
│       │       └── application.properties
│       │
│       └── test/
│           └── java/compliant_api/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── SubmitComplaint.jsx
│   │   │   ├── TrackComplaint.jsx
│   │   │   ├── MyComplaints.jsx
│   │   │   ├── AdminPortal.jsx
│   │   │   ├── SuperAdminPortal.jsx
│   │   │   ├── CitizenPortal.jsx
│   │   │   └── AuthModal.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
└── README.md
```

---

## ⚙️ Installation & Setup

Follow these steps to run CivicCare on your local machine.

### Prerequisites

Install the following software:

- Java JDK 21 or 22
- Node.js 20 or above
- npm
- MongoDB Community Server
- MongoDB Shell (mongosh)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Madhu-1228/Online-Complaint-Management-System.git
```

Navigate to the project directory:

```bash
cd "Online Complaint management system"
```

Use the actual folder name created after cloning if it differs.

### 2. Start MongoDB

Open Windows PowerShell and check the MongoDB service:

```powershell
Get-Service MongoDB
```

If the service is stopped, execute:

```powershell
Start-Service MongoDB
```

Verify database connectivity:

```bash
mongosh complaint_management_db --eval "db.adminCommand('ping')"
```

**Database Configuration:**

| Configuration | Value |
|---|---|
| Database | `complaint_management_db` |
| MongoDB Host | `localhost` |
| MongoDB Port | `27017` |

### 3. Start the Spring Boot Backend

Open a terminal in the project directory and navigate to the backend:

```powershell
cd backend
```

Run the Spring Boot application:

```powershell
.\mvnw.cmd spring-boot:run
```

<badge color="success">Backend</badge>

```text
http://localhost:8081
```

**Database Diagnostic Endpoint:**

```text
http://localhost:8081/api/complaints/debug/database
```

### 4. Start the React Frontend

Open a second terminal in VS Code.

Navigate to the frontend directory:

```powershell
cd frontend
```

Install the required dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

<badge color="success">Frontend</badge>

```text
http://localhost:5173
```

---

## 🔑 Demo Credentials

CivicCare provides demo login options for testing and project evaluation.

| User Role | Email | Password |
|---|---|---|
| Platform Super Admin | `superadmin@civiccare.com` | `admin123` |
| Municipal Organization Admin | `admin@civiccare.com` | `admin123` |
| College Organization Admin | `collegeadmin@apex.edu` | `admin123` |
| Staff Field Officer | `officer@civiccare.com` | `admin123` |
| Citizen / Student | `devan@example.com` | `password123` |

**Note:** Demo accounts must be initialized in the application before use. Use the one-click demo login options available in the Sign-In modal. These credentials are intended only for local demonstration and evaluation, not production deployment.

---

## 🔐 Security & Architecture Highlights

### 1. JWT-Based Authentication

Implements stateless authentication using JSON Web Tokens with Spring Security.

- Secure token generation and verification.
- Bearer token authentication.
- Role-based access control.
- Protected REST API endpoints.

### 2. Multi-Tenant Data Isolation

- Every complaint is associated with an organization.
- Organization-specific complaint retrieval.
- Prevents unauthorized access across organizational boundaries.
- Supports independent municipal and educational organization workflows.

### 3. Dynamic Domain Configuration

- Organization-specific complaint categories.
- Configurable departments.
- Priority-based SLA thresholds.
- Flexible organizational configuration.

### 4. Auditable Status Timeline

- Maintains complaint status history.
- Records timestamps for status transitions.
- Stores administrative remarks and assigned officer information.
- Provides transparent complaint tracking.

### 5. Automated SLA Escalation

The system calculates resolution deadlines according to complaint priority.

| Priority | SLA Deadline |
|---|---|
| Urgent | 24 Hours |
| High | 48 Hours |
| Medium | 72 Hours |
| Low | 5 Days |

Overdue complaints are automatically flagged for escalation.

### 6. Notification Management

The application uses real-time polling to retrieve notification updates and inform users about complaint activities.

### 7. MongoDB Database Management

The application maintains separate collections for users, complaints, organizations, and notifications.

Database:

```text
complaint_management_db
```

---

## 📊 Complaint Lifecycle

The complaint management process follows a structured workflow:

```text
Citizen Registers Complaint
          |
          v
Complaint Reference ID Generated
          |
          v
Complaint Stored in MongoDB
          |
          v
Admin Reviews Complaint
          |
          v
Department & Officer Assignment
          |
          v
Complaint Processing
          |
          v
SLA Monitoring & Escalation
          |
          v
Complaint Resolution
          |
          v
Citizen Satisfaction Feedback
          |
          v
Complaint Completed
```

If a citizen is dissatisfied with the resolution, the complaint can be reopened.

---

## 🎯 Project Objectives

- Digitize the traditional public grievance registration process.
- Provide a centralized complaint management platform.
- Improve communication between citizens and administrators.
- Automate complaint assignment and resolution monitoring.
- Ensure transparent complaint tracking through audit timelines.
- Improve accountability through SLA monitoring and escalation.
- Support multiple organizations through tenant-based isolation.
- Measure citizen satisfaction through feedback and ratings.

---

## 🔮 Future Enhancements

- AI-powered complaint classification and prioritization.
- GPS-based complaint location identification.
- SMS and email notification integration.
- Mobile application support.
- Advanced predictive analytics for complaint resolution.
- Integration with government grievance portals.
- Multilingual citizen support.

---

## 🎓 Placement Viva & Interview Preparation

### 1. Why MongoDB instead of a relational database?

MongoDB supports flexible document structures, making it suitable for complaints containing dynamic categories, embedded status histories, and varying metadata. It also supports document-level atomic operations.

### 2. How is multi-tenant isolation achieved?

Each complaint is associated with an `organizationId`. Backend queries use the authenticated user's organization context to restrict access to the appropriate organization's records.

### 3. How does SLA calculation work?

The system calculates the target resolution deadline using the complaint priority or configured SLA duration. Overdue complaints are identified and flagged for escalation.

### 4. Why use JWT authentication?

JWT supports stateless authentication. The backend validates signed tokens and uses their claims to identify users and authorize protected operations without maintaining server-side login sessions.

### 5. Why use React and Spring Boot?

React provides a component-based and responsive frontend, while Spring Boot provides a structured backend for REST APIs, authentication, database operations, and business logic.

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository.
2. Create a new feature branch.
3. Commit your changes.
4. Push your branch.
5. Submit a Pull Request.

---

## 📄 License

This project is developed as a B.Tech Information Technology capstone project for academic and educational purposes.

An appropriate open-source license can be added before public distribution.

---

## 👨‍💻 Project Information

| Field | Details |
|---|---|
| Project Name | CivicCare |
| Project Category | Full-Stack Web Application |
| Project Domain | Public Grievance Redressal |
| Frontend | React 19 + Vite 8 |
| Backend | Java + Spring Boot |
| Database | MongoDB |
| Authentication | JWT + Spring Security |
| Architecture | Multi-Tenant Client-Server Architecture |
| User Roles | Super Admin, Organization Admin, Field Officer, Citizen |

---

<p align="center">

### 🏛️ CivicCare

**Making Public Grievance Management Smarter, Transparent, and Accountable.**

</p>
