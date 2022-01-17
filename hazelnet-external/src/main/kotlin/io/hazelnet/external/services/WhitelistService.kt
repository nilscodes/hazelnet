package io.hazelnet.external.services

import io.hazelnet.external.data.WhitelistSignup
import org.springframework.stereotype.Service

@Service
class WhitelistService(
        private val communityService: CommunityService
) {
    fun getWhitelistSignups(guildId: Long, whitelistName: String): List<WhitelistSignup> {
        return communityService.getWhitelistSignups(guildId, whitelistName)
    }
}