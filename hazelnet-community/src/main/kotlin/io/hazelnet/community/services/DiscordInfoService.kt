package io.hazelnet.community.services

import io.hazelnet.community.data.discord.widgets.DiscordMintCounterUpdate
import io.hazelnet.community.data.discord.widgets.DiscordRoleCounterUpdate
import io.hazelnet.community.data.discord.widgets.DiscordWidgetUpdate
import io.hazelnet.community.persistence.DiscordServerRepository
import org.springframework.stereotype.Service

@Service
class DiscordInfoService(
    private val discordServerRepository: DiscordServerRepository,
    private val connectService: ConnectService,
) {
    fun listChannelsForEpochClockUpdate() = discordServerRepository.findChannelsForEpochClockUpdate()
        .map {
            DiscordWidgetUpdate(
                guildId = it.getGuildId(),
                channelId = it.getChannelId(),
            )
        }

    fun listChannelsForRoleCounterUpdate() = discordServerRepository.findChannelsForRoleCounterUpdate()
        .map {
            DiscordRoleCounterUpdate(
                guildId = it.getGuildId(),
                channelId = it.getChannelId(),
                roleId = it.getWidgetName().substringAfterLast("_").toLong()
            )
        }

    fun listChannelsForMintCounterUpdate(): List<DiscordMintCounterUpdate> {
        val emptyUpdates = discordServerRepository.findChannelsForMintCounterUpdate().map {
            val updateInfoSplit = it.getUpdateInfo().split(",")
            val (channelId, policyId, maxCount) = updateInfoSplit
            val cip68 = updateInfoSplit.getOrNull(3) ?: "false"
            DiscordMintCounterUpdate(
                guildId = it.getGuildId(),
                channelId = channelId.toLong(),
                policyId = policyId,
                tokenCount = 0,
                maxCount = maxCount.toLong(),
                cip68 = cip68.toBoolean()
            )
        }
        val policyInfo = connectService
            .getPolicyInfo(emptyUpdates.map { it.policyId })
            .associate { Pair(it.policyId.policyId, it.tokenCount) }
        return emptyUpdates.map {
            it.withCount(policyInfo[it.policyId] ?: 0L)
        }
    }

}