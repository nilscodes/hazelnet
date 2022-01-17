package io.hazelnet.external.services

import io.hazelnet.external.data.WhitelistSignup
import org.springframework.core.ParameterizedTypeReference
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient

@Service
class CommunityService(
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
}