package io.hazelnet.cardano.connect.configuration

import io.blockfrost.sdk_kotlin.infrastructure.BlockfrostConfig
import io.hazelnet.cardano.connect.data.CardanoNetworkType
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class BlockfrostConfiguration {
    @Bean
    fun blockfrostConfig(@Value("\${io.hazelnet.connect.cardano.network}") cardanoNetworkType: CardanoNetworkType): BlockfrostConfig {
        return if (cardanoNetworkType == CardanoNetworkType.TESTNET) {
            BlockfrostConfig.defaultTestNetConfig
        } else {
            BlockfrostConfig.defaulMainNetConfig
        }
    }
}