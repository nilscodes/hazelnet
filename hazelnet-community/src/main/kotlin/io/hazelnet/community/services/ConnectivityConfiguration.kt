package io.hazelnet.community.services

import io.hazelnet.community.CommunityApplicationConfiguration
import org.springframework.amqp.core.BindingBuilder
import org.springframework.amqp.core.DirectExchange
import org.springframework.amqp.core.Queue
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter
import org.springframework.beans.factory.annotation.Qualifier
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

    @Bean
    fun cnftJungleClient(config: CommunityApplicationConfiguration) =
        WebClient.builder()
            .baseUrl(config.cnftjungle.url)
            .build()

    @Bean
    fun requestedPoliciesQueue() = Queue("policies")

    @Bean
    fun salesQueue() = Queue("sales")

    @Bean
    fun saleAnnouncementsQueue() = Queue("saleannouncements")

    @Bean
    fun exchange() = DirectExchange("hazelnet")

    @Bean
    fun salesBinding(@Qualifier("salesQueue") salesQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(salesQueue).to(exchange)

    @Bean
    fun requestedPoliciesBinding(@Qualifier("requestedPoliciesQueue") requestedPoliciesQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(requestedPoliciesQueue).to(exchange)

    @Bean
    fun saleAnnouncementsBinding(@Qualifier("saleAnnouncementsQueue") saleAnnouncementsQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(saleAnnouncementsQueue).to(exchange)

    @Bean
    fun messageConverter() = Jackson2JsonMessageConverter()
}