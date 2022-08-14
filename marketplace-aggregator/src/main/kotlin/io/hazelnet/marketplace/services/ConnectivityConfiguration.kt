package io.hazelnet.marketplace.services

import io.hazelnet.marketplace.AggregatorApplicationConfiguration
import org.springframework.amqp.core.*
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.reactive.function.client.ExchangeStrategies
import org.springframework.web.reactive.function.client.WebClient


@Configuration
class ConnectivityConfiguration {

    @Bean
    fun jpgStoreClient(config: AggregatorApplicationConfiguration) =
            WebClient.builder()
                    .baseUrl(config.jpgStore.url)
                    .exchangeStrategies(
                            ExchangeStrategies.builder().codecs {
                                it.defaultCodecs().maxInMemorySize(10000000)
                            }.build())
                    .build()

    @Bean
    fun salesPoliciesQueue() = Queue("salespolicies")

    @Bean
    fun salesQueue() = Queue("sales")

    @Bean
    fun listingsQueue() = Queue("listings")

    @Bean
    fun listingsPoliciesQueue() = Queue("listingspolicies")

    @Bean
    fun exchange() = DirectExchange("hazelnet")

    @Bean
    fun salesBinding(@Qualifier("salesQueue") salesQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
        = BindingBuilder.bind(salesQueue).to(exchange)

    @Bean
    fun listingsBinding(@Qualifier("listingsQueue") listingsQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(listingsQueue).to(exchange)

    @Bean
    fun salesPoliciesBinding(@Qualifier("salesPoliciesQueue") salesPoliciesQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
        = BindingBuilder.bind(salesPoliciesQueue).to(exchange)

    @Bean
    fun listingsPoliciesBinding(@Qualifier("listingsPoliciesQueue") listingsPoliciesQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(listingsPoliciesQueue).to(exchange)

    @Bean
    fun messageConverter() = Jackson2JsonMessageConverter()
}