package io.hazelnet.community.data

import org.springframework.http.HttpStatus

data class ApiErrorResponse(
        val messages: List<ApiErrorMessage>,
        val httpStatus: HttpStatus
) {

    constructor (message: String, httpStatus: HttpStatus) : this(listOf(ApiErrorMessage(message)), httpStatus)

    val httpStatusCode get() = httpStatus.value()
}