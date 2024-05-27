package io.hazelnet.auth.security


import org.aopalliance.intercept.MethodInvocation
import org.springframework.context.annotation.Configuration
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler
import org.springframework.security.access.expression.method.MethodSecurityExpressionOperations
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity
import org.springframework.security.config.annotation.method.configuration.GlobalMethodSecurityConfiguration
import org.springframework.security.core.Authentication


@Configuration
@EnableGlobalMethodSecurity(prePostEnabled = true)
class MethodSecurityConfig : GlobalMethodSecurityConfiguration() {

    override fun createExpressionHandler(): DefaultMethodSecurityExpressionHandler {
        return CustomMethodSecurityExpressionHandler()
    }
}

class CustomMethodSecurityExpressionHandler : DefaultMethodSecurityExpressionHandler() {

    override fun createSecurityExpressionRoot(authentication: Authentication, invocation: MethodInvocation): MethodSecurityExpressionOperations {
        val root = CustomMethodSecurityExpressionRoot(authentication)
        root.setPermissionEvaluator(permissionEvaluator)
        return root
    }
}
