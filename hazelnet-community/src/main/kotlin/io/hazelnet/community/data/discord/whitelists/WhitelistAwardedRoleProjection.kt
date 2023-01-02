package io.hazelnet.community.data.discord.whitelists

interface WhitelistAwardedRoleProjection {
    fun getExternalReferenceId(): Long
    fun getAwardedRole(): Long
}