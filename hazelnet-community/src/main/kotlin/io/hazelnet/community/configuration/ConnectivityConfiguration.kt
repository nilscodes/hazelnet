package io.hazelnet.community.configuration

import io.hazelnet.community.CommunityApplicationConfiguration
import org.springframework.amqp.core.BindingBuilder
import org.springframework.amqp.core.DirectExchange
import org.springframework.amqp.core.Queue
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.reactive.function.client.ClientRequest
import org.springframework.web.reactive.function.client.ExchangeFunction
import org.springframework.web.reactive.function.client.ExchangeStrategies
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.util.UriComponentsBuilder
import java.util.*
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

@Configuration
class ConnectivityConfiguration(
    private val communityApplicationConfiguration: CommunityApplicationConfiguration,
) {

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
    fun tokenRegistryClient(config: CommunityApplicationConfiguration) =
        WebClient.builder()
            .baseUrl(config.tokenregistry.url)
            .build()

    @Bean
    fun necroLeagueClient(config: CommunityApplicationConfiguration) =
        WebClient.builder()
            .baseUrl(config.necroleague.url)
            .build()

    @Bean
    fun nftCdnClient() =
        WebClient.builder()
            .filter(nftCdnHash())
            .exchangeStrategies(
                ExchangeStrategies.builder().codecs {
                    it.defaultCodecs().maxInMemorySize(10000000)
                }.build())
            .build()

    fun nftCdnHash() = { request: ClientRequest, next: ExchangeFunction ->
        fun makeClientRequestWithTokenValue(tk: String) = ClientRequest.from(request).url(
            UriComponentsBuilder.fromUri(request.url())
                .replaceQueryParam("tk", tk)
                .build()
                .toUri()
        ).build()

        val sha256Hmac: Mac = Mac.getInstance("HmacSHA256")
        val secretKey = SecretKeySpec(Base64.getDecoder().decode(communityApplicationConfiguration.nftcdn.key), "HmacSHA256")
        sha256Hmac.init(secretKey)
        val requestWithEmptyToken = makeClientRequestWithTokenValue("")

        val base64Token = Base64.getUrlEncoder().withoutPadding()
            .encodeToString(sha256Hmac.doFinal(requestWithEmptyToken.url().toString().toByteArray(Charsets.UTF_8)))

        val newRequest = makeClientRequestWithTokenValue(base64Token)
        next.exchange(newRequest)
    }

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
    fun tokenRolesQueue() = Queue("tokenroles")

    @Bean
    fun stakepoolDelegatorRolesQueue() = Queue("delegatorroles")

    @Bean
    fun dRepDelegatorRolesQueue() = Queue("drepdelegatorroles")

    @Bean
    fun whitelistRolesQueue() = Queue("whitelistroles")

    @Bean
    fun quizRolesQueue() = Queue("quizroles")

    @Bean
    fun adminAnnouncementsQueue() = Queue("adminannouncements")

    @Bean
    fun activityRemindersQueue() = Queue("activityreminders")

    @Bean
    fun scheduledRemindersQueue() = Queue("scheduledreminders")

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
    fun tokenRolesBinding(@Qualifier("tokenRolesQueue") tokenRolesQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(tokenRolesQueue).to(exchange)

    @Bean
    fun stakepoolDelegatorRolesBinding(@Qualifier("stakepoolDelegatorRolesQueue") stakepoolDelegatorRolesQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(stakepoolDelegatorRolesQueue).to(exchange)

    @Bean
    fun dRepDelegatorRolesBinding(@Qualifier("dRepDelegatorRolesQueue") dRepDelegatorRolesQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(dRepDelegatorRolesQueue).to(exchange)

    @Bean
    fun whitelistRolesBinding(@Qualifier("whitelistRolesQueue") whitelisttRolesQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(whitelisttRolesQueue).to(exchange)

    @Bean
    fun quizRolesBinding(@Qualifier("quizRolesQueue") quiztRolesQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(quiztRolesQueue).to(exchange)

    @Bean
    fun announcementsBinding(@Qualifier("adminAnnouncementsQueue") adminAnnouncementsQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(adminAnnouncementsQueue).to(exchange)

    @Bean
    fun activityRemindersQueueBinding(@Qualifier("activityRemindersQueue") activityRemindersQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(activityRemindersQueue).to(exchange)

    @Bean
    fun scheduledRemindersQueueBinding(@Qualifier("scheduledRemindersQueue") scheduledRemindersQueue: Queue, exchange: DirectExchange): BindingBuilder.DirectExchangeRoutingKeyConfigurer
            = BindingBuilder.bind(scheduledRemindersQueue).to(exchange)

    @Bean
    fun messageConverter() = Jackson2JsonMessageConverter()
}