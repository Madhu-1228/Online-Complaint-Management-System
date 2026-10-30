package compliant_api;

import jakarta.annotation.PostConstruct;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"})
public class AuthController {

    private static final java.util.regex.Pattern EMAIL_PATTERN =
            java.util.regex.Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]*\\.[a-zA-Z]{2,}$");

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final ComplaintRepository complaintRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(
            UserRepository userRepository,
            OrganizationRepository organizationRepository,
            ComplaintRepository complaintRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.complaintRepository = complaintRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // Seed default organizations and multi-role demo accounts
    @PostConstruct
    public void initMultiTenantPlatform() {
        // 1. Seed Default Apex Municipal Corporation if missing
        Organization municipalOrg = organizationRepository.findBySlug("apex-municipality")
                .orElseGet(() -> {
                    Organization org = new Organization(
                            "apex-municipality",
                            "Apex Municipal Corporation",
                            "MUNICIPALITY",
                            "Public Civic Services & Infrastructure Redressal Board",
                            "support@apex-municipality.gov",
                            "1800-CIVIC-MUNI",
                            "Civic Square, Sector 1"
                    );
                    org.getDepartments().addAll(List.of(
                            new DepartmentConfig("Roads & Highway Works", "Exec Engineer R. Sharma", "roads@apex-municipality.gov", "1800-ROADS"),
                            new DepartmentConfig("Water Supply & Sewerage Board", "Chief Engineer V. Naidu", "water@apex-municipality.gov", "1800-WATER"),
                            new DepartmentConfig("Electricity & Street Lighting", "Superintending Eng S. Paul", "power@apex-municipality.gov", "1800-POWER"),
                            new DepartmentConfig("Solid Waste & Public Sanitation", "Health Officer Dr. K. Das", "waste@apex-municipality.gov", "1800-WASTE"),
                            new DepartmentConfig("Urban Stormwater Drainage", "Divisional Officer M. Khan", "drainage@apex-municipality.gov", "1800-DRAIN")
                    ));
                    org.getCategories().addAll(List.of(
                            new CategoryConfig("Roads and Potholes", "🛣️", "HIGH", 48, "Roads & Highway Works"),
                            new CategoryConfig("Water Supply Disruption", "🚰", "HIGH", 48, "Water Supply & Sewerage Board"),
                            new CategoryConfig("Streetlight / Transformer Outage", "⚡", "MEDIUM", 72, "Electricity & Street Lighting"),
                            new CategoryConfig("Sanitation and Garbage Overflow", "🗑️", "HIGH", 24, "Solid Waste & Public Sanitation"),
                            new CategoryConfig("Monsoon Drainage Waterlogging", "🌊", "URGENT", 24, "Urban Stormwater Drainage")
                    ));
                    return organizationRepository.save(org);
                });

        // 2. Seed Educational Institution (College)
        if (!organizationRepository.existsBySlug("apex-university")) {
            Organization collegeOrg = new Organization(
                    "apex-university",
                    "Apex Institute of Technology",
                    "COLLEGE",
                    "Engineering & Technology Campus Grievance Portal",
                    "registrar@apex.edu",
                    "+91 40-23456789",
                    "Academic Hills, Campus Road"
            );
            collegeOrg.getDepartments().addAll(List.of(
                    new DepartmentConfig("Hostel & Residential Life", "Chief Warden Dr. M. Rao", "hostel@apex.edu", "ext-101"),
                    new DepartmentConfig("Campus IT & Network Services", "Lead Admin S. Verma", "ithelp@apex.edu", "ext-102"),
                    new DepartmentConfig("Transport & Fleet Division", "Officer K. Sundaram", "transport@apex.edu", "ext-103"),
                    new DepartmentConfig("Academic & Classroom Facilities", "Dean Academics Office", "academics@apex.edu", "ext-104"),
                    new DepartmentConfig("Examination & Evaluation Cell", "Controller of Exams", "exams@apex.edu", "ext-105")
            ));
            collegeOrg.getCategories().addAll(List.of(
                    new CategoryConfig("Hostel & Mess Grievances", "🛏️", "MEDIUM", 48, "Hostel & Residential Life"),
                    new CategoryConfig("Campus Wi-Fi & Lab Systems", "💻", "HIGH", 24, "Campus IT & Network Services"),
                    new CategoryConfig("College Bus Route Disruptions", "🚌", "HIGH", 24, "Transport & Fleet Division"),
                    new CategoryConfig("Classroom AC / Projector Faults", "📽️", "LOW", 72, "Academic & Classroom Facilities"),
                    new CategoryConfig("Marksheet / Hall Ticket Queries", "📄", "URGENT", 24, "Examination & Evaluation Cell")
            ));
            organizationRepository.save(collegeOrg);
        }

        // 3. Seed Corporate Enterprise
        if (!organizationRepository.existsBySlug("techcorp-global")) {
            Organization corpOrg = new Organization(
                    "techcorp-global",
                    "TechCorp Global Headquarters",
                    "CORPORATE",
                    "Internal Employee Workplace Concerns & Facilities Redressal",
                    "helpdesk@techcorp.com",
                    "+1 800-TECH-HELP",
                    "Innovation Park, Tower B"
            );
            corpOrg.getDepartments().addAll(List.of(
                    new DepartmentConfig("Enterprise IT Operations", "DevOps Lead Alex Chen", "itops@techcorp.com", "ext-201"),
                    new DepartmentConfig("Facilities & Workplace Services", "Building Mgr Sarah Jenkins", "facilities@techcorp.com", "ext-202"),
                    new DepartmentConfig("HR & People Operations", "HRBP David Miller", "people@techcorp.com", "ext-203")
            ));
            corpOrg.getCategories().addAll(List.of(
                    new CategoryConfig("Workstation & Hardware Faults", "🖥️", "HIGH", 24, "Enterprise IT Operations"),
                    new CategoryConfig("Air Conditioning & Lighting", "💡", "LOW", 48, "Facilities & Workplace Services"),
                    new CategoryConfig("Access Badge & Passes", "🪪", "MEDIUM", 24, "Facilities & Workplace Services"),
                    new CategoryConfig("Workplace Grievances", "⚖️", "URGENT", 24, "HR & People Operations")
            ));
            organizationRepository.save(corpOrg);
        }

        // 4. Seed Healthcare / Hospital
        if (!organizationRepository.existsBySlug("apollo-healthcare")) {
            Organization hospOrg = new Organization(
                    "apollo-healthcare",
                    "Apollo Care Multi-Specialty Hospital",
                    "HEALTHCARE",
                    "Patient Service, Hygiene & Quality of Care Redressal",
                    "patienthelp@apollo.org",
                    "1800-APOLLO-CARE",
                    "Health City Boulevard"
            );
            hospOrg.getDepartments().addAll(List.of(
                    new DepartmentConfig("Patient Care & Nursing", "Chief Matron R. Nair", "nursing@apollo.org", "ext-301"),
                    new DepartmentConfig("Billing & Insurance TPA", "Billing In-Charge A. Kulkarni", "billing@apollo.org", "ext-302"),
                    new DepartmentConfig("Sanitation & Infection Control", "Safety Officer P. Bannerjee", "hygiene@apollo.org", "ext-303")
            ));
            hospOrg.getCategories().addAll(List.of(
                    new CategoryConfig("Excessive Consultation Wait", "⏱️", "HIGH", 12, "Patient Care & Nursing"),
                    new CategoryConfig("Insurance Cashless Delays", "📋", "URGENT", 24, "Billing & Insurance TPA"),
                    new CategoryConfig("Ward Cleanliness & Hygiene", "🧼", "HIGH", 12, "Sanitation & Infection Control")
            ));
            organizationRepository.save(hospOrg);
        }

        // 5. Seed Public Transit & Metro Authority
        if (!organizationRepository.existsBySlug("metro-transit")) {
            Organization transitOrg = new Organization(
                    "metro-transit",
                    "City Metro & Transit Express",
                    "TRANSPORT",
                    "Public Transportation, Metro Rail & City Bus Redressal Board",
                    "support@citytransit.gov",
                    "1800-TRANSIT-LINE",
                    "Transit Central Hub, Terminal 1"
            );
            transitOrg.getDepartments().addAll(List.of(
                    new DepartmentConfig("Metro Operations & Train Control", "Station Controller Amit Roy", "metro@citytransit.gov", "ext-501"),
                    new DepartmentConfig("Bus Rapid Transit (BRT) Division", "Depot Incharge S. K. Patel", "brt@citytransit.gov", "ext-502"),
                    new DepartmentConfig("Smart Card & Automated Ticketing", "System Admin Neha Verma", "tickets@citytransit.gov", "ext-503"),
                    new DepartmentConfig("Station Facilities & Escalators", "Maintenance Officer Rajiv Sen", "facilities@citytransit.gov", "ext-504"),
                    new DepartmentConfig("Transit Safety & Security", "Security Marshal Insp. D. Rao", "security@citytransit.gov", "ext-505")
            ));
            transitOrg.getCategories().addAll(List.of(
                    new CategoryConfig("Metro Delay & Signal Failure", "🚆", "HIGH", 12, "Metro Operations & Train Control"),
                    new CategoryConfig("Bus Route Breakdown & AC Fault", "🚌", "HIGH", 24, "Bus Rapid Transit (BRT) Division"),
                    new CategoryConfig("Smartcard Recharge / AFC Gate Error", "💳", "URGENT", 12, "Smart Card & Automated Ticketing"),
                    new CategoryConfig("Escalator & Elevator Breakdown", "🛗", "HIGH", 24, "Station Facilities & Escalators"),
                    new CategoryConfig("Station Cleanliness & Harassment", "🚨", "URGENT", 6, "Transit Safety & Security")
            ));
            organizationRepository.save(transitOrg);
        }

        // 6. Backfill existing complaints with default organizationId and domain
        List<Complaint> legacyComplaints = complaintRepository.findAll();
        for (Complaint c : legacyComplaints) {
            boolean updated = false;
            if (c.getOrganizationId() == null || c.getOrganizationId().isBlank()) {
                c.setOrganizationId(municipalOrg.getId());
                c.setOrganizationName(municipalOrg.getName());
                updated = true;
            }
            if (c.getDomain() == null || c.getDomain().isBlank()) {
                Optional<Organization> orgMatch = organizationRepository.findById(c.getOrganizationId());
                c.setDomain(orgMatch.map(Organization::getType).orElse("MUNICIPALITY"));
                updated = true;
            }
            if (updated) {
                complaintRepository.save(c);
            }
        }

        // 6. Seed Demo Accounts for All 4 Roles
        // A. Platform Super Admin
        if (!userRepository.existsByEmail("superadmin@civiccare.com")) {
            User superAdmin = new User(
                    "Platform Master Admin",
                    "superadmin@civiccare.com",
                    passwordEncoder.encode("admin123"),
                    "ROLE_SUPER_ADMIN",
                    "1800-PLATFORM",
                    null,
                    "Platform Operations"
            );
            userRepository.save(superAdmin);
        }

        // B. Municipal Org Admin (update existing or create)
        Optional<User> adminOpt = userRepository.findByEmail("admin@civiccare.com");
        if (adminOpt.isPresent()) {
            User admin = adminOpt.get();
            admin.setRole("ROLE_ORG_ADMIN");
            admin.setOrganizationId(municipalOrg.getId());
            admin.setOrganizationName(municipalOrg.getName());
            userRepository.save(admin);
        } else {
            User admin = new User(
                    "Municipal Administrator",
                    "admin@civiccare.com",
                    passwordEncoder.encode("admin123"),
                    "ROLE_ORG_ADMIN",
                    "1800-CIVIC-MUNI",
                    municipalOrg.getId(),
                    municipalOrg.getName()
            );
            userRepository.save(admin);
        }

        // C. College Org Admin
        Organization college = organizationRepository.findBySlug("apex-university").orElse(municipalOrg);
        if (!userRepository.existsByEmail("collegeadmin@apex.edu")) {
            User collegeAdmin = new User(
                    "Dean Academic Admin",
                    "collegeadmin@apex.edu",
                    passwordEncoder.encode("admin123"),
                    "ROLE_ORG_ADMIN",
                    "+91 40-23456789",
                    college.getId(),
                    college.getName()
            );
            userRepository.save(collegeAdmin);
        }

        // D. Department Staff / Officer
        if (!userRepository.existsByEmail("officer@civiccare.com")) {
            User officer = new User(
                    "Inspector R. Sharma",
                    "officer@civiccare.com",
                    passwordEncoder.encode("admin123"),
                    "ROLE_OFFICER",
                    "9876500000",
                    municipalOrg.getId(),
                    municipalOrg.getName()
            );
            officer.setDepartment("Roads & Highway Works");
            userRepository.save(officer);
        }

        // E. Citizen User (update existing Devan account with org)
        Optional<User> devanOpt = userRepository.findByEmail("devan@example.com");
        if (devanOpt.isPresent()) {
            User devan = devanOpt.get();
            if (devan.getOrganizationId() == null) {
                devan.setOrganizationId(municipalOrg.getId());
                devan.setOrganizationName(municipalOrg.getName());
                userRepository.save(devan);
            }
        }

        // F. Official Demo Citizen: devan@.com / madhu@300526
        Optional<User> citizenDemoOpt = userRepository.findByEmail("devan@.com");
        if (citizenDemoOpt.isPresent()) {
            User cUser = citizenDemoOpt.get();
            cUser.setPassword(passwordEncoder.encode("madhu@300526"));
            cUser.setRole("ROLE_USER");
            cUser.setName("Devan Kumar");
            if (cUser.getPhone() == null || cUser.getPhone().isBlank()) cUser.setPhone("+91 98765 43210");
            if (cUser.getAddress() == null || cUser.getAddress().isBlank()) cUser.setAddress("42 Civic Enclave, Ward 7, Apex City");
            cUser.setStatus("ACTIVE");
            if (cUser.getOrganizationId() == null) {
                cUser.setOrganizationId(municipalOrg.getId());
                cUser.setOrganizationName(municipalOrg.getName());
            }
            userRepository.save(cUser);
        } else {
            User cUser = new User(
                    "Devan Kumar",
                    "devan@.com",
                    passwordEncoder.encode("madhu@300526"),
                    "ROLE_USER",
                    "+91 98765 43210",
                    municipalOrg.getId(),
                    municipalOrg.getName()
            );
            cUser.setAddress("42 Civic Enclave, Ward 7, Apex City");
            cUser.setStatus("ACTIVE");
            userRepository.save(cUser);
        }

        // G. Official Demo Admin: admin@.com / admin123
        Optional<User> adminDemoOpt = userRepository.findByEmail("admin@.com");
        if (adminDemoOpt.isPresent()) {
            User aUser = adminDemoOpt.get();
            aUser.setPassword(passwordEncoder.encode("admin123"));
            aUser.setRole("ROLE_ADMIN");
            aUser.setName("Civic Administrator");
            if (aUser.getPhone() == null || aUser.getPhone().isBlank()) aUser.setPhone("1800-CIVIC-MUNI");
            if (aUser.getAddress() == null || aUser.getAddress().isBlank()) aUser.setAddress("Municipal Administrative Complex, Block A");
            aUser.setStatus("ACTIVE");
            if (aUser.getOrganizationId() == null) {
                aUser.setOrganizationId(municipalOrg.getId());
                aUser.setOrganizationName(municipalOrg.getName());
            }
            userRepository.save(aUser);
        } else {
            User aUser = new User(
                    "Civic Administrator",
                    "admin@.com",
                    passwordEncoder.encode("admin123"),
                    "ROLE_ADMIN",
                    "1800-CIVIC-MUNI",
                    municipalOrg.getId(),
                    municipalOrg.getName()
            );
            aUser.setAddress("Municipal Administrative Complex, Block A");
            aUser.setStatus("ACTIVE");
            userRepository.save(aUser);
        }

        // H. Seed Multi-Domain Grievances across all sectors for devan@.com if needed
        seedMultiDomainComplaints(municipalOrg);
    }

    private void seedMultiDomainComplaints(Organization municipalOrg) {
        Optional<User> devanOpt = userRepository.findByEmail("devan@.com");
        if (devanOpt.isEmpty()) return;
        User devan = devanOpt.get();

        long devanComplaintsCount = complaintRepository.findByUserEmail("devan@.com").size();
        if (devanComplaintsCount >= 4) {
            return; // Already populated
        }

        Organization college = organizationRepository.findBySlug("apex-university").orElse(municipalOrg);
        Organization corp = organizationRepository.findBySlug("techcorp-global").orElse(municipalOrg);
        Organization hosp = organizationRepository.findBySlug("apollo-healthcare").orElse(municipalOrg);
        Organization transit = organizationRepository.findBySlug("metro-transit").orElse(municipalOrg);

        LocalDateTime now = LocalDateTime.now();

        // 1. Municipal Issue
        Complaint c1 = new Complaint();
        c1.setTrackingId("CMP-2026-MUNI8812");
        c1.setTitle("Severe Drinking Water Pipeline Leakage at 4th Cross");
        c1.setCategory("Water Supply Disruption");
        c1.setLocation("4th Cross Road, Ward 12, Apex City");
        c1.setDescription("Drinking water main supply line has fractured near the storm drain. High volume potable water loss for 12+ hours.");
        c1.setStatus("IN_PROGRESS");
        c1.setPriority("HIGH");
        c1.setOrganizationId(municipalOrg.getId());
        c1.setOrganizationName(municipalOrg.getName());
        c1.setDomain("MUNICIPALITY");
        c1.setUserId(devan.getId());
        c1.setUserName(devan.getName());
        c1.setUserEmail(devan.getEmail());
        c1.setAssignedDepartment("Water Supply & Sewerage Board");
        c1.setAssignedOfficer("Chief Engineer V. Naidu");
        c1.setCreatedAt(now.minusDays(2));
        c1.setUpdatedAt(now.minusHours(6));
        c1.setTargetResolutionDate(now.plusHours(18));
        c1.getStatusHistory().add(new StatusHistoryItem("SUBMITTED", "Grievance cataloged. Defined SLA: 48h.", "Platform Triage"));
        c1.getStatusHistory().add(new StatusHistoryItem("PENDING", "Verified citizen location and pipeline section.", "Civic Desk"));
        c1.getStatusHistory().add(new StatusHistoryItem("ASSIGNED", "Dispatched emergency repair team #4.", "Admin Allocation"));
        c1.getStatusHistory().add(new StatusHistoryItem("IN_PROGRESS", "Excavation and pipe replacement underway.", "Chief Engineer V. Naidu"));
        complaintRepository.save(c1);

        // 2. University / College Issue
        Complaint c2 = new Complaint();
        c2.setTrackingId("CMP-2026-UNIV3401");
        c2.setTitle("Hostel Block C Wi-Fi Signal Dropping & High Packet Loss");
        c2.setCategory("Campus Wi-Fi & Lab Systems");
        c2.setLocation("Hostel Block C, Floors 2 & 3");
        c2.setDescription("Wi-Fi access points on floors 2 and 3 rebooting continuously during semester exam preparation hours.");
        c2.setStatus("PENDING");
        c2.setPriority("HIGH");
        c2.setOrganizationId(college.getId());
        c2.setOrganizationName(college.getName());
        c2.setDomain("COLLEGE");
        c2.setUserId(devan.getId());
        c2.setUserName(devan.getName());
        c2.setUserEmail(devan.getEmail());
        c2.setAssignedDepartment("Campus IT & Network Services");
        c2.setCreatedAt(now.minusDays(1));
        c2.setUpdatedAt(now.minusHours(14));
        c2.setTargetResolutionDate(now.plusHours(10));
        c2.getStatusHistory().add(new StatusHistoryItem("SUBMITTED", "Campus network grievance logged.", "Hostel Portal"));
        c2.getStatusHistory().add(new StatusHistoryItem("PENDING", "Awaiting network engineer inspection ticket.", "Campus IT"));
        complaintRepository.save(c2);

        // 3. Corporate Issue
        Complaint c3 = new Complaint();
        c3.setTrackingId("CMP-2026-CORP5520");
        c3.setTitle("HVAC Central AC Cooling Failure in Innovation Pod");
        c3.setCategory("Air Conditioning & Lighting");
        c3.setLocation("Tower B, 4th Floor, Pod 14-20");
        c3.setDescription("Central air conditioning unit not cooling since morning; room temperature exceeding 31°C impacting team members.");
        c3.setStatus("ASSIGNED");
        c3.setPriority("MEDIUM");
        c3.setOrganizationId(corp.getId());
        c3.setOrganizationName(corp.getName());
        c3.setDomain("CORPORATE");
        c3.setUserId(devan.getId());
        c3.setUserName(devan.getName());
        c3.setUserEmail(devan.getEmail());
        c3.setAssignedDepartment("Facilities & Workplace Services");
        c3.setAssignedOfficer("Building Mgr Sarah Jenkins");
        c3.setCreatedAt(now.minusHours(18));
        c3.setUpdatedAt(now.minusHours(5));
        c3.setTargetResolutionDate(now.plusHours(30));
        c3.getStatusHistory().add(new StatusHistoryItem("SUBMITTED", "Facility ticket logged in Corporate Portal.", "Helpdesk Bot"));
        c3.getStatusHistory().add(new StatusHistoryItem("ASSIGNED", "Assigned to Building Services HVAC maintenance team.", "Facilities Mgr"));
        complaintRepository.save(c3);

        // 4. Healthcare Issue
        Complaint c4 = new Complaint();
        c4.setTrackingId("CMP-2026-HOSP9914");
        c4.setTitle("Cashless Insurance TPA Desk Approval Delay");
        c4.setCategory("Insurance Cashless Delays");
        c4.setLocation("Inpatient Wing B, TPA Cashless Counter 3");
        c4.setDescription("TPA cashless pre-authorization paperwork submitted 8 hours ago for discharge, but counter desk has not completed processing.");
        c4.setStatus("SUBMITTED");
        c4.setPriority("URGENT");
        c4.setOrganizationId(hosp.getId());
        c4.setOrganizationName(hosp.getName());
        c4.setDomain("HEALTHCARE");
        c4.setUserId(devan.getId());
        c4.setUserName(devan.getName());
        c4.setUserEmail(devan.getEmail());
        c4.setAssignedDepartment("Billing & Insurance TPA");
        c4.setCreatedAt(now.minusHours(4));
        c4.setUpdatedAt(now.minusHours(4));
        c4.setTargetResolutionDate(now.plusHours(20));
        c4.getStatusHistory().add(new StatusHistoryItem("SUBMITTED", "Medical priority grievance cataloged. SLA: 24h.", "Patient Care System"));
        complaintRepository.save(c4);

        // 5. Public Transit Issue (Resolved with Feedback)
        Complaint c5 = new Complaint();
        c5.setTrackingId("CMP-2026-TRAN7731");
        c5.setTitle("Metro Smartcard AFC Gate Double Deduction Error");
        c5.setCategory("Smartcard Recharge / AFC Gate Error");
        c5.setLocation("Central Metro Station, Gate #4");
        c5.setDescription("AFC barrier flap failed to open on tap, but ₹50 transit fare was debited twice from smartcard #77492.");
        c5.setStatus("RESOLVED");
        c5.setPriority("URGENT");
        c5.setOrganizationId(transit.getId());
        c5.setOrganizationName(transit.getName());
        c5.setDomain("TRANSPORT");
        c5.setUserId(devan.getId());
        c5.setUserName(devan.getName());
        c5.setUserEmail(devan.getEmail());
        c5.setAssignedDepartment("Smart Card & Automated Ticketing");
        c5.setAssignedOfficer("System Admin Neha Verma");
        c5.setCreatedAt(now.minusDays(3));
        c5.setUpdatedAt(now.minusHours(12));
        c5.setTargetResolutionDate(now.minusDays(2));
        c5.setRating(5);
        c5.setFeedback("Refund of ₹50 reversed to smartcard within 6 hours. Excellent swift response!");
        c5.setFeedbackSubmittedAt(now.minusHours(10));
        c5.getStatusHistory().add(new StatusHistoryItem("SUBMITTED", "AFC ticketing incident logged.", "Transit Redressal"));
        c5.getStatusHistory().add(new StatusHistoryItem("ASSIGNED", "Assigned to Automated Ticketing Systems Admin.", "Operations Triage"));
        c5.getStatusHistory().add(new StatusHistoryItem("RESOLVED", "Automated gateway transaction audit completed. ₹50 fare refunded to card.", "System Admin Neha Verma"));
        complaintRepository.save(c5);
    }

    private Map<String, Object> buildUserResponse(User user) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole());
        map.put("phone", user.getPhone() != null ? user.getPhone() : "");
        map.put("address", user.getAddress() != null ? user.getAddress() : "");
        map.put("status", user.getStatus() != null ? user.getStatus() : "ACTIVE");
        map.put("organizationId", user.getOrganizationId() != null ? user.getOrganizationId() : "");
        map.put("organizationName", user.getOrganizationName() != null ? user.getOrganizationName() : "");
        map.put("department", user.getDepartment() != null ? user.getDepartment() : "");
        map.put("createdAt", user.getCreatedAt());
        return map;
    }

    // Register a new citizen (Public registration is strictly ROLE_USER)
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String email = request.get("email");
        String password = request.get("password");
        String phone = request.get("phone");
        String address = request.get("address");
        String organizationId = request.get("organizationId");

        if (name == null || name.isBlank() || email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name, email, and password are required."));
        }

        String normalizedEmail = email.trim().toLowerCase();

        if (!EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid email format. Please provide a valid email address (e.g. name@domain.com)."));
        }

        if (password.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters long."));
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "An account with this email already exists."));
        }

        // Validate organization
        String orgId = organizationId;
        String orgName = "Apex Municipal Corporation";

        if (orgId != null && !orgId.isBlank()) {
            Optional<Organization> orgOpt = organizationRepository.findById(orgId);
            if (orgOpt.isEmpty()) {
                orgOpt = organizationRepository.findBySlug(orgId);
            }
            if (orgOpt.isPresent()) {
                orgId = orgOpt.get().getId();
                orgName = orgOpt.get().getName();
            }
        } else {
            List<Organization> active = organizationRepository.findByStatus("ACTIVE");
            if (!active.isEmpty()) {
                orgId = active.get(0).getId();
                orgName = active.get(0).getName();
            }
        }

        // Strictly enforce Citizen role for public registration
        String role = "ROLE_USER";

        User user = new User(
                name.trim(),
                normalizedEmail,
                passwordEncoder.encode(password),
                role,
                phone != null ? phone.trim() : "",
                orgId,
                orgName
        );
        if (address != null && !address.isBlank()) {
            user.setAddress(address.trim());
        }
        user.setStatus("ACTIVE");

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "token", token,
                "user", buildUserResponse(saved),
                "message", "Citizen registration successful!"
        ));
    }

    // Role-based login (Citizen & Admin)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please provide email and password."));
        }

        String normalizedEmail = email.trim().toLowerCase();

        if (!EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid email format. Please enter a valid email address (e.g. name@domain.com)."));
        }

        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);

        if (userOpt.isEmpty() || !passwordEncoder.matches(password, userOpt.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password."));
        }

        User user = userOpt.get();

        // Check if account is deactivated
        if ("DEACTIVATED".equalsIgnoreCase(user.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Your account has been deactivated by administration. Please contact support."));
        }

        String token = jwtService.generateToken(user);

        return ResponseEntity.ok(Map.of(
                "token", token,
                "user", buildUserResponse(user),
                "message", "Login successful!"
        ));
    }

    // Get current user details
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Authentication required."));
        }

        String token = authHeader.substring(7);
        if (!jwtService.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Token is invalid or expired."));
        }

        String email = jwtService.extractEmail(token);
        return userRepository.findByEmail(email)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(buildUserResponse(user)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found.")));
    }

    // Update Profile (Citizen or Admin)
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Authentication required."));
        }

        String token = authHeader.substring(7);
        if (!jwtService.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Token is invalid or expired."));
        }

        String email = jwtService.extractEmail(token);
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
        }

        User user = userOpt.get();
        String name = request.get("name");
        String phone = request.get("phone");
        String address = request.get("address");
        String newPassword = request.get("newPassword");
        String currentPassword = request.get("currentPassword");

        if (name != null && !name.isBlank()) {
            user.setName(name.trim());
        }
        if (phone != null) {
            user.setPhone(phone.trim());
        }
        if (address != null) {
            user.setAddress(address.trim());
        }

        // Optional password update
        if (newPassword != null && !newPassword.isBlank()) {
            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("message", "New password must be at least 6 characters long."));
            }
            if (currentPassword != null && !currentPassword.isBlank()) {
                if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Current password does not match."));
                }
            }
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        User updated = userRepository.save(user);
        return ResponseEntity.ok(Map.of(
                "user", buildUserResponse(updated),
                "message", "Profile updated successfully!"
        ));
    }

    // Admin: Get all registered citizens (with optional search)
    @GetMapping("/citizens")
    public ResponseEntity<?> getCitizens(
            @RequestParam(required = false) String search,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        List<User> citizens = userRepository.findByRoleOrderByCreatedAtDesc("ROLE_USER");

        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();
            citizens = citizens.stream()
                    .filter(u -> (u.getName() != null && u.getName().toLowerCase().contains(q))
                            || (u.getEmail() != null && u.getEmail().toLowerCase().contains(q))
                            || (u.getPhone() != null && u.getPhone().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> response = citizens.stream()
                .map(this::buildUserResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // Admin: Activate or Deactivate Citizen Account
    @PutMapping("/citizens/{id}/status")
    public ResponseEntity<?> updateCitizenStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {

        String status = request.get("status");
        if (status == null || (!status.equalsIgnoreCase("ACTIVE") && !status.equalsIgnoreCase("DEACTIVATED"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status. Allowed: ACTIVE, DEACTIVATED."));
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Citizen not found."));
        }

        User user = userOpt.get();
        user.setStatus(status.toUpperCase().trim());
        User updated = userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "user", buildUserResponse(updated),
                "message", "Citizen account status updated to " + user.getStatus()
        ));
    }
}
