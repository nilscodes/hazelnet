package io.hazelnet.community.services

import io.hazelnet.community.CommunityApplicationConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.reactive.function.client.ExchangeStrategies
import org.springframework.web.reactive.function.client.WebClient

@Configuration
class ConnectivityConfiguration {

    @Bean
    fun connectClient(config: CommunityApplicationConfiguration) =
            WebClient.builder()
                    .baseUrl(config.connect.url)
                    .exchangeStrategies(
                            ExchangeStrategies.builder().codecs {
                                it.defaultCodecs().maxInMemorySize(10000000)
                            }.build())
                    .build()

    @Bean
    fun voteaireClient(config: CommunityApplicationConfiguration) =
        WebClient.builder()
            .baseUrl(config.voteaire.url)
            .build()
}