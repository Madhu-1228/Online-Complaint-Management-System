package compliant_api;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "organizations")
public class Organization {

    @Id
    private String id;

    @Indexed(unique = true)
    private String slug;

    private String name;
    private String type; // COLLEGE, MUNICIPALITY, CORPORATE, HEALTHCARE, RESIDENTIAL, OTHER
    private String description;
    private String contactEmail;
    private String contactPhone;
    private String address;
    private String status; // ACTIVE, PENDING, SUSPENDED

    private List<DepartmentConfig> departments = new ArrayList<>();
    private List<CategoryConfig> categories = new ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Organization() {
    }

    public Organization(String slug, String name, String type, String description, String contactEmail, String contactPhone, String address) {
        this.slug = slug;
        this.name = name;
        this.type = type;
        this.description = description;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
        this.address = address;
        this.status = "ACTIVE";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<DepartmentConfig> getDepartments() {
        if (departments == null) departments = new ArrayList<>();
        return departments;
    }

    public void setDepartments(List<DepartmentConfig> departments) {
        this.departments = departments;
    }

    public List<CategoryConfig> getCategories() {
        if (categories == null) categories = new ArrayList<>();
        return categories;
    }

    public void setCategories(List<CategoryConfig> categories) {
        this.categories = categories;
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
