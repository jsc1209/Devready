package com.devready.backend_user.common;
import com.devready.backend_user.common.vo.DataVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import javax.sql.DataSource;
import java.sql.Connection;
import java.util.LinkedHashMap;
import java.util.Map;
@RestController
@RequiredArgsConstructor
public class HealthController {
    private final DataSource dataSource;
    @GetMapping("/health")
    public DataVO health() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("app", "backend_user");
        try (Connection conn = dataSource.getConnection()) {
            info.put("db", conn.isValid(2) ? "connected" : "invalid");
            info.put("database", conn.getCatalog());
        } catch (Exception e) {
            info.put("db", "error: " + e.getMessage());
        }
        return DataVO.ok(info);
    }
}
