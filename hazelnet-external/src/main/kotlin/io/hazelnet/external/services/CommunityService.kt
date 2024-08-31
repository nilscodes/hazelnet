package io.hazelnet.external.services

import io.hazelnet.external.data.DiscordMemberDto
import io.hazelnet.external.data.ExposedWalletDto
import io.hazelnet.external.data.ExternalAccountDto
import io.hazelnet.external.data.VerificationDto
import io.hazelnet.shared.data.SharedWhitelist
import io.hazelnet.shared.data.WhitelistSignup
import io.hazelnet.external.data.claim.AnonymousPhysicalOrder
import io.hazelnet.external.data.claim.PhysicalProduct
import io.hazelnet.shared.data.NewWhitelistAutojoinDto
import io.hazelnet.shared.data.WhitelistAutojoinDto
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.core.ParameterizedTypeReference
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException
import org.springframework.web.reactive.function.client.body

@Service
class CommunityService(
    @Qualifier("communityClient")
    private val communityClient: WebClient,
) {
    fun getWhitelistSignups(guildId: Long, whitelistName: String): List<WhitelistSignup> {
        return communityClient.get()
                .uri { uriBuilder ->
                    uriBuilder
                            .path("/discord/servers/$guildId/whitelists/$whitelistName/signups")
                            .build()
                }.retrieve()
                .bodyToMono(object : ParameterizedTypeReference<List<WhitelistSignup>>() {})
                .block()!!
    }

    fun autojoinWhitelist(guildId: Long, whitelistName: String, autojoinDto: NewWhitelistAutojoinDto): WhitelistAutojoinDto {
        return communityClient.post()
            .uri { uriBuilder ->
                uriBuilder
                    .path("/discord/servers/$guildId/whitelists/$whitelistName/autojoin")
                    .build()
            }
            .bodyValue(autojoinDto)
            .retrieve()
            .bodyToMono(WhitelistAutojoinDto::class.java)
            .block()!!
    }

    fun getSharedWhitelists(guildId: Long): List<SharedWhitelist> {
        return communityClient.get()
            .uri { uriBuilder ->
                uriBuilder
                    .path("/discord/servers/$guildId/whitelists/shared")
                    .queryParam("withSignups", "true")
                    .build()
            }.retrieve()
            .bodyToMono(object : ParameterizedTypeReference<List<SharedWhitelist>>() {})
            .block()!!
    }

    fun getClaimListOrders(guildId: Long, claimListName: String): List<AnonymousPhysicalOrder> {
        return communityClient.get()
            .uri { uriBuilder ->
                uriBuilder
                    .path("/discord/servers/$guildId/claimlists/$claimListName/orders")
                    .build()
            }.retrieve()
            .bodyToMono(object : ParameterizedTypeReference<List<AnonymousPhysicalOrder>>() {})
            .block()!!
    }

    fun getClaimListProducts(guildId: Long, claimListName: String): List<PhysicalProduct> {
        return communityClient.get()
            .uri { uriBuilder ->
                uriBuilder
                    .path("/discord/servers/$guildId/claimlists/$claimListName/products")
                    .build()
            }.retrieve()
            .bodyToMono(object : ParameterizedTypeReference<List<PhysicalProduct>>() {})
            .block()!!
    }

    fun getExternalAccountByDiscordId(discordUserId: Long): ExternalAccountDto {
        return communityClient.get()
            .uri { uriBuilder ->
                uriBuilder
                    .path("/externalaccounts/discord/$discordUserId")
                    .build()
            }.retrieve()
            .bodyToMono(ExternalAccountDto::class.java)
            .doOnError(WebClientResponseException.NotFound::class.java) {
                throw NoSuchElementException("No external account found for discord user $discordUserId")
            }
            .block()!!
    }

    fun getLinkedDiscordUsers(guildId: Long): List<DiscordMemberDto> {
        return communityClient.get()
            .uri { uriBuilder ->
                uriBuilder
                    .path("/discord/servers/$guildId/members")
                    .build()
            }.retrieve()
            .bodyToMono(object : ParameterizedTypeReference<List<DiscordMemberDto>>() {})
            .block()!!
    }

    fun getExposedWallets(externalAccountId: Long, guildId: Long): List<ExposedWalletDto> {
        return communityClient.get()
            .uri { uriBuilder ->
                uriBuilder
                    .path("/externalaccounts/${externalAccountId}/exposedwallets")
                    .queryParam("guildId", guildId)
                    .build()
            }.retrieve()
            .bodyToMono(object : ParameterizedTypeReference<List<ExposedWalletDto>>() {})
            .block()!!
    }

    fun getExternalAccountVerifications(externalAccountId: Long): List<VerificationDto> {
        return communityClient.get()
            .uri { uriBuilder ->
                uriBuilder
                    .path("/externalaccounts/${externalAccountId}/verifications")
                    .build()
            }.retrieve()
            .bodyToMono(object : ParameterizedTypeReference<List<VerificationDto>>() {})
            .block()!!
    }
}