package compliant_api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"})
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public NotificationController(
            NotificationRepository notificationRepository,
            JwtService jwtService,
            UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getMyNotifications(
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
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        if (notifications.isEmpty()) {
            notifications = notificationRepository.findByUserEmailOrderByCreatedAtDesc(user.getEmail());
        }

        long unreadCount = notifications.stream().filter(n -> !n.isRead()).count();

        return ResponseEntity.ok(Map.of(
                "notifications", notifications,
                "unreadCount", unreadCount
        ));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        return notificationRepository.findById(id)
                .<ResponseEntity<?>>map(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                    return ResponseEntity.ok(Map.of("message", "Marked as read."));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Notification not found.")));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Authentication required."));
        }

        String token = authHeader.substring(7);
        if (!jwtService.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid token."));
        }

        String email = jwtService.extractEmail(token);
        userRepository.findByEmail(email).ifPresent(user -> {
            List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
            list.forEach(n -> n.setRead(true));
            notificationRepository.saveAll(list);
        });

        return ResponseEntity.ok(Map.of("message", "All notifications marked as read."));
    }

    // Admin Send Notification / Announcement to Citizen(s)
    @PostMapping
    public ResponseEntity<?> sendNotification(@RequestBody Map<String, String> request) {
        String title = request.get("title");
        String message = request.get("message");
        String recipientId = request.get("userId"); // specific user ID or "ALL"
        String type = request.get("type") != null ? request.get("type") : "ANNOUNCEMENT";

        if (title == null || title.isBlank() || message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Title and message are required."));
        }

        if (recipientId == null || recipientId.isBlank() || "ALL".equalsIgnoreCase(recipientId)) {
            // Broadcast to all registered citizens
            List<User> citizens = userRepository.findByRoleOrderByCreatedAtDesc("ROLE_USER");
            for (User c : citizens) {
                notificationRepository.save(new Notification(
                        c.getOrganizationId(),
                        c.getId(),
                        c.getEmail(),
                        null,
                        title.trim(),
                        message.trim(),
                        type
                ));
            }
            return ResponseEntity.ok(Map.of("message", "Broadcast sent to " + citizens.size() + " citizens successfully."));
        } else {
            Optional<User> recipientOpt = userRepository.findById(recipientId);
            if (recipientOpt.isEmpty()) {
                recipientOpt = userRepository.findByEmail(recipientId);
            }
            if (recipientOpt.isPresent()) {
                User c = recipientOpt.get();
                Notification n = notificationRepository.save(new Notification(
                        c.getOrganizationId(),
                        c.getId(),
                        c.getEmail(),
                        request.get("complaintTrackingId"),
                        title.trim(),
                        message.trim(),
                        type
                ));
                return ResponseEntity.ok(Map.of("message", "Notification sent successfully to " + c.getName(), "notification", n));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Recipient citizen not found."));
        }
    }
}
