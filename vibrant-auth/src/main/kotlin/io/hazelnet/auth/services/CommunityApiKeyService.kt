package io.hazelnet.auth.services

import org.springframework.beans.factory.annotation.Value
import org.springframework.security.oauth2.core.AuthorizationGrantType
import org.springframework.security.oauth2.core.OAuth2AccessToken
import org.springframework.security.oauth2.server.authorization.OAuth2Authorization
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.Instant
import java.util.*

@Service
class CommunityApiKeyService(
    private val oAuth2AuthorizationService: OAuth2AuthorizationService,
    private val registeredClientRepository: RegisteredClientRepository,
    @Value("\${spring.security.oauth2.authorizationserver.opaque.introspection-client-id}")
    private val introspectionClientId: String,
) {
    fun regenerateAccessToken(guildId: Long): String {
        val snowflakeId = guildId.toString()
        deleteTokenInternal(snowflakeId)

        val token = OAuth2AccessToken(
            OAuth2AccessToken.TokenType.BEARER, "${UUID.randomUUID()}.${guildId}", Instant.now(), Instant.now().plus(
                Duration.ofDays(3600)), setOf("whitelist:read"))
        oAuth2AuthorizationService.save(
            OAuth2Authorization.withRegisteredClient(registeredClientRepository.findByClientId(introspectionClientId))
            .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
            .id(snowflakeId)
            .token(token) { it["discord"] = snowflakeId }
            .attribute("discord", snowflakeId)
            .principalName(snowflakeId)
            .build())
        return token.tokenValue
    }

    private fun deleteTokenInternal(snowflakeId: String) {
        val existingAuthorization = oAuth2AuthorizationService.findById(snowflakeId)
        existingAuthorization?.let {
            oAuth2AuthorizationService.remove(it)
        }
    }

    fun deleteAccessToken(guildId: Long) {
        deleteTokenInternal(guildId.toString())
    }
}