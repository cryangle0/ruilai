package com.ruilai.common.web;

import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BizException.class)
    public R<Void> handleBiz(BizException e, HttpServletResponse response) {
        log.info("biz reject: code={} msg={}", e.getErrCode().getCode(), e.getMessage());
        return fail(e.getErrCode(), e.getMessage(), response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public R<Void> handleValid(MethodArgumentNotValidException e, HttpServletResponse response) {
        FieldError fieldError = e.getBindingResult().getFieldError();
        String msg = fieldError == null ? ErrCode.BAD_REQUEST.getDefaultMessage() : fieldError.getDefaultMessage();
        return fail(ErrCode.BAD_REQUEST, msg, response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public R<Void> handleUnreadable(HttpMessageNotReadableException e, HttpServletResponse response) {
        return fail(ErrCode.BAD_REQUEST, "请求体格式错误", response);
    }

    @ExceptionHandler(AuthenticationException.class)
    public R<Void> handleAuth(AuthenticationException e, HttpServletResponse response) {
        return fail(ErrCode.UNAUTHORIZED, null, response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public R<Void> handleDenied(AccessDeniedException e, HttpServletResponse response) {
        return fail(ErrCode.FORBIDDEN, null, response);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public R<Void> handleNotFound(NoResourceFoundException e, HttpServletResponse response) {
        return fail(ErrCode.NOT_FOUND, null, response);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public R<Void> handleTypeMismatch(MethodArgumentTypeMismatchException e, HttpServletResponse response) {
        return fail(ErrCode.BAD_REQUEST, null, response);
    }

    @ExceptionHandler(Exception.class)
    public R<Void> handleUnknown(Exception e, HttpServletResponse response) {
        log.error("unhandled exception", e);
        return fail(ErrCode.INTERNAL_ERROR, null, response);
    }

    private R<Void> fail(ErrCode errCode, String message, HttpServletResponse response) {
        if (errCode.getCode() < 1000) {
            response.setStatus(errCode.getCode());
        }
        return R.fail(errCode, message == null ? errCode.getDefaultMessage() : message);
    }
}
