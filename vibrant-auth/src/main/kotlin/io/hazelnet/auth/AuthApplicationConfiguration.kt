package io.hazelnet.auth

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConstructorBinding

@ConstructorBinding
@ConfigurationProperties(prefix = "io.vibrantnet")
data class AuthApplicationConfiguration(
    val ryp: OAuth2ClientConfiguration,
    val internal: OAuth2ClientConfiguration,
)

data class OAuth2ClientConfiguration(
    val clientId: String,
    val clientSecret: String,
)
