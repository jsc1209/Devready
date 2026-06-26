package com.devready.backend_user.common.jwt;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * "Authorization: Bearer xxx" 헤더에서 member_id 를 추출한다.
 * 검증은 auth 도메인이 토큰을 발급할 때 쓴 {@link JwtProvider} 를 그대로 재사용한다.
 * (동일 비밀키·동일 서명 알고리즘·동일 클레임 구조 — 새 키/알고리즘 도입 없음.)
 */
@Component
@RequiredArgsConstructor
public class JwtAuthUtil {

    private final JwtProvider jwtProvider;

    private static final String BEARER_PREFIX = "Bearer ";

    /**
     * 헤더 → member_id.
     * 헤더가 없거나 형식이 틀리거나 토큰 검증(서명·만료)에 실패하면 null 을 돌려준다(비로그인 취급).
     */
    public Long resolveMemberId(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            return null;
        }
        String token = authorizationHeader.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty()) {
            return null;
        }
        try {
            return jwtProvider.getMemberId(token);
        } catch (Exception e) {
            // 위조·만료·파싱 실패 → 비로그인으로 처리(상위 컨트롤러에서 401)
            return null;
        }
    }
}
