package io.hazelnet.cardano.connect.controllers

import io.hazelnet.cardano.connect.data.transactions.NoTransactionFoundException
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
    @ExceptionHandler(NoTransactionFoundException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ResponseBody
    fun processInvalidAddressException(ex: NoTransactionFoundException): ApiErrorResponse {
        return ApiErrorResponse(ex.message ?: "", HttpStatus.NOT_FOUND)
    }
}