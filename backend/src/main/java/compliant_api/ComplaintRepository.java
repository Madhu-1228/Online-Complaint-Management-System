package compliant_api;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface ComplaintRepository extends MongoRepository<Complaint, String> {
    Optional<Complaint> findByTrackingId(String trackingId);
    List<Complaint> findByUserId(String userId);
    List<Complaint> findByUserEmail(String userEmail);
    List<Complaint> findAllByOrderByCreatedAtDesc();

    // Multi-tenant scoped queries
    List<Complaint> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);
    List<Complaint> findByOrganizationIdAndUserIdOrderByCreatedAtDesc(String organizationId, String userId);
    List<Complaint> findByOrganizationIdAndUserEmailOrderByCreatedAtDesc(String organizationId, String userEmail);
    List<Complaint> findByOrganizationIdAndAssignedOfficerOrderByCreatedAtDesc(String organizationId, String officer);
    List<Complaint> findByOrganizationIdAndAssignedDepartmentOrderByCreatedAtDesc(String organizationId, String department);
    List<Complaint> findByOrganizationIdAndStatusOrderByCreatedAtDesc(String organizationId, String status);
    List<Complaint> findByDomainOrderByCreatedAtDesc(String domain);
    long countByOrganizationId(String organizationId);
}
