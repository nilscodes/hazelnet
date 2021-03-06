package io.hazelnet.community.controllers

import io.hazelnet.community.data.HandleNotResolvedException
import io.hazelnet.community.data.IncomingPaymentAlreadyRequestedException
import io.hazelnet.shared.data.ApiErrorMessage
import io.hazelnet.shared.data.ApiErrorResponse
import io.hazelnet.community.data.InvalidAddressException
import io.hazelnet.community.data.StakeAddressInUseException
import io.hazelnet.community.data.discord.WhitelistRequirementNotMetException
import io.hazelnet.community.data.ping.LastPingTooRecentException
import io.hazelnet.community.data.ping.PingTargetNotFoundException
import mu.KotlinLogging
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

    private val logger = KotlinLogging.logger {}

    @ExceptionHandler(NoSuchElementException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ResponseBody
    fun processObjectNotFoundError(ex: NoSuchElementException): ApiErrorResponse {
        logger.debug { ex }
        return ApiErrorResponse(ex.message ?: "", HttpStatus.NOT_FOUND)
    }

    @ExceptionHandler(StakeAddressInUseException::class)
    @ResponseStatus(HttpStatus.CONFLICT)
    @ResponseBody
    fun processStakeAddressNotFoundException(ex: StakeAddressInUseException): ApiErrorResponse {
        return ApiErrorResponse(ex.message ?: "", HttpStatus.CONFLICT)
    }

    @ExceptionHandler(LastPingTooRecentException::class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    @ResponseBody
    fun processLastPingTooRecentException(ex: LastPingTooRecentException): ApiErrorResponse {
        return ApiErrorResponse(
            listOf(ApiErrorMessage(
                message = ex.message ?: "",
                additionalData = mapOf(Pair("minutesSinceLastPing", ex.minutesSinceLastPing)))
            ),
            HttpStatus.FORBIDDEN
        )
    }

    @ExceptionHandler(PingTargetNotFoundException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ResponseBody
    fun processPingTargetNotFoundException(ex: PingTargetNotFoundException): ApiErrorResponse {
        return ApiErrorResponse(ex.message ?: "", HttpStatus.NOT_FOUND)
    }

    @ExceptionHandler(InvalidAddressException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ResponseBody
    fun processInvalidAddressException(ex: InvalidAddressException): ApiErrorResponse {
        return ApiErrorResponse(ex.message ?: "", HttpStatus.NOT_FOUND)
    }

    @ExceptionHandler(WhitelistRequirementNotMetException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    fun processWhitelistRequirementNotMetException(ex: WhitelistRequirementNotMetException): ApiErrorResponse {
        return ApiErrorResponse(ex.message ?: "", HttpStatus.NOT_FOUND)
    }

    @ExceptionHandler(IncomingPaymentAlreadyRequestedException::class)
    @ResponseStatus(HttpStatus.CONFLICT)
    @ResponseBody
    fun processIncomingPaymentAlreadyRequestedException(ex: IncomingPaymentAlreadyRequestedException): ApiErrorResponse {
        return ApiErrorResponse(ex.message ?: "", HttpStatus.CONFLICT)
    }

    @ExceptionHandler(HandleNotResolvedException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ResponseBody
    fun processHandleNotResolvedException(ex: HandleNotResolvedException): ApiErrorResponse {
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