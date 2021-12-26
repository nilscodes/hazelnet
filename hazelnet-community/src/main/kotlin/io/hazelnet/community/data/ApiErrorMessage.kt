package io.hazelnet.community.data

import com.fasterxml.jackson.annotation.JsonInclude


data class ApiErrorMessage(
        val message: String,

        @field:JsonInclude(JsonInclude.Include.NON_NULL)
        val sourceField: String? = null,

        @JsonInclude(JsonInclude.Include.NON_NULL)
        val additionalData: Any? = null
) {
    override fun toString(): String {
        return "ApiErrorMessage{message=$message, sourceField=$sourceField, additionalData=$additionalData}"
    }
}