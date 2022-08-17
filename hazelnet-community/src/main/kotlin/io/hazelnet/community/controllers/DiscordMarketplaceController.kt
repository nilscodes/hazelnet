package io.hazelnet.community.controllers

import io.hazelnet.community.data.discord.marketplace.DiscordMarketplaceChannel
import io.hazelnet.community.data.discord.marketplace.TrackerMetadataFilter
import io.hazelnet.community.services.DiscordMarketplaceService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping("/discord/servers")
class DiscordMarketplaceController(
    private val discordMarketplaceService: DiscordMarketplaceService,
) {
    @GetMapping("/{guildId}/marketplaces/channels")
    @ResponseStatus(HttpStatus.OK)
    fun listMarketplaceChannels(@PathVariable guildId: Long) = discordMarketplaceService.listMarketplaceChannels(guildId)

    @PostMapping("/{guildId}/marketplaces/channels")
    @ResponseStatus(HttpStatus.CREATED)
    fun addMarketplaceChannel(@PathVariable guildId: Long, @RequestBody @Valid discordMarketplaceChannel: DiscordMarketplaceChannel): ResponseEntity<DiscordMarketplaceChannel> {
        val newMarketplaceChannel = discordMarketplaceService.addMarketplaceChannel(guildId, discordMarketplaceChannel)
        return ResponseEntity
            .created(
                ServletUriComponentsBuilder.fromCurrentRequest()
                    .path("/{marketplaceChannelId}")
                    .buildAndExpand(newMarketplaceChannel.id)
                    .toUri())
            .body(newMarketplaceChannel)
    }

    @GetMapping("/{guildId}/marketplaces/channels/{marketplaceChannelId}")
    @ResponseStatus(HttpStatus.OK)
    fun getMarketplaceChannel(@PathVariable guildId: Long, @PathVariable marketplaceChannelId: Int) = discordMarketplaceService.getMarketplaceChannel(guildId, marketplaceChannelId)

    @DeleteMapping("/{guildId}/marketplaces/channels/{marketplaceChannelId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteMarketplaceChannel(@PathVariable guildId: Long, @PathVariable marketplaceChannelId: Int) = discordMarketplaceService.deleteMarketplaceChannel(guildId, marketplaceChannelId)

    @PostMapping("/{guildId}/marketplaces/channels/{marketplaceChannelId}/metadatafilters")
    @ResponseStatus(HttpStatus.CREATED)
    fun addMetadataFilterToMarketplaceChannel(@PathVariable guildId: Long, @PathVariable marketplaceChannelId: Int, @RequestBody @Valid trackerMetadataFilter: TrackerMetadataFilter): ResponseEntity<TrackerMetadataFilter> {
        val newMetadataFilter = discordMarketplaceService.addMetadataFilter(guildId, marketplaceChannelId, trackerMetadataFilter)
        return ResponseEntity
            .created(ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{filterId}")
                .buildAndExpand(newMetadataFilter.id)
                .toUri())
            .body(newMetadataFilter)
    }

    @DeleteMapping("/{guildId}/marketplaces/channels/{marketplaceChannelId}/metadatafilters/{filterId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteMetadataFilterFromMarketplaceChannel(@PathVariable guildId: Long, @PathVariable marketplaceChannelId: Int, @PathVariable filterId: Long) = discordMarketplaceService.deleteMetadataFilter(guildId, marketplaceChannelId, filterId)
}