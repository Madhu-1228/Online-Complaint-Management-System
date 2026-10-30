package compliant_api;

public class DepartmentConfig {
    private String name;
    private String headOfficer;
    private String contactEmail;
    private String contactPhone;

    public DepartmentConfig() {
    }

    public DepartmentConfig(String name, String headOfficer, String contactEmail, String contactPhone) {
        this.name = name;
        this.headOfficer = headOfficer;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getHeadOfficer() {
        return headOfficer;
    }

    public void setHeadOfficer(String headOfficer) {
        this.headOfficer = headOfficer;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }
}
