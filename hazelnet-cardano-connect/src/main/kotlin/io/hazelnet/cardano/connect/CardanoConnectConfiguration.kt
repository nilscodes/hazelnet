package io.hazelnet.cardano.connect

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConstructorBinding

@ConfigurationProperties(prefix = "io.hazelnet.connect.cardano")
data class CardanoConnectConfiguration @ConstructorBinding constructor(
    val blockfrost: BlockfrostConfig?,
)

data class BlockfrostConfig(
    val url: String,
    val apiKey: String,
)