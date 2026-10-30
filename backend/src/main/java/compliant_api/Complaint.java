package compliant_api;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "complaints")
public class Complaint {

    @Id
    private String id;

    private String trackingId;
    private String title;
    private String category;
    private String location;
    private String description;
    private String status; // SUBMITTED, IN_PROGRESS, RESOLVED, REJECTED, REOPENED
    private String priority; // LOW, MEDIUM, HIGH, URGENT

    // Multi-tenant affiliation
    private String organizationId;
    private String organizationName;
    private String domain; // MUNICIPALITY, COLLEGE, CORPORATE, HEALTHCARE, TRANSPORT, RESIDENTIAL

    // Citizen Association
    private String userId;
    private String userName;
    private String userEmail;

    // Department Assignment & SLA Escalation
    private String assignedDepartment;
    private String assignedOfficer;
    private LocalDateTime targetResolutionDate;
    private boolean isEscalated;
    private String escalationReason;

    // Timeline History
    private List<StatusHistoryItem> statusHistory = new ArrayList<>();

    // Evidence Attachment
    private String attachmentName;
    private String attachmentData; // Base64 or image data URI

    // Post-Resolution Feedback & CSAT
    private Integer rating; // 1 to 5 stars
    private String feedback;
    private LocalDateTime feedbackSubmittedAt;

    // Reopening Support
    private int reopenCount = 0;
    private String reopenedReason;

    // General Remarks and Timestamps
    private String adminRemarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Complaint() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTrackingId() {
        return trackingId;
    }

    public void setTrackingId(String trackingId) {
        this.trackingId = trackingId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getAssignedDepartment() {
        return assignedDepartment;
    }

    public void setAssignedDepartment(String assignedDepartment) {
        this.assignedDepartment = assignedDepartment;
    }

    public String getAssignedOfficer() {
        return assignedOfficer;
    }

    public void setAssignedOfficer(String assignedOfficer) {
        this.assignedOfficer = assignedOfficer;
    }

    public LocalDateTime getTargetResolutionDate() {
        return targetResolutionDate;
    }

    public void setTargetResolutionDate(LocalDateTime targetResolutionDate) {
        this.targetResolutionDate = targetResolutionDate;
    }

    public boolean isEscalated() {
        return isEscalated;
    }

    public void setEscalated(boolean escalated) {
        isEscalated = escalated;
    }

    public String getEscalationReason() {
        return escalationReason;
    }

    public void setEscalationReason(String escalationReason) {
        this.escalationReason = escalationReason;
    }

    public List<StatusHistoryItem> getStatusHistory() {
        if (statusHistory == null) {
            statusHistory = new ArrayList<>();
        }
        return statusHistory;
    }

    public void setStatusHistory(List<StatusHistoryItem> statusHistory) {
        this.statusHistory = statusHistory;
    }

    public String getAttachmentName() {
        return attachmentName;
    }

    public void setAttachmentName(String attachmentName) {
        this.attachmentName = attachmentName;
    }

    public String getAttachmentData() {
        return attachmentData;
    }

    public void setAttachmentData(String attachmentData) {
        this.attachmentData = attachmentData;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public LocalDateTime getFeedbackSubmittedAt() {
        return feedbackSubmittedAt;
    }

    public void setFeedbackSubmittedAt(LocalDateTime feedbackSubmittedAt) {
        this.feedbackSubmittedAt = feedbackSubmittedAt;
    }

    public int getReopenCount() {
        return reopenCount;
    }

    public void setReopenCount(int reopenCount) {
        this.reopenCount = reopenCount;
    }

    public String getReopenedReason() {
        return reopenedReason;
    }

    public void setReopenedReason(String reopenedReason) {
        this.reopenedReason = reopenedReason;
    }

    public String getAdminRemarks() {
        return adminRemarks;
    }

    public void setAdminRemarks(String adminRemarks) {
        this.adminRemarks = adminRemarks;
    }

    public String getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public String getDomain() {
        return domain;
    }

    public void setDomain(String domain) {
        this.domain = domain;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
