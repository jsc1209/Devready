package com.devready.backend_user.auth.service;
import com.devready.backend_user.auth.mapper.AuthMapper;
import com.devready.backend_user.auth.vo.LoginRequest;
import com.devready.backend_user.auth.vo.MemberVO;
import com.devready.backend_user.auth.vo.SignupRequest;
import com.devready.backend_user.common.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.LinkedHashMap;
import java.util.Map;
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final AuthMapper authMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    @Override
    public Long signup(SignupRequest req) {
        if (req.getEmail() == null || req.getEmail().isBlank()
                || req.getPassword() == null || req.getPassword().length() < 4) {
            throw new IllegalArgumentException("이메일과 4자 이상 비밀번호를 입력하세요.");
        }
        if (authMapper.countByEmail(req.getEmail()) > 0) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }
        String localPart = req.getEmail().split("@")[0];
        String uniqueSuffix = String.valueOf(System.currentTimeMillis()).substring(7);
        MemberVO m = new MemberVO();
        m.setEmail(req.getEmail());
        m.setPassword(passwordEncoder.encode(req.getPassword()));
        m.setName(localPart);
        m.setNickname(localPart + uniqueSuffix);          // nickname UNIQUE 회피
        m.setPhone("000-0000-" + uniqueSuffix);           // phone UNIQUE 회피(임시)
        authMapper.insertMember(m);
        return m.getMemberId();
    }

    @Override
    public Map<String, Object> login(LoginRequest req) {
        MemberVO m = authMapper.findByEmail(req.getEmail());
        if (m == null || !passwordEncoder.matches(req.getPassword(), m.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        String token = jwtProvider.createAccessToken(m.getMemberId(), m.getEmail());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("accessToken", token);
        result.put("memberId", m.getMemberId());
        result.put("email", m.getEmail());
        result.put("nickname", m.getNickname());
        return result;
    }
}
