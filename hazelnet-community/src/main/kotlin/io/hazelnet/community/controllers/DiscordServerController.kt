package io.hazelnet.community.controllers

import io.hazelnet.community.data.EmbeddableSetting
import io.hazelnet.community.data.claim.PhysicalOrder
import io.hazelnet.community.data.discord.DiscordMember
import io.hazelnet.community.data.discord.DiscordMemberPartial
import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.DiscordServerPartial
import io.hazelnet.community.data.premium.IncomingDiscordPayment
import io.hazelnet.community.data.premium.IncomingDiscordPaymentRequest
import io.hazelnet.community.services.BillingService
import io.hazelnet.community.services.DiscordServerRetriever
import io.hazelnet.community.services.DiscordServerService
import io.hazelnet.community.services.IncomingPaymentService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping("/discord/servers")
class DiscordServerController(
        private val discordServerService: DiscordServerService,
        private val discordServerRetriever: DiscordServerRetriever,
        private val billingService: BillingService,
        private val incomingPaymentService: IncomingPaymentService,
) {
    @PostMapping("")
    @ResponseStatus(HttpStatus.CREATED)
    fun addDiscordServer(@RequestBody @Valid discordServer: DiscordServer): ResponseEntity<DiscordServer> {
        val newDiscordServer = discordServerService.addDiscordServer(discordServer)
        return ResponseEntity
                .created(ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{guildId}")
                        .buildAndExpand(newDiscordServer.guildId)
                        .toUri())
                .body(newDiscordServer)
    }

    @GetMapping("")
    @ResponseStatus(HttpStatus.OK)
    fun listDiscordServers() = discordServerRetriever.getDiscordServers()

    @GetMapping(value = ["/{guildId}"], params = ["!byId"])
    @ResponseStatus(HttpStatus.OK)
    fun getDiscordServer(@PathVariable guildId: Long) = discordServerRetriever.getDiscordServer(guildId)

    @GetMapping(value = ["/{serverId}"], params = ["byId"])
    @ResponseStatus(HttpStatus.OK)
    fun getDiscordServerByInternalId(@PathVariable serverId: Int) = discordServerRetriever.getDiscordServerByInternalId(serverId)

    @PatchMapping("/{guildId}")
    @ResponseStatus(HttpStatus.OK)
    fun updateDiscordServer(@PathVariable guildId: Long, @RequestBody @Valid discordServerPartial: DiscordServerPartial) = discordServerService.updateDiscordServer(guildId, discordServerPartial)

    @PostMapping("/{guildId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    fun connectExternalAccount(@PathVariable guildId: Long, @RequestBody @Valid discordMember: DiscordMember) = discordServerService.addMember(guildId, discordMember)

    @GetMapping("/{guildId}/members/{externalAccountId}")
    @ResponseStatus(HttpStatus.OK)
    fun getExternalAccountOnDiscord(@PathVariable guildId: Long, @PathVariable externalAccountId: Long) = discordServerService.getMember(guildId, externalAccountId)

    @PatchMapping("/{guildId}/members/{externalAccountId}")
    @ResponseStatus(HttpStatus.OK)
    fun updateExternalAccountOnDiscord(@PathVariable guildId: Long, @PathVariable externalAccountId: Long, @RequestBody @Valid discordMemberPartial: DiscordMemberPartial) = discordServerService.updateMember(guildId, externalAccountId, discordMemberPartial)

    @DeleteMapping("/{guildId}/members/{externalAccountId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun disconnectExternalAccount(
        @PathVariable guildId: Long,
        @PathVariable externalAccountId: Long,
        @RequestParam(required = false, defaultValue = "false") skipRoleUpdates: Boolean,
    ) = discordServerService.removeMember(guildId, externalAccountId, skipRoleUpdates)

    @PutMapping("/{guildId}/settings/{settingName}")
    @ResponseStatus(HttpStatus.OK)
    fun updateSetting(@PathVariable guildId: Long, @PathVariable settingName: String, @RequestBody @Valid embeddableSetting: EmbeddableSetting): EmbeddableSetting {
        if (embeddableSetting.name != settingName) {
            throw IllegalArgumentException("Discord server setting name in path $settingName did not match setting in request body ${embeddableSetting.name}.")
        }
        return discordServerService.updateSettings(guildId, embeddableSetting)
    }

    @DeleteMapping("/{guildId}/settings/{settingName}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteSetting(@PathVariable guildId: Long, @PathVariable settingName: String) = discordServerService.deleteSettings(guildId, settingName)

    @GetMapping("/{guildId}/members")
    @ResponseStatus(HttpStatus.OK)
    fun getExternalAccounts(@PathVariable guildId: Long) = discordServerService.getMembers(guildId)

    @GetMapping("/{guildId}/roleassignments/quizroles")
    @ResponseStatus(HttpStatus.OK)
    fun getCurrentQuizRoleAssignments(@PathVariable guildId: Long) = discordServerService.getAllCurrentQuizRoleAssignmentsForGuild(guildId)

    @PostMapping("/{guildId}/accesstoken")
    @ResponseStatus(HttpStatus.OK)
    fun regenerateAccessToken(@PathVariable guildId: Long) = discordServerService.regenerateAccessToken(guildId)

    @DeleteMapping("/{guildId}/accesstoken")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteAccessToken(@PathVariable guildId: Long) = discordServerService.deleteAccessToken(guildId)

    @GetMapping("/{guildId}/premium")
    @ResponseStatus(HttpStatus.OK)
    fun getPremiumInfo(@PathVariable guildId: Long) = billingService.getPremiumInfo(guildId)

    @GetMapping("/{guildId}/payment")
    @ResponseStatus(HttpStatus.OK)
    fun getCurrentPayment(@PathVariable guildId: Long) = incomingPaymentService.getCurrentPayment(guildId)

    @PostMapping("/{guildId}/payment")
    @ResponseStatus(HttpStatus.CREATED)
    fun requestIncomingPayment(@PathVariable guildId: Long, @RequestBody @Valid incomingDiscordPaymentRequest: IncomingDiscordPaymentRequest): ResponseEntity<IncomingDiscordPayment> {
        val newIncomingDiscordPayment = incomingPaymentService.requestIncomingPayment(guildId, incomingDiscordPaymentRequest)
        return ResponseEntity
            .created(ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{incomingDiscordPaymentId}")
                .buildAndExpand(newIncomingDiscordPayment.id)
                .toUri())
            .body(newIncomingDiscordPayment)
    }

    @DeleteMapping("/{guildId}/payment")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun cancelIncomingPayment(@PathVariable guildId: Long) = incomingPaymentService.cancelIncomingPayment(guildId)
}