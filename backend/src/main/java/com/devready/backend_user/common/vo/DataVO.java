package com.devready.backend_user.common.vo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class DataVO {
    private boolean success;
    private String message;
    private Object data;
    public static DataVO ok(Object data) { return new DataVO(true, "OK", data); }
    public static DataVO ok(String message, Object data) { return new DataVO(true, message, data); }
    public static DataVO fail(String message) { return new DataVO(false, message, null); }
}
