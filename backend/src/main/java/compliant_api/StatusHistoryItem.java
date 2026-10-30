package compliant_api;

import java.time.LocalDateTime;

public class StatusHistoryItem {
    private String status;
    private String remarks;
    private String updatedBy;
    private LocalDateTime timestamp;

    public StatusHistoryItem() {
    }

    public StatusHistoryItem(String status, String remarks, String updatedBy) {
        this.status = status;
        this.remarks = remarks;
        this.updatedBy = updatedBy;
        this.timestamp = LocalDateTime.now();
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
