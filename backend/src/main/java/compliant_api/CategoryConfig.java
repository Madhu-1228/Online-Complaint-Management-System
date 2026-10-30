package compliant_api;

public class CategoryConfig {
    private String name;
    private String icon;
    private String defaultPriority; // LOW, MEDIUM, HIGH, URGENT
    private int slaHours; // e.g. 24, 48, 72
    private String department;

    public CategoryConfig() {
    }

    public CategoryConfig(String name, String icon, String defaultPriority, int slaHours, String department) {
        this.name = name;
        this.icon = icon;
        this.defaultPriority = defaultPriority;
        this.slaHours = slaHours;
        this.department = department;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getDefaultPriority() {
        return defaultPriority;
    }

    public void setDefaultPriority(String defaultPriority) {
        this.defaultPriority = defaultPriority;
    }

    public int getSlaHours() {
        return slaHours;
    }

    public void setSlaHours(int slaHours) {
        this.slaHours = slaHours;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }
}
