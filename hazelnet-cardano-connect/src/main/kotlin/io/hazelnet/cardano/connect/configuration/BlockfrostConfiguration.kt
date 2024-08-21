package io.hazelnet.cardano.connect.configuration

import io.blockfrost.sdk_kotlin.infrastructure.BlockfrostConfig
import io.hazelnet.cardano.connect.CardanoConnectConfiguration
import io.hazelnet.cardano.connect.data.CardanoNetworkType
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.reactive.function.client.WebClient

@Configuration
class BlockfrostConfiguration(
    private val configuration: CardanoConnectConfiguration
) {
    @Bean
    fun blockfrostConfig(@Value("\${io.hazelnet.connect.cardano.network}") cardanoNetworkType: CardanoNetworkType): BlockfrostConfig {
        return if (cardanoNetworkType == CardanoNetworkType.TESTNET) {
            BlockfrostConfig.defaultTestNetConfig
        } else {
            BlockfrostConfig.defaulMainNetConfig
        }
    }

    @Bean
    fun blockfrostClient(): WebClient = WebClient.builder()
        .baseUrl(configuration.blockfrost?.url ?: "")
        // Include a header with the API key in every request
        .defaultHeader("project_id", configuration.blockfrost?.apiKey ?: "")
        .build()
}