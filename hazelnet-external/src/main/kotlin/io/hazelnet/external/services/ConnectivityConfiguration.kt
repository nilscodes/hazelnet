package io.hazelnet.external.services

import io.hazelnet.external.ExternalApplicationConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.reactive.function.client.ExchangeStrategies
import org.springframework.web.reactive.function.client.WebClient

@Configuration
class ConnectivityConfiguration {

    @Bean
    fun connectClient(config: ExternalApplicationConfiguration) =
            WebClient.builder()
                    .baseUrl(config.community.url)
                    .exchangeStrategies(
                            ExchangeStrategies.builder().codecs {
                                it.defaultCodecs().maxInMemorySize(10000000)
                            }.build())
                    .build()
}