package io.hazelnet.community.services

import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient

@Service
class ApiTokenService(
    @Qualifier("vibrantAuthClient")
    private val vibrantAuthClient: WebClient,
) {

    fun regenerateAccessToken(guildId: Long): String {
        return vibrantAuthClient.post()
            .uri("/api/$guildId/accesstoken")
            .retrieve()
            .bodyToMono(String::class.java)
            .block()!!
    }

    fun deleteAccessToken(guildId: Long) {
        vibrantAuthClient.delete()
            .uri("/api/$guildId/accesstoken")
            .retrieve()
            .toBodilessEntity()
            .block()
    }
}