package compliant_api;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    private String organizationId;
    private String userId;
    private String userEmail;
    private String complaintTrackingId;
    private String title;
    private String message;
    private String type; // STATUS_UPDATE, ASSIGNMENT, RESOLUTION, ESCALATION
    private boolean isRead = false;
    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification() {
    }

    public Notification(String organizationId, String userId, String userEmail, String complaintTrackingId, String title, String message, String type) {
        this.organizationId = organizationId;
        this.userId = userId;
        this.userEmail = userEmail;
        this.complaintTrackingId = complaintTrackingId;
        this.title = title;
        this.message = message;
        this.type = type;
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getComplaintTrackingId() {
        return complaintTrackingId;
    }

    public void setComplaintTrackingId(String complaintTrackingId) {
        this.complaintTrackingId = complaintTrackingId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
