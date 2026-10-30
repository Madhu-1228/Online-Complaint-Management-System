package compliant_api;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface OrganizationRepository extends MongoRepository<Organization, String> {
    Optional<Organization> findBySlug(String slug);
    List<Organization> findByStatus(String status);
    boolean existsBySlug(String slug);
    List<Organization> findByType(String type);
}
