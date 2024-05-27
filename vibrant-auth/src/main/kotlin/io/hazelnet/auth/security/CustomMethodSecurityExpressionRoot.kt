package io.hazelnet.auth.security

import org.springframework.security.access.expression.SecurityExpressionRoot
import org.springframework.security.access.expression.method.MethodSecurityExpressionOperations
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken

class CustomMethodSecurityExpressionRoot(
    authentication: Authentication
) : SecurityExpressionRoot(authentication), MethodSecurityExpressionOperations {

    fun clientHasAnyRole(vararg clientIds: String): Boolean {
        if (authentication is JwtAuthenticationToken) {
            val jwtAuthToken = authentication
            val clientId = jwtAuthToken.token.claims["sub"] as String?
            return clientId != null && clientIds.contains(clientId)
        }
        return false
    }

    override fun setFilterObject(filterObject: Any?) {
        // No filter object
    }
    override fun getFilterObject(): Any? = null
    override fun setReturnObject(returnObject: Any?) {
        // No return object
    }
    override fun getReturnObject(): Any? = null
    override fun getThis(): Any = this
}

