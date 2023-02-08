package io.hazelnet.community.data.discord

interface AwardedRoleProjection {
    fun getExternalReferenceId(): Long
    fun getAwardedRole(): Long
}