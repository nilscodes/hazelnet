package io.hazelnet.external

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConstructorBinding

@ConstructorBinding
@ConfigurationProperties(prefix = "io.hazelnet")
data class ExternalApplicationConfiguration(
        val community: CommunityConfiguration,
        val connect: ConnectConfiguration,
)

data class CommunityConfiguration(
        val url: String
)

data class ConnectConfiguration(
        val url: String
)