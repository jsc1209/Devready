package com.devready.backend_user.auth.controller;
import com.devready.backend_user.auth.service.AuthService;
import com.devready.backend_user.auth.vo.LoginRequest;
import com.devready.backend_user.auth.vo.SignupRequest;
import com.devready.backend_user.common.vo.DataVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/signup")
    public DataVO signup(@RequestBody SignupRequest req) {
        Long memberId = authService.signup(req);
        return DataVO.ok("회원가입 완료", Map.of("memberId", memberId));
    }

    @PostMapping("/login")
    public DataVO login(@RequestBody LoginRequest req) {
        return DataVO.ok("로그인 성공", authService.login(req));
    }
}
