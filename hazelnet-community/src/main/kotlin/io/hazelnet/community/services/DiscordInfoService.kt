package io.hazelnet.community.services

import io.hazelnet.community.data.discord.widgets.DiscordWidgetUpdate
import io.hazelnet.community.persistence.DiscordServerRepository
import org.springframework.stereotype.Service

@Service
class DiscordInfoService(
    private val discordServerRepository: DiscordServerRepository,
) {
    fun listChannelsForEpochClockUpdate() = discordServerRepository.findChannelsForEpochClockUpdate()
        .map {
            DiscordWidgetUpdate(
                guildId = it.getGuildId(),
                channelId = it.getChannelId(),
            )
        }
}