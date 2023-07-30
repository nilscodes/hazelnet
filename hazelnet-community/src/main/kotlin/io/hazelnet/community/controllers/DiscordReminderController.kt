package io.hazelnet.community.controllers

import io.hazelnet.community.data.discord.DiscordReminder
import io.hazelnet.community.services.DiscordReminderService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping("/discord/servers")
class DiscordReminderController(
    private val discordReminderService: DiscordReminderService,
) {
    @GetMapping("/{guildId}/reminders")
    @ResponseStatus(HttpStatus.OK)
    fun listReminders(@PathVariable guildId: Long) = discordReminderService.listReminders(guildId)

    @PostMapping("/{guildId}/reminders")
    @ResponseStatus(HttpStatus.CREATED)
    fun addReminder(@PathVariable guildId: Long, @RequestBody @Valid discordReminder: DiscordReminder): ResponseEntity<DiscordReminder> {
        val newReminder = discordReminderService.addReminder(guildId, discordReminder)
        return ResponseEntity
            .created(
                ServletUriComponentsBuilder.fromCurrentRequest()
                    .path("/{reminderId}")
                    .buildAndExpand(newReminder.id)
                    .toUri()
            )
            .body(newReminder)
    }

    @GetMapping("/{guildId}/reminders/{reminderId}")
    @ResponseStatus(HttpStatus.OK)
    fun getReminder(@PathVariable guildId: Long, @PathVariable reminderId: Int) = discordReminderService.getReminder(guildId, reminderId)

    @DeleteMapping("/{guildId}/reminders/{reminderId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteReminder(@PathVariable guildId: Long, @PathVariable reminderId: Int) = discordReminderService.deleteReminder(guildId, reminderId)

}