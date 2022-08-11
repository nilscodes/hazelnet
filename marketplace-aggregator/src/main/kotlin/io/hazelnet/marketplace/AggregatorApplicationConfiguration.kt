package io.hazelnet.marketplace

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConstructorBinding

@ConstructorBinding
@ConfigurationProperties(prefix = "io.hazelnet")
data class AggregatorApplicationConfiguration(
        val jpgStore: ConnectConfiguration
)

data class ConnectConfiguration(
        val url: String
)