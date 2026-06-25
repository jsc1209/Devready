package com.devready.backend_user.common.jwt;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
@Component
public class JwtProvider {
    private final SecretKey key;
    private final long accessExp;
    public JwtProvider(@Value("${jwt.secret}") String secret,
                       @Value("${jwt.access-expiration}") long accessExp) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExp = accessExp;
    }
    public String createAccessToken(Long memberId, String email) {
        Date now = new Date();
        return Jwts.builder()
            .subject(String.valueOf(memberId))
            .claim("email", email)
            .issuedAt(now)
            .expiration(new Date(now.getTime() + accessExp))
            .signWith(key)
            .compact();
    }
    public Long getMemberId(String token) {
        return Long.valueOf(
            Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload().getSubject());
    }
}
