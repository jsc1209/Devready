package com.devready.backend_user.auth.vo;
import lombok.Getter; import lombok.Setter;
@Getter @Setter
public class MemberVO {
    private Long memberId;
    private String email;
    private String password;
    private String name;
    private String phone;
    private String nickname;
    private String role;
    private String status;
}
