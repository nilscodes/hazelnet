package io.hazelnet.external.services

import io.hazelnet.external.data.SanitizedSharedWhitelist
import io.hazelnet.external.data.SanitizedWhitelistSignup
import io.hazelnet.shared.data.WhitelistSignup
import org.springframework.stereotype.Service

@Service
class WhitelistService(
        private val communityService: CommunityService
) {
    fun getWhitelistSignups(guildId: Long, whitelistName: String): List<SanitizedWhitelistSignup> {
        return communityService.getWhitelistSignups(guildId, whitelistName)
            .map { sanitizeWhitelistSignup(it) }
    }

    private fun sanitizeWhitelistSignup(unsanitizedSignup: WhitelistSignup) = SanitizedWhitelistSignup(
        address = unsanitizedSignup.address,
        signupTime = unsanitizedSignup.signupTime,
        referenceType = unsanitizedSignup.referenceType,
        referenceId = unsanitizedSignup.referenceId,
        referenceName = unsanitizedSignup.referenceName,
    )

    fun getSharedWhitelists(guildId: Long): List<SanitizedSharedWhitelist> {
        return communityService.getSharedWhitelists(guildId)
            .map { SanitizedSharedWhitelist(
                guildId = it.guildId,
                guildName = it.guildName,
                whitelistName = it.whitelistName,
                whitelistDisplayName = it.whitelistDisplayName,
                signups = it.signups.map { signup -> sanitizeWhitelistSignup(signup) }.toSet()
            ) }
    }
}