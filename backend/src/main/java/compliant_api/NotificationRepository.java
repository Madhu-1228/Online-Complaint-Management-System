package compliant_api;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Notification> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    long countByUserIdAndIsReadFalse(String userId);
    long countByUserEmailAndIsReadFalse(String userEmail);
}
