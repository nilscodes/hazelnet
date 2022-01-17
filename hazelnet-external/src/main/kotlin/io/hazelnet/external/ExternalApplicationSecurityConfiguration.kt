package io.hazelnet.external

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.SecurityFilterChain

@EnableWebSecurity
class ExternalApplicationSecurityConfiguration(
        @Value("\${spring.security.oauth2.resourceserver.opaque.introspection-uri}")
        private val introspectionUri: String,

        @Value("\${spring.security.oauth2.resourceserver.opaque.introspection-client-id}")
        private val clientId: String,

        @Value("\${spring.security.oauth2.resourceserver.opaque.introspection-client-secret}")
        private val clientSecret: String,
) {

    @Bean
    @Throws(Exception::class)
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
                .authorizeHttpRequests { authorize ->
                    authorize
                            .mvcMatchers(HttpMethod.GET, "/community/whitelist/**").hasAuthority("SCOPE_whitelist:read")
                            .anyRequest().authenticated()
                }
                .oauth2ResourceServer { oauth2 ->
                    oauth2
                            .opaqueToken { opaque ->
                                opaque
                                        .introspectionUri(introspectionUri)
                                        .introspectionClientCredentials(clientId, clientSecret)
                            }
                }
        return http.build()
    }

}