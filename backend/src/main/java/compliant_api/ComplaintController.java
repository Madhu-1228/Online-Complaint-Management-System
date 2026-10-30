package compliant_api;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"})
public class ComplaintController {

    private final ComplaintRepository repository;
    private final MongoTemplate mongoTemplate;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final NotificationRepository notificationRepository;

    public ComplaintController(
            ComplaintRepository repository,
            MongoTemplate mongoTemplate,
            JwtService jwtService,
            UserRepository userRepository,
            OrganizationRepository organizationRepository,
            NotificationRepository notificationRepository) {
        this.repository = repository;
        this.mongoTemplate = mongoTemplate;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.notificationRepository = notificationRepository;
    }

    // Submit a new complaint (Multi-Tenant Scoped)
    @PostMapping
    public ResponseEntity<?> submitComplaint(
            @RequestBody Complaint complaint,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (isBlank(complaint.getTitle())
                || isBlank(complaint.getCategory())
                || isBlank(complaint.getDescription())) {

            return ResponseEntity.badRequest().body(
                    Map.of("message", "Please fill in all required complaint fields."));
        }

        // 1. Resolve Organization / Tenant
        String targetOrgId = complaint.getOrganizationId();
        User authUser = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtService.validateToken(token)) {
                String email = jwtService.extractEmail(token);
                authUser = userRepository.findByEmail(email).orElse(null);
                if (authUser != null) {
                    complaint.setUserId(authUser.getId());
                    complaint.setUserEmail(authUser.getEmail());
                    complaint.setUserName(authUser.getName());
                    if (isBlank(targetOrgId)) {
                        targetOrgId = authUser.getOrganizationId();
                    }
                }
            }
        }

        // Fallback to first active organization if none provided
        if (isBlank(targetOrgId)) {
            List<Organization> active = organizationRepository.findByStatus("ACTIVE");
            if (!active.isEmpty()) {
                targetOrgId = active.get(0).getId();
            }
        }

        Optional<Organization> orgOpt = organizationRepository.findById(targetOrgId != null ? targetOrgId : "");
        if (orgOpt.isEmpty() && targetOrgId != null) {
            orgOpt = organizationRepository.findBySlug(targetOrgId);
        }

        if (orgOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid organization specified."));
        }

        Organization org = orgOpt.get();
        complaint.setOrganizationId(org.getId());
        complaint.setOrganizationName(org.getName());
        complaint.setDomain(org.getType() != null ? org.getType() : "MUNICIPALITY");

        // Validate or compute SLA based on organization's category config
        long slaHours = 72;
        Optional<CategoryConfig> catConfigOpt = org.getCategories().stream()
                .filter(c -> c.getName().equalsIgnoreCase(complaint.getCategory().trim()))
                .findFirst();

        if (catConfigOpt.isPresent()) {
            CategoryConfig cc = catConfigOpt.get();
            if (cc.getSlaHours() > 0) slaHours = cc.getSlaHours();
            if (isBlank(complaint.getAssignedDepartment()) && cc.getDepartment() != null) {
                complaint.setAssignedDepartment(cc.getDepartment());
            }
            if (isBlank(complaint.getPriority())) {
                complaint.setPriority(cc.getDefaultPriority());
            }
        }

        if (isBlank(complaint.getPriority())) {
            complaint.setPriority("MEDIUM");
        }

        // Generate tracking ID: CMP-2026-XXXXXXXX
        complaint.setTrackingId(
                "CMP-" + Year.now().getValue() + "-"
                        + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        complaint.setStatus("SUBMITTED");
        LocalDateTime now = LocalDateTime.now();
        complaint.setCreatedAt(now);
        complaint.setUpdatedAt(now);
        complaint.setTargetResolutionDate(now.plusHours(slaHours));

        // Initial timeline entry
        complaint.getStatusHistory().add(new StatusHistoryItem(
                "SUBMITTED",
                "Grievance cataloged for " + org.getName() + ". Defined SLA: " + slaHours + " hours.",
                "Platform Triage"
        ));

        Complaint saved = repository.save(complaint);

        // Notify user if authenticated
        if (saved.getUserId() != null) {
            notificationRepository.save(new Notification(
                    saved.getOrganizationId(),
                    saved.getUserId(),
                    saved.getUserEmail(),
                    saved.getTrackingId(),
                    "Grievance Lodged (" + org.getName() + ")",
                    "Your grievance '" + saved.getTitle() + "' has been logged under ID " + saved.getTrackingId(),
                    "STATUS_UPDATE"
            ));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Public Tracking by Tracking Reference ID
    @GetMapping("/track/{trackingId}")
    public ResponseEntity<?> trackComplaint(@PathVariable String trackingId) {
        return repository.findByTrackingId(trackingId.trim())
                .<ResponseEntity<?>>map(c -> {
                    checkAndApplyEscalation(c);
                    return ResponseEntity.ok(c);
                })
                .orElseGet(() ->
                        ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(Map.of("message", "No complaint found with tracking ID: " + trackingId)));
    }

    // Get Complaints - Multi-Domain & Tenant Scoped
    @GetMapping
    public ResponseEntity<?> getAllComplaints(
            @RequestParam(required = false) String organizationId,
            @RequestParam(required = false) String domain,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String callerRole = null;
        String callerOrgId = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtService.validateToken(token)) {
                callerRole = jwtService.extractRole(token);
                callerOrgId = jwtService.extractOrganizationId(token);
            }
        }

        List<Complaint> list = repository.findAllByOrderByCreatedAtDesc();

        if ("ROLE_ORG_ADMIN".equalsIgnoreCase(callerRole) || "ROLE_OFFICER".equalsIgnoreCase(callerRole)) {
            String effectiveOrgId = callerOrgId != null ? callerOrgId : organizationId;
            if (effectiveOrgId != null && !effectiveOrgId.isBlank()) {
                list = list.stream().filter(c -> effectiveOrgId.equalsIgnoreCase(c.getOrganizationId())).toList();
            }
        } else {
            // Platform Admin (ROLE_ADMIN, ROLE_SUPER_ADMIN) or Citizens
            if (organizationId != null && !organizationId.isBlank() && !"ALL".equalsIgnoreCase(organizationId)) {
                list = list.stream().filter(c -> organizationId.equalsIgnoreCase(c.getOrganizationId())).toList();
            }
            if (domain != null && !domain.isBlank() && !"ALL".equalsIgnoreCase(domain)) {
                list = list.stream().filter(c -> domain.equalsIgnoreCase(c.getDomain())).toList();
            }
        }

        list.forEach(this::checkAndApplyEscalation);
        return ResponseEntity.ok(list);
    }

    // Citizen's personal grievances
    @GetMapping("/my")
    public ResponseEntity<?> getMyComplaints(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Authentication required."));
        }

        String token = authHeader.substring(7);
        if (!jwtService.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid or expired token."));
        }

        String email = jwtService.extractEmail(token);
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
        }

        User user = userOpt.get();
        List<Complaint> list = repository.findByUserId(user.getId());
        if (list.isEmpty()) {
            list = repository.findByUserEmail(user.getEmail());
        }
        list.forEach(this::checkAndApplyEscalation);

        return ResponseEntity.ok(list);
    }

    // Update Status & Remarks (Tenant Authorization Verified)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateComplaintStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String rawStatus = request.get("status");
        String remarks = request.get("adminRemarks");
        if (remarks == null || remarks.isBlank()) {
            remarks = request.get("remarks");
        }
        String priority = request.get("priority");

        if (rawStatus == null || rawStatus.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Status is required."));
        }

        String status = rawStatus.trim().toUpperCase().replace(" ", "_");

        Set<String> allowedStatuses = Set.of(
                "SUBMITTED",
                "PENDING",
                "ASSIGNED",
                "IN_PROGRESS",
                "RESOLVED",
                "CLOSED",
                "REJECTED",
                "REOPENED");

        if (!allowedStatuses.contains(status)) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Invalid status. Allowed: SUBMITTED, PENDING, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, REJECTED, REOPENED."));
        }

        Optional<Complaint> compOpt = repository.findById(id);
        if (compOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Complaint not found."));
        }

        Complaint complaint = compOpt.get();

        // Verify Authorization (Admin / Super Admin / Staff)
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtService.validateToken(token)) {
                String role = jwtService.extractRole(token);
                String orgId = jwtService.extractOrganizationId(token);

                if (!"ROLE_SUPER_ADMIN".equalsIgnoreCase(role) && !"ROLE_ADMIN".equalsIgnoreCase(role)) {
                    if (orgId != null && complaint.getOrganizationId() != null && !orgId.equals(complaint.getOrganizationId())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("message", "Cross-tenant access forbidden. You cannot modify complaints outside your organization."));
                    }
                }
            }
        }

        complaint.setStatus(status);
        if (remarks != null && !remarks.isBlank()) {
            complaint.setAdminRemarks(remarks.trim());
        }
        if (priority != null && !priority.isBlank()) {
            complaint.setPriority(priority.trim().toUpperCase());
        }
        complaint.setUpdatedAt(LocalDateTime.now());

        String displayStatus = status.replace("_", " ");
        complaint.getStatusHistory().add(new StatusHistoryItem(
                status,
                remarks != null && !remarks.isBlank() ? remarks : "Status updated to " + displayStatus,
                "Authorized Administration"
        ));

        Complaint updated = repository.save(complaint);

        // Notify citizen
        if (updated.getUserId() != null || updated.getUserEmail() != null) {
            notificationRepository.save(new Notification(
                    updated.getOrganizationId(),
                    updated.getUserId(),
                    updated.getUserEmail(),
                    updated.getTrackingId(),
                    "Status Update: " + displayStatus,
                    "Your grievance #" + updated.getTrackingId() + " status is now " + displayStatus + "." + (remarks != null && !remarks.isBlank() ? " Note: " + remarks : ""),
                    "STATUS_UPDATE"
            ));
        }

        return ResponseEntity.ok(updated);
    }

    // Assign Department & Officer (Tenant Verified)
    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assignComplaint(
            @PathVariable String id,
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String department = request.get("department");
        String officer = request.get("officer");
        String description = request.get("description");
        if (description == null || description.isBlank()) {
            description = request.get("remarks");
        }
        String customStatus = request.get("status");

        if (isBlank(department)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Department is required for assignment."));
        }

        Optional<Complaint> compOpt = repository.findById(id);
        if (compOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Complaint not found."));
        }

        Complaint complaint = compOpt.get();

        // Verify Tenant Authorization
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtService.validateToken(token)) {
                String role = jwtService.extractRole(token);
                String orgId = jwtService.extractOrganizationId(token);

                if (!"ROLE_SUPER_ADMIN".equalsIgnoreCase(role) && !"ROLE_ADMIN".equalsIgnoreCase(role)) {
                    if (orgId != null && complaint.getOrganizationId() != null && !orgId.equals(complaint.getOrganizationId())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("message", "Cross-tenant assignment forbidden."));
                    }
                }
            }
        }

        complaint.setAssignedDepartment(department.trim());
        if (officer != null && !officer.isBlank()) {
            complaint.setAssignedOfficer(officer.trim());
        }

        String nextStatus = "ASSIGNED";
        if (customStatus != null && !customStatus.isBlank()) {
            nextStatus = customStatus.trim().toUpperCase().replace(" ", "_");
        }
        complaint.setStatus(nextStatus);

        if (description != null && !description.isBlank()) {
            complaint.setAdminRemarks(description.trim());
        }
        complaint.setUpdatedAt(LocalDateTime.now());

        String officerLabel = (officer != null && !officer.isBlank()) ? " (Assigned Officer: " + officer + ")" : "";
        String remarksText = (description != null && !description.isBlank()) ? " | Notes: " + description : "";
        String msg = "Assigned to " + department + officerLabel + remarksText;

        complaint.getStatusHistory().add(new StatusHistoryItem(
                complaint.getStatus(),
                msg,
                "Administration"
        ));

        Complaint updated = repository.save(complaint);

        if (updated.getUserId() != null || updated.getUserEmail() != null) {
            notificationRepository.save(new Notification(
                    updated.getOrganizationId(),
                    updated.getUserId(),
                    updated.getUserEmail(),
                    updated.getTrackingId(),
                    "Grievance Assigned to " + department,
                    "Your complaint #" + updated.getTrackingId() + " has been assigned to " + department + officerLabel + "." + (description != null ? " Details: " + description : ""),
                    "ASSIGNMENT"
            ));
        }

        return ResponseEntity.ok(updated);
    }

    // Citizen Feedback / CSAT Rating
    @PutMapping("/{id}/feedback")
    public ResponseEntity<?> submitFeedback(
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {

        Object ratingObj = request.get("rating");
        String feedback = (String) request.get("feedback");

        if (ratingObj == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Rating is required (1-5 stars)."));
        }

        int rating = Integer.parseInt(ratingObj.toString());
        if (rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body(Map.of("message", "Rating must be between 1 and 5."));
        }

        return repository.findById(id)
                .<ResponseEntity<?>>map(complaint -> {
                    complaint.setRating(rating);
                    if (feedback != null) complaint.setFeedback(feedback.trim());
                    complaint.setFeedbackSubmittedAt(LocalDateTime.now());

                    complaint.getStatusHistory().add(new StatusHistoryItem(
                            complaint.getStatus(),
                            "User submitted resolution feedback (" + rating + "★): " + (feedback != null ? feedback : "No comment"),
                            "User"
                    ));

                    Complaint updated = repository.save(complaint);
                    return ResponseEntity.ok(Map.of("message", "Thank you for your feedback!", "complaint", updated));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Complaint not found.")));
    }

    // Reopen Grievance
    @PutMapping("/{id}/reopen")
    public ResponseEntity<?> reopenComplaint(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {

        String reason = request.get("reason");
        if (isBlank(reason)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please specify a reason for reopening."));
        }

        return repository.findById(id)
                .<ResponseEntity<?>>map(complaint -> {
                    if (!"RESOLVED".equalsIgnoreCase(complaint.getStatus()) && !"REJECTED".equalsIgnoreCase(complaint.getStatus())) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Only resolved or closed complaints can be reopened."));
                    }

                    complaint.setStatus("REOPENED");
                    complaint.setReopenCount(complaint.getReopenCount() + 1);
                    complaint.setReopenedReason(reason.trim());
                    complaint.setUpdatedAt(LocalDateTime.now());
                    complaint.setEscalated(true);
                    complaint.setEscalationReason("User Reopened: " + reason.trim());

                    complaint.getStatusHistory().add(new StatusHistoryItem(
                            "REOPENED",
                            "Citizen disputed resolution and reopened case. Reason: " + reason.trim(),
                            "Citizen"
                    ));

                    Complaint updated = repository.save(complaint);

                    if (updated.getUserId() != null) {
                        notificationRepository.save(new Notification(
                                updated.getOrganizationId(),
                                updated.getUserId(),
                                updated.getUserEmail(),
                                updated.getTrackingId(),
                                "Complaint Reopened",
                                "Complaint #" + updated.getTrackingId() + " has been escalated to supervisor queue.",
                                "ESCALATION"
                        ));
                    }

                    return ResponseEntity.ok(Map.of("message", "Complaint successfully reopened and escalated.", "complaint", updated));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Complaint not found.")));
    }

    // Multi-Tenant Analytics & Reports
    @GetMapping("/analytics")
    public Map<String, Object> getAnalytics(
            @RequestParam(required = false) String organizationId,
            @RequestParam(required = false) String domain,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String callerRole = null;
        String callerOrgId = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtService.validateToken(token)) {
                callerRole = jwtService.extractRole(token);
                callerOrgId = jwtService.extractOrganizationId(token);
            }
        }

        List<Complaint> all = repository.findAll();

        if ("ROLE_ORG_ADMIN".equalsIgnoreCase(callerRole) || "ROLE_OFFICER".equalsIgnoreCase(callerRole)) {
            String effectiveOrgId = callerOrgId != null ? callerOrgId : organizationId;
            if (effectiveOrgId != null && !effectiveOrgId.isBlank()) {
                all = all.stream().filter(c -> effectiveOrgId.equalsIgnoreCase(c.getOrganizationId())).toList();
            }
        } else {
            // Platform Admin (ROLE_ADMIN, ROLE_SUPER_ADMIN)
            if (organizationId != null && !organizationId.isBlank() && !"ALL".equalsIgnoreCase(organizationId)) {
                all = all.stream().filter(c -> organizationId.equalsIgnoreCase(c.getOrganizationId())).toList();
            }
            if (domain != null && !domain.isBlank() && !"ALL".equalsIgnoreCase(domain)) {
                all = all.stream().filter(c -> domain.equalsIgnoreCase(c.getDomain())).toList();
            }
        }

        all.forEach(this::checkAndApplyEscalation);

        long total = all.size();
        long submitted = all.stream().filter(c -> "SUBMITTED".equalsIgnoreCase(c.getStatus())).count();
        long pending = all.stream().filter(c -> "PENDING".equalsIgnoreCase(c.getStatus()) || "SUBMITTED".equalsIgnoreCase(c.getStatus())).count();
        long assigned = all.stream().filter(c -> "ASSIGNED".equalsIgnoreCase(c.getStatus())).count();
        long inProgress = all.stream().filter(c -> "IN_PROGRESS".equalsIgnoreCase(c.getStatus())).count();
        long resolved = all.stream().filter(c -> "RESOLVED".equalsIgnoreCase(c.getStatus())).count();
        long closed = all.stream().filter(c -> "CLOSED".equalsIgnoreCase(c.getStatus())).count();
        long rejected = all.stream().filter(c -> "REJECTED".equalsIgnoreCase(c.getStatus())).count();
        long reopened = all.stream().filter(c -> "REOPENED".equalsIgnoreCase(c.getStatus())).count();
        long totalCitizens = userRepository.countByRole("ROLE_USER");

        LocalDateTime now = LocalDateTime.now();
        long overdue = all.stream()
                .filter(c -> !"RESOLVED".equalsIgnoreCase(c.getStatus()) && !"CLOSED".equalsIgnoreCase(c.getStatus()) && !"REJECTED".equalsIgnoreCase(c.getStatus()))
                .filter(c -> c.getTargetResolutionDate() != null && c.getTargetResolutionDate().isBefore(now))
                .count();

        long escalated = all.stream().filter(Complaint::isEscalated).count();

        Map<String, Long> byDepartment = all.stream()
                .filter(c -> c.getAssignedDepartment() != null && !c.getAssignedDepartment().isBlank())
                .collect(Collectors.groupingBy(Complaint::getAssignedDepartment, Collectors.counting()));

        Map<String, Long> byCategory = all.stream()
                .filter(c -> c.getCategory() != null)
                .collect(Collectors.groupingBy(Complaint::getCategory, Collectors.counting()));

        Map<String, Long> byPriority = all.stream()
                .filter(c -> c.getPriority() != null)
                .collect(Collectors.groupingBy(Complaint::getPriority, Collectors.counting()));

        Map<String, Long> monthlyStats = all.stream()
                .filter(c -> c.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        c -> c.getCreatedAt().getMonth().name().substring(0, 3) + " " + c.getCreatedAt().getYear(),
                        LinkedHashMap::new,
                        Collectors.counting()
                ));

        Double avgRating = all.stream()
                .filter(c -> c.getRating() != null && c.getRating() > 0)
                .mapToInt(Complaint::getRating)
                .average()
                .orElse(0.0);

        Double avgResolutionHours = all.stream()
                .filter(c -> "RESOLVED".equalsIgnoreCase(c.getStatus()) && c.getCreatedAt() != null && c.getUpdatedAt() != null)
                .mapToLong(c -> Duration.between(c.getCreatedAt(), c.getUpdatedAt()).toHours())
                .average()
                .orElse(0.0);

        Map<String, Long> byDomain = all.stream()
                .filter(c -> c.getDomain() != null && !c.getDomain().isBlank())
                .collect(Collectors.groupingBy(Complaint::getDomain, Collectors.counting()));

        Map<String, Long> byOrganization = all.stream()
                .filter(c -> c.getOrganizationName() != null && !c.getOrganizationName().isBlank())
                .collect(Collectors.groupingBy(Complaint::getOrganizationName, Collectors.counting()));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("total", total);
        data.put("submitted", submitted);
        data.put("pending", pending);
        data.put("assigned", assigned);
        data.put("inProgress", inProgress);
        data.put("resolved", resolved);
        data.put("closed", closed);
        data.put("rejected", rejected);
        data.put("reopened", reopened);
        data.put("overdue", overdue);
        data.put("escalated", escalated);
        data.put("totalCitizens", totalCitizens);
        data.put("avgRating", Math.round(avgRating * 10.0) / 10.0);
        data.put("avgResolutionHours", Math.round(avgResolutionHours * 10.0) / 10.0);
        data.put("byDepartment", byDepartment);
        data.put("byCategory", byCategory);
        data.put("byPriority", byPriority);
        data.put("byDomain", byDomain);
        data.put("byOrganization", byOrganization);
        data.put("monthlyStats", monthlyStats);
        data.put("organizationId", organizationId);
        data.put("domain", domain);

        return data;
    }

    // Citizen Feedbacks & CSAT Review (Admin Functionality)
    @GetMapping("/feedbacks")
    public List<Complaint> getAllFeedbacks() {
        return repository.findAll().stream()
                .filter(c -> c.getRating() != null && c.getRating() > 0)
                .sorted((a, b) -> {
                    if (a.getFeedbackSubmittedAt() != null && b.getFeedbackSubmittedAt() != null) {
                        return b.getFeedbackSubmittedAt().compareTo(a.getFeedbackSubmittedAt());
                    }
                    return 0;
                })
                .collect(Collectors.toList());
    }

    // Delete Complaint
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComplaint(@PathVariable String id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Complaint not found."));
        }
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Complaint successfully deleted."));
    }

    // Diagnostic endpoint
    @GetMapping("/debug/database")
    public Map<String, Object> checkDatabase() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("databaseName", mongoTemplate.getDb().getName());
        result.put("collections", mongoTemplate.getCollectionNames());
        result.put("organizationCount", organizationRepository.count());
        result.put("repositoryComplaintCount", repository.count());
        result.put("directComplaintCount", mongoTemplate.getCollection("complaints").countDocuments());
        result.put("userCount", userRepository.count());
        result.put("notificationCount", notificationRepository.count());
        return result;
    }

    private void checkAndApplyEscalation(Complaint c) {
        if (!"RESOLVED".equalsIgnoreCase(c.getStatus()) && !"REJECTED".equalsIgnoreCase(c.getStatus())) {
            if (c.getTargetResolutionDate() != null && c.getTargetResolutionDate().isBefore(LocalDateTime.now())) {
                if (!c.isEscalated()) {
                    c.setEscalated(true);
                    c.setEscalationReason("Target SLA breached (" + c.getPriority() + " priority). Automatically escalated.");
                    repository.save(c);
                }
            }
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
