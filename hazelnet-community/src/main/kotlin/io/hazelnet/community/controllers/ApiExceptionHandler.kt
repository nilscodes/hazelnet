package io.hazelnet.community.controllers

import io.hazelnet.community.data.ApiErrorMessage
import io.hazelnet.community.data.ApiErrorResponse
import org.springframework.core.annotation.Order
import org.springframework.http.HttpStatus
import org.springframework.web.bind.MethodArgumentNotValidException
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

    @ExceptionHandler(MethodArgumentNotValidException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    fun processValidationError(ex: MethodArgumentNotValidException): ApiErrorResponse {
        val result = ex.bindingResult
        val errorMessages: MutableList<ApiErrorMessage> = mutableListOf()
        for (fieldError in result.fieldErrors) {
            val apiError = ApiErrorMessage(fieldError.defaultMessage!!, fieldError.field)
            errorMessages.add(apiError)
        }
        for (objectError in result.globalErrors) {
            val apiError = ApiErrorMessage(objectError.defaultMessage!!)
            errorMessages.add(apiError)
        }
        return ApiErrorResponse(errorMessages, HttpStatus.BAD_REQUEST)
    }
}