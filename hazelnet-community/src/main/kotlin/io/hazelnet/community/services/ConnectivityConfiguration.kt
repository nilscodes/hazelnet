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
    fun salesPoliciesQueue() = Queue("salespolicies")

    @Bean
    fun salesQueue() = Queue("sales")

    @Bean
    fun listingsPoliciesQueue() = Queue("listingspolicies")

    @Bean
    fun listingsQueue() = Queue("listings")

    @Bean
    fun saleAnnouncementsQueue() = Queue("saleannouncements")

    @Bean
    fun mintAnnouncementsQueue() = Queue("mintannouncements")

    @Bean
    fun listingAnnouncementsQueue() = Queue("listingannouncements")

    @Bean
    fun exchange() = DirectExchange("hazelnet")

    @Bean
    fun salesBinding(@Qualifier("salesQueue") salesQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(salesQueue).to(exchange)

    @Bean
    fun salesPoliciesBinding(@Qualifier("salesPoliciesQueue") salesPoliciesQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(salesPoliciesQueue).to(exchange)

    @Bean
    fun saleAnnouncementsBinding(@Qualifier("saleAnnouncementsQueue") saleAnnouncementsQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(saleAnnouncementsQueue).to(exchange)

    @Bean
    fun listingsBinding(@Qualifier("listingsQueue") listingsQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(listingsQueue).to(exchange)

    @Bean
    fun listingsPoliciesBinding(@Qualifier("listingsPoliciesQueue") listingsPoliciesQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(listingsPoliciesQueue).to(exchange)

    @Bean
    fun listingAnnouncementsBinding(@Qualifier("listingAnnouncementsQueue") listingAnnouncementsQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(listingAnnouncementsQueue).to(exchange)

    @Bean
    fun mintAnnouncementsBinding(@Qualifier("mintAnnouncementsQueue") mintAnnouncementsQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(mintAnnouncementsQueue).to(exchange)

    @Bean
    fun messageConverter() = Jackson2JsonMessageConverter()
}