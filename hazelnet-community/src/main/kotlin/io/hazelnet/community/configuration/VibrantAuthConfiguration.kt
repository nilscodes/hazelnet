package io.hazelnet.community.configuration

import io.hazelnet.community.CommunityApplicationConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.oauth2.client.*
import org.springframework.security.oauth2.client.registration.ClientRegistration
import org.springframework.security.oauth2.client.registration.InMemoryReactiveClientRegistrationRepository
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository
import org.springframework.security.oauth2.client.web.reactive.function.client.ServerOAuth2AuthorizedClientExchangeFilterFunction
import org.springframework.security.oauth2.core.AuthorizationGrantType
import org.springframework.security.oauth2.core.ClientAuthenticationMethod
import org.springframework.web.reactive.function.client.WebClient

@Configuration
class VibrantAuthConfiguration {

    @Bean
    fun vibrantAuthClient(
        authorizedClientManager: ReactiveOAuth2AuthorizedClientManager,
        config: CommunityApplicationConfiguration
    ): WebClient {
        val oauth2FilterFunction = ServerOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager)
        oauth2FilterFunction.setDefaultClientRegistrationId(config.vibrantAuth.clientId)

        return WebClient.builder()
            .filter(oauth2FilterFunction)
            .baseUrl(config.vibrantAuth.url)
            .build()
    }

    // Cannot use the autoconfiguration of spring as this application has non-reactive parts
    @Bean
    fun reactiveClientRegistrationRepository(config: CommunityApplicationConfiguration): ReactiveClientRegistrationRepository {
        return InMemoryReactiveClientRegistrationRepository(ClientRegistration.withRegistrationId(
            config.vibrantAuth.clientId)
            .clientId(config.vibrantAuth.clientId)
            .clientSecret(config.vibrantAuth.clientSecret)
            .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
            .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
            .scope("api")
            .tokenUri("${config.vibrantAuth.url}/oauth2/token")
            .jwkSetUri("${config.vibrantAuth.url}/oauth2/jwks")
            .build(
        ))
    }

    @Bean
    fun authorizedClientManager(
        clientRegistrationRepository: ReactiveClientRegistrationRepository,
        authorizedClientService: ReactiveOAuth2AuthorizedClientService,
    ): ReactiveOAuth2AuthorizedClientManager {
        val authorizedClientProvider = ReactiveOAuth2AuthorizedClientProviderBuilder.builder()
            .clientCredentials()
            .build()

        val authorizedClientManager = AuthorizedClientServiceReactiveOAuth2AuthorizedClientManager(clientRegistrationRepository, authorizedClientService)
        authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider)

        return authorizedClientManager
    }

    @Bean
    fun authorizedClientService(
        clientRegistrationRepository: ReactiveClientRegistrationRepository
    ): ReactiveOAuth2AuthorizedClientService {
        return InMemoryReactiveOAuth2AuthorizedClientService(clientRegistrationRepository)
    }

}