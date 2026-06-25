package com.devready.backend_user.auth.service;
import com.devready.backend_user.auth.vo.LoginRequest;
import com.devready.backend_user.auth.vo.SignupRequest;
import java.util.Map;
public interface AuthService {
    Long signup(SignupRequest req);
    Map<String, Object> login(LoginRequest req);
}
