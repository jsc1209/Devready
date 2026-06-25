package com.devready.backend_user.common.exception;
import com.devready.backend_user.common.vo.DataVO;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public DataVO handleBadRequest(IllegalArgumentException e) {
        return DataVO.fail(e.getMessage());
    }
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public DataVO handleServer(Exception e) {
        return DataVO.fail("서버 오류: " + e.getMessage());
    }
}
