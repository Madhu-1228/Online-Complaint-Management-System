package compliant_api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/organizations")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"})
public class OrganizationController {

    private final OrganizationRepository organizationRepository;

    public OrganizationController(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    // Public list of active organizations for citizen/member onboarding
    @GetMapping
    public List<Organization> getActiveOrganizations() {
        return organizationRepository.findByStatus("ACTIVE");
    }

    // Platform Super Admin: Get all organizations (including pending / suspended)
    @GetMapping("/all")
    public List<Organization> getAllOrganizations() {
        return organizationRepository.findAll();
    }

    // Get single organization by ID or Slug
    @GetMapping("/{idOrSlug}")
    public ResponseEntity<?> getOrganization(@PathVariable String idOrSlug) {
        Optional<Organization> org = organizationRepository.findById(idOrSlug);
        if (org.isEmpty()) {
            org = organizationRepository.findBySlug(idOrSlug);
        }

        return org.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Organization not found.")));
    }

    // Onboard / Create a new Organization
    @PostMapping
    public ResponseEntity<?> createOrganization(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        String slug = (String) request.get("slug");
        String type = (String) request.get("type");
        String description = (String) request.get("description");
        String contactEmail = (String) request.get("contactEmail");
        String contactPhone = (String) request.get("contactPhone");
        String address = (String) request.get("address");

        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Organization name is required."));
        }

        if (slug == null || slug.isBlank()) {
            slug = name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        } else {
            slug = slug.toLowerCase().trim();
        }

        if (organizationRepository.existsBySlug(slug)) {
            slug = slug + "-" + UUID.randomUUID().toString().substring(0, 4);
        }

        String orgType = type != null && !type.isBlank() ? type.toUpperCase() : "OTHER";

        Organization org = new Organization(
                slug,
                name.trim(),
                orgType,
                description != null ? description.trim() : "",
                contactEmail != null ? contactEmail.trim() : "",
                contactPhone != null ? contactPhone.trim() : "",
                address != null ? address.trim() : ""
        );

        // Populate default domain-specific categories and departments
        populateDomainDefaults(org, orgType);

        Organization saved = organizationRepository.save(org);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Platform Admin: Update organization status (ACTIVE, SUSPENDED, PENDING)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {

        String status = request.get("status");
        if (status == null || (!status.equals("ACTIVE") && !status.equals("SUSPENDED") && !status.equals("PENDING"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Valid status is required: ACTIVE, SUSPENDED, PENDING."));
        }

        return organizationRepository.findById(id)
                .<ResponseEntity<?>>map(org -> {
                    org.setStatus(status);
                    org.setUpdatedAt(LocalDateTime.now());
                    Organization saved = organizationRepository.save(org);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Organization not found.")));
    }

    // Org Admin: Add dynamic category
    @PostMapping("/{id}/categories")
    public ResponseEntity<?> addCategory(
            @PathVariable String id,
            @RequestBody CategoryConfig categoryConfig) {

        if (categoryConfig.getName() == null || categoryConfig.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Category name is required."));
        }

        return organizationRepository.findById(id)
                .<ResponseEntity<?>>map(org -> {
                    boolean exists = org.getCategories().stream()
                            .anyMatch(c -> c.getName().equalsIgnoreCase(categoryConfig.getName().trim()));
                    if (exists) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(Map.of("message", "Category already exists in this organization."));
                    }

                    if (categoryConfig.getIcon() == null || categoryConfig.getIcon().isBlank()) {
                        categoryConfig.setIcon("📌");
                    }
                    if (categoryConfig.getDefaultPriority() == null) {
                        categoryConfig.setDefaultPriority("MEDIUM");
                    }
                    if (categoryConfig.getSlaHours() <= 0) {
                        categoryConfig.setSlaHours(72);
                    }

                    org.getCategories().add(categoryConfig);
                    org.setUpdatedAt(LocalDateTime.now());
                    Organization updated = organizationRepository.save(org);
                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Organization not found.")));
    }

    // Org Admin: Delete dynamic category
    @DeleteMapping("/{id}/categories/{categoryName}")
    public ResponseEntity<?> deleteCategory(
            @PathVariable String id,
            @PathVariable String categoryName) {

        return organizationRepository.findById(id)
                .<ResponseEntity<?>>map(org -> {
                    org.getCategories().removeIf(c -> c.getName().equalsIgnoreCase(categoryName.trim()));
                    org.setUpdatedAt(LocalDateTime.now());
                    Organization updated = organizationRepository.save(org);
                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Organization not found.")));
    }

    // Org Admin: Add dynamic department
    @PostMapping("/{id}/departments")
    public ResponseEntity<?> addDepartment(
            @PathVariable String id,
            @RequestBody DepartmentConfig deptConfig) {

        if (deptConfig.getName() == null || deptConfig.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Department name is required."));
        }

        return organizationRepository.findById(id)
                .<ResponseEntity<?>>map(org -> {
                    boolean exists = org.getDepartments().stream()
                            .anyMatch(d -> d.getName().equalsIgnoreCase(deptConfig.getName().trim()));
                    if (exists) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(Map.of("message", "Department already exists in this organization."));
                    }

                    org.getDepartments().add(deptConfig);
                    org.setUpdatedAt(LocalDateTime.now());
                    Organization updated = organizationRepository.save(org);
                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Organization not found.")));
    }

    // Org Admin: Delete dynamic department
    @DeleteMapping("/{id}/departments/{deptName}")
    public ResponseEntity<?> deleteDepartment(
            @PathVariable String id,
            @PathVariable String deptName) {

        return organizationRepository.findById(id)
                .<ResponseEntity<?>>map(org -> {
                    org.getDepartments().removeIf(d -> d.getName().equalsIgnoreCase(deptName.trim()));
                    org.setUpdatedAt(LocalDateTime.now());
                    Organization updated = organizationRepository.save(org);
                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Organization not found.")));
    }

    // Org Admin: Update dynamic department
    @PutMapping("/{id}/departments/{oldDeptName}")
    public ResponseEntity<?> updateDepartment(
            @PathVariable String id,
            @PathVariable String oldDeptName,
            @RequestBody DepartmentConfig updatedConfig) {

        return organizationRepository.findById(id)
                .<ResponseEntity<?>>map(org -> {
                    boolean found = false;
                    for (DepartmentConfig d : org.getDepartments()) {
                        if (d.getName().equalsIgnoreCase(oldDeptName.trim())) {
                            if (updatedConfig.getName() != null && !updatedConfig.getName().isBlank()) {
                                d.setName(updatedConfig.getName().trim());
                            }
                            if (updatedConfig.getHeadOfficer() != null) {
                                d.setHeadOfficer(updatedConfig.getHeadOfficer().trim());
                            }
                            if (updatedConfig.getContactEmail() != null) {
                                d.setContactEmail(updatedConfig.getContactEmail().trim());
                            }
                            if (updatedConfig.getContactPhone() != null) {
                                d.setContactPhone(updatedConfig.getContactPhone().trim());
                            }
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Department not found."));
                    }
                    org.setUpdatedAt(LocalDateTime.now());
                    Organization updated = organizationRepository.save(org);
                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Organization not found.")));
    }

    // Helper: Domain default generator
    private void populateDomainDefaults(Organization org, String type) {
        switch (type) {
            case "COLLEGE" -> {
                org.getDepartments().addAll(List.of(
                        new DepartmentConfig("Hostel & Residential Life", "Chief Warden Dr. M. Rao", "hostel@apex.edu", "ext-101"),
                        new DepartmentConfig("Campus IT & Network Services", "Lead Admin S. Verma", "ithelp@apex.edu", "ext-102"),
                        new DepartmentConfig("Transport & Fleet Division", "Officer K. Sundaram", "transport@apex.edu", "ext-103"),
                        new DepartmentConfig("Academic & Classroom Facilities", "Dean Academics Office", "academics@apex.edu", "ext-104"),
                        new DepartmentConfig("Examination & Evaluation Cell", "Controller of Exams", "exams@apex.edu", "ext-105")
                ));
                org.getCategories().addAll(List.of(
                        new CategoryConfig("Hostel & Mess Grievances", "🛏️", "MEDIUM", 48, "Hostel & Residential Life"),
                        new CategoryConfig("Campus Wi-Fi & Lab Systems", "💻", "HIGH", 24, "Campus IT & Network Services"),
                        new CategoryConfig("College Bus Route Disruptions", "🚌", "HIGH", 24, "Transport & Fleet Division"),
                        new CategoryConfig("Classroom AC / Projector Faults", "📽️", "LOW", 72, "Academic & Classroom Facilities"),
                        new CategoryConfig("Marksheet / Hall Ticket Queries", "📄", "URGENT", 24, "Examination & Evaluation Cell")
                ));
            }
            case "CORPORATE" -> {
                org.getDepartments().addAll(List.of(
                        new DepartmentConfig("Enterprise IT Operations", "DevOps Lead Alex Chen", "itops@techcorp.com", "ext-201"),
                        new DepartmentConfig("Facilities & Workplace Services", "Building Mgr Sarah Jenkins", "facilities@techcorp.com", "ext-202"),
                        new DepartmentConfig("HR & People Operations", "HRBP David Miller", "people@techcorp.com", "ext-203"),
                        new DepartmentConfig("Finance & Payroll Queries", "Payroll Specialist Lisa Ray", "payroll@techcorp.com", "ext-204")
                ));
                org.getCategories().addAll(List.of(
                        new CategoryConfig("Workstation & Hardware Faults", "🖥️", "HIGH", 24, "Enterprise IT Operations"),
                        new CategoryConfig("Air Conditioning & Office Lighting", "💡", "LOW", 48, "Facilities & Workplace Services"),
                        new CategoryConfig("Access Badge & Security Passes", "🪪", "MEDIUM", 24, "Facilities & Workplace Services"),
                        new CategoryConfig("Salary Slip & Reimbursement Delays", "💰", "HIGH", 48, "Finance & Payroll Queries"),
                        new CategoryConfig("Workplace Harassment / Grievance", "⚖️", "URGENT", 24, "HR & People Operations")
                ));
            }
            case "HEALTHCARE" -> {
                org.getDepartments().addAll(List.of(
                        new DepartmentConfig("Patient Care & Nursing Services", "Chief Matron R. Nair", "nursing@apollo.org", "ext-301"),
                        new DepartmentConfig("Hospital Billing & Insurance TPA", "Billing In-Charge A. Kulkarni", "billing@apollo.org", "ext-302"),
                        new DepartmentConfig("Sanitation & Infection Control", "Safety Officer P. Bannerjee", "hygiene@apollo.org", "ext-303"),
                        new DepartmentConfig("Pharmacy & Drug Dispensation", "Lead Pharmacist Dr. N. Gupta", "pharmacy@apollo.org", "ext-304")
                ));
                org.getCategories().addAll(List.of(
                        new CategoryConfig("Excessive Consultation Wait Time", "⏱️", "HIGH", 12, "Patient Care & Nursing Services"),
                        new CategoryConfig("Insurance Cashless Approval Delay", "📋", "URGENT", 24, "Hospital Billing & Insurance TPA"),
                        new CategoryConfig("Ward Cleanliness & Hygiene", "🧼", "HIGH", 12, "Sanitation & Infection Control"),
                        new CategoryConfig("Prescribed Medicine Unavailability", "💊", "URGENT", 12, "Pharmacy & Drug Dispensation")
                ));
            }
            case "RESIDENTIAL" -> {
                org.getDepartments().addAll(List.of(
                        new DepartmentConfig("Lift & Electrical Maintenance", "Eng. Vinod Kumar", "electrical@greenwood.res", "ext-401"),
                        new DepartmentConfig("Plumbing & Water Tanks Division", "Supervisor Ramesh", "plumbing@greenwood.res", "ext-402"),
                        new DepartmentConfig("Gated Security & Visitor Management", "Chief Guard Major Singh", "security@greenwood.res", "ext-403"),
                        new DepartmentConfig("Clubhouse & Landscape Upkeep", "Estate Mgr Priya Sen", "amenities@greenwood.res", "ext-404")
                ));
                org.getCategories().addAll(List.of(
                        new CategoryConfig("Elevator Malfunction / Stoppage", "🛗", "URGENT", 6, "Lift & Electrical Maintenance"),
                        new CategoryConfig("Overhead Tank Water Contamination", "🚰", "URGENT", 12, "Plumbing & Water Tanks Division"),
                        new CategoryConfig("Basement Parking Encroachment", "🚗", "MEDIUM", 48, "Gated Security & Visitor Management"),
                        new CategoryConfig("Swimming Pool / Gym Equipment Fault", "🏊", "LOW", 72, "Clubhouse & Landscape Upkeep")
                ));
            }
            case "TRANSPORT" -> {
                org.getDepartments().addAll(List.of(
                        new DepartmentConfig("Metro Operations & Train Control", "Station Controller Amit Roy", "metro@citytransit.gov", "ext-501"),
                        new DepartmentConfig("Bus Rapid Transit (BRT) Division", "Depot Incharge S. K. Patel", "brt@citytransit.gov", "ext-502"),
                        new DepartmentConfig("Smart Card & Automated Ticketing", "System Admin Neha Verma", "tickets@citytransit.gov", "ext-503"),
                        new DepartmentConfig("Station Facilities & Escalators", "Maintenance Officer Rajiv Sen", "facilities@citytransit.gov", "ext-504"),
                        new DepartmentConfig("Transit Safety & Security", "Security Marshal Insp. D. Rao", "security@citytransit.gov", "ext-505")
                ));
                org.getCategories().addAll(List.of(
                        new CategoryConfig("Metro Delay & Signal Failure", "🚆", "HIGH", 12, "Metro Operations & Train Control"),
                        new CategoryConfig("Bus Route Breakdown & AC Fault", "🚌", "HIGH", 24, "Bus Rapid Transit (BRT) Division"),
                        new CategoryConfig("Smartcard Recharge / AFC Gate Error", "💳", "URGENT", 12, "Smart Card & Automated Ticketing"),
                        new CategoryConfig("Escalator & Elevator Breakdown", "🛗", "HIGH", 24, "Station Facilities & Escalators"),
                        new CategoryConfig("Station Cleanliness & Harassment", "🚨", "URGENT", 6, "Transit Safety & Security")
                ));
            }
            default -> { // MUNICIPALITY
                org.getDepartments().addAll(List.of(
                        new DepartmentConfig("Roads & Highway Works", "Exec Engineer R. Sharma", "roads@municipality.gov", "1800-ROADS"),
                        new DepartmentConfig("Water Supply & Sewerage Board", "Chief Engineer V. Naidu", "water@municipality.gov", "1800-WATER"),
                        new DepartmentConfig("Electricity & Street Lighting", "Superintending Eng S. Paul", "power@municipality.gov", "1800-POWER"),
                        new DepartmentConfig("Solid Waste & Public Sanitation", "Health Officer Dr. K. Das", "waste@municipality.gov", "1800-WASTE"),
                        new DepartmentConfig("Urban Stormwater Drainage", "Divisional Officer M. Khan", "drainage@municipality.gov", "1800-DRAIN")
                ));
                org.getCategories().addAll(List.of(
                        new CategoryConfig("Roads and Potholes", "🛣️", "HIGH", 48, "Roads & Highway Works"),
                        new CategoryConfig("Water Supply Disruption", "🚰", "HIGH", 48, "Water Supply & Sewerage Board"),
                        new CategoryConfig("Streetlight / Transformer Outage", "⚡", "MEDIUM", 72, "Electricity & Street Lighting"),
                        new CategoryConfig("Sanitation and Garbage Overflow", "🗑️", "HIGH", 24, "Solid Waste & Public Sanitation"),
                        new CategoryConfig("Monsoon Drainage Waterlogging", "🌊", "URGENT", 24, "Urban Stormwater Drainage")
                ));
            }
        }
    }
}
