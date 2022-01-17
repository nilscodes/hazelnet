package io.hazelnet.external

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConstructorBinding

@ConstructorBinding
@ConfigurationProperties(prefix = "io.hazelnet")
data class ExternalApplicationConfiguration(
        val community: ConnectConfiguration
)

data class ConnectConfiguration(
        val url: String
)