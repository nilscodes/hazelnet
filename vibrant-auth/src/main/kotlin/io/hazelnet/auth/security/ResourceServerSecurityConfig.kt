package io.hazelnet.auth.security

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.SecurityFilterChain

@Configuration
@EnableWebSecurity
class ResourceServerSecurityConfig {

    @Bean
    fun resourceServerSecurityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .authorizeRequests { it
                .antMatchers("/api/**").authenticated() // Adjust the path pattern to match your custom endpoints
                .anyRequest().permitAll()
            }
            .oauth2ResourceServer { oauth2 ->
                oauth2.jwt()
            }
        return http.build()
    }
}
