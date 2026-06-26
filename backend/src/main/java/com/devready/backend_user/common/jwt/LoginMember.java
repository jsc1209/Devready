package com.devready.backend_user.common.jwt;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 컨트롤러 파라미터에 현재 로그인 회원의 member_id 를 주입한다.
 * 예) public DataVO me(@LoginMember Long memberId)
 * 토큰이 없거나 유효하지 않으면 null 이 주입된다(상위에서 401 처리).
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface LoginMember {
}
