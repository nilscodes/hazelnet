package io.hazelnet.external.controllers

import io.hazelnet.external.data.NoWalletsExposedException
import io.hazelnet.shared.data.ApiErrorResponse
import org.springframework.core.annotation.Order
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.ResponseStatus

@ControllerAdvice
@Order(-10)
class ApiExceptionHandler {
    @ExceptionHandler(NoSuchElementException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ResponseBody
    fun processObjectNotFoundError(ex: NoSuchElementException): ApiErrorResponse {
        return ApiErrorResponse(ex.message ?: "", HttpStatus.NOT_FOUND)
    }

    @ExceptionHandler(NoWalletsExposedException::class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    @ResponseBody
    fun processNoWalletsExposedException(ex: NoWalletsExposedException): ApiErrorResponse {
        return ApiErrorResponse(ex.message ?: "", HttpStatus.FORBIDDEN)
    }
}