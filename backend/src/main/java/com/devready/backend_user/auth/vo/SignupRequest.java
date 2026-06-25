package com.devready.backend_user.auth.vo;
import lombok.Getter; import lombok.Setter;
@Getter @Setter
public class SignupRequest {
    private String email;
    private String password;
}
