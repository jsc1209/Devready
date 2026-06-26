package com.devready.backend_user.auth.controller;

import com.devready.backend_user.auth.mapper.AuthMapper;
import com.devready.backend_user.auth.vo.MemberVO;
import com.devready.backend_user.common.jwt.LoginMember;
import com.devready.backend_user.common.vo.DataVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 현재 로그인 회원 조회. "토큰 → member_id" 배선의 첫 사용처이자
 * 마이페이지 기본정보 조회에 재사용된다. 민감정보(비밀번호 해시)는 반환하지 않는다.
 */
@RestController
@RequiredArgsConstructor
public class MeController {

    private final AuthMapper authMapper;

    @GetMapping("/api/me")
    public ResponseEntity<DataVO> me(@LoginMember Long memberId) {
        if (memberId == null) {
            return ResponseEntity.status(401).body(DataVO.fail("로그인이 필요합니다."));
        }
        MemberVO m = authMapper.findById(memberId);
        if (m == null) {
            return ResponseEntity.status(404).body(DataVO.fail("회원을 찾을 수 없습니다."));
        }
        // password 는 findById 쿼리에서 조회하지 않으며, 응답 맵에도 담지 않는다.
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("memberId", m.getMemberId());
        body.put("email", m.getEmail());
        body.put("name", m.getName());
        body.put("phone", m.getPhone());
        body.put("nickname", m.getNickname());
        body.put("role", m.getRole());
        body.put("status", m.getStatus());
        return ResponseEntity.ok(DataVO.ok(body));
    }
}
