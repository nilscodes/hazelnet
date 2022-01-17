/*
 * Copyright 2021 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.hazelnet.community.security

import com.nimbusds.jose.jwk.JWKSet
import com.nimbusds.jose.jwk.RSAKey
import com.nimbusds.jose.jwk.source.ImmutableJWKSet
import com.nimbusds.jose.jwk.source.JWKSource
import com.nimbusds.jose.proc.SecurityContext
import org.springframework.beans.factory.annotation.Value
import org.springframework.beans.factory.config.BeanDefinition
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Role
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcOperations
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configurers.oauth2.server.authorization.OAuth2AuthorizationServerConfigurer
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.oauth2.core.AuthorizationGrantType
import org.springframework.security.oauth2.core.ClientAuthenticationMethod
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository
import org.springframework.security.oauth2.server.authorization.config.ProviderSettings
import org.springframework.security.provisioning.InMemoryUserDetailsManager
import org.springframework.security.web.SecurityFilterChain
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.interfaces.RSAPrivateKey
import java.security.interfaces.RSAPublicKey
import java.util.*

@Configuration
class OAuth2AuthorizationServerSecurityConfiguration(
        @Value("\${spring.security.oauth2.base-uri}")
        private val oauth2BaseUrl: String,

        @Value("\${spring.security.oauth2.authorizationserver.opaque.introspection-client-id}")
        private val introspectionClientId: String,

        @Value("\${spring.security.oauth2.authorizationserver.opaque.introspection-client-secret}")
        private val introspectionClientSecret: String
) {

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    @Throws(Exception::class)
    fun authorizationServerSecurityFilterChain(http: HttpSecurity): SecurityFilterChain? {
        applyDefaultSecurity(http)
        return http.build()
    }

    fun applyDefaultSecurity(http: HttpSecurity) {
        val authorizationServerConfigurer = OAuth2AuthorizationServerConfigurer<HttpSecurity>()
        val endpointsMatcher = authorizationServerConfigurer
                .endpointsMatcher

        http
                .requestMatcher(endpointsMatcher)
                .authorizeRequests { it.anyRequest().authenticated() }
                .csrf { it.ignoringRequestMatchers(endpointsMatcher) }
                .apply(authorizationServerConfigurer)
    }

    @Bean
    fun registeredClientRepository(): RegisteredClientRepository {
        println(oauth2BaseUrl)
        println(introspectionClientId)
        println(introspectionClientSecret)
        val registeredClient = RegisteredClient.withId("b5f5479d-4a6a-4d88-89ca-f1bfba7d2e89")
                .clientId(introspectionClientId)
                .clientSecret(introspectionClientSecret)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
                .scope("whitelist:read")
                .build()
        return InMemoryRegisteredClientRepository(registeredClient)
    }

    @Bean
    fun oauthTokenAuthorizationService(
            jdbcOperations: JdbcOperations,
            registeredClientRepository: RegisteredClientRepository
    ) = PostgresJdbcOAuth2AuthorizationService(jdbcOperations, registeredClientRepository)

    @Bean
    fun jwkSource(keyPair: KeyPair): JWKSource<SecurityContext> {
        val publicKey = keyPair.public as RSAPublicKey
        val privateKey = keyPair.private as RSAPrivateKey
        val rsaKey = RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID(UUID.randomUUID().toString())
                .build()
        val jwkSet = JWKSet(rsaKey)
        return ImmutableJWKSet(jwkSet)
    }

    @Bean
    fun jwtDecoder(keyPair: KeyPair): JwtDecoder {
        return NimbusJwtDecoder.withPublicKey(keyPair.public as RSAPublicKey).build()
    }

    @Bean
    fun providerSettings(): ProviderSettings {
        return ProviderSettings.builder().issuer(oauth2BaseUrl).build()
    }

    @Bean
    fun userDetailsService(): UserDetailsService {
        val userDetails = User.withDefaultPasswordEncoder()
                .username("user")
                .password("password")
                .roles("USER")
                .build()
        return InMemoryUserDetailsManager(userDetails)
    }

    @Bean
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    fun generateRsaKey(): KeyPair {
        val keyPair: KeyPair = try {
            val keyPairGenerator = KeyPairGenerator.getInstance("RSA")
            keyPairGenerator.initialize(2048)
            keyPairGenerator.generateKeyPair()
        } catch (ex: Exception) {
            throw IllegalStateException(ex)
        }
        return keyPair
    }
}