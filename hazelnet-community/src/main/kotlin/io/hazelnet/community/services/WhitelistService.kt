package io.hazelnet.community.services

import io.hazelnet.community.data.discord.*
import io.hazelnet.community.persistence.DiscordServerRepository
import io.hazelnet.community.persistence.DiscordWhitelistRepository
import io.hazelnet.shared.data.SharedWhitelist
import io.hazelnet.shared.data.SummarizedWhitelistSignup
import io.hazelnet.shared.data.WhitelistSignup
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*
import javax.transaction.Transactional
import kotlin.reflect.KMutableProperty1
import kotlin.reflect.full.memberProperties

@Service
class WhitelistService(
    private val discordServerService: DiscordServerService,
    private val discordServerRepository: DiscordServerRepository,
    private val externalAccountService: ExternalAccountService,
    private val discordWhitelistRepository: DiscordWhitelistRepository,
) {
    fun addWhitelist(guildId: Long, whitelist: Whitelist): Whitelist {
        val discordServer = discordServerService.getDiscordServer(guildId)
        whitelist.createTime = Date.from(ZonedDateTime.now().toInstant())
        discordServer.whitelists.add(whitelist)
        discordServerRepository.save(discordServer)
        return whitelist
    }

    fun updateWhitelist(guildId: Long, whitelistId: Long, whitelistPartial: WhitelistPartial): Whitelist {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val whitelistToUpdate = getWhitelistById(discordServer, whitelistId)
        if (whitelistPartial.displayName != null) {
            whitelistToUpdate.displayName = whitelistPartial.displayName
        }
        if (whitelistPartial.closed != null) {
            whitelistToUpdate.closed = whitelistPartial.closed
        }

        fun updateIntPropertyIfNeeded(propertyName: String) {
            val propertyOnPartial = WhitelistPartial::class.memberProperties.find { it.name == propertyName }!!
            val valueOnPartial = propertyOnPartial.get(whitelistPartial) as Int?
            if (valueOnPartial != null) {
                val propertyOnWhitelist =
                    Whitelist::class.memberProperties.find { it.name == propertyName }!! as KMutableProperty1<Whitelist, Any?>
                // Hacky way of removing ints only if they are 0 (since null on the partial means the object should remain untouched)
                if (valueOnPartial == 0) {
                    propertyOnWhitelist.set(whitelistToUpdate, null)
                } else {
                    propertyOnWhitelist.set(whitelistToUpdate, valueOnPartial)
                }
            }
        }
        updateIntPropertyIfNeeded("sharedWithServer")
        updateIntPropertyIfNeeded("maxUsers")

        fun updateDatePropertyIfNeeded(propertyName: String) {
            val propertyOnPartial = WhitelistPartial::class.memberProperties.find { it.name == propertyName }!!
            val valueOnPartial = propertyOnPartial.get(whitelistPartial) as Date?
            if (valueOnPartial != null) {
                val propertyOnWhitelist =
                    Whitelist::class.memberProperties.find { it.name == propertyName }!! as KMutableProperty1<Whitelist, Any?>
                // Hacky way of removing dates only if they are older than 20 years (since null on the partial means the object should remain untouched)
                if (valueOnPartial.before(Date.from(ZonedDateTime.now().minusYears(20).toInstant()))) {
                    propertyOnWhitelist.set(whitelistToUpdate, null)
                } else {
                    propertyOnWhitelist.set(whitelistToUpdate, valueOnPartial)
                }
            }
        }

        updateDatePropertyIfNeeded("launchDate")
        updateDatePropertyIfNeeded("signupAfter")
        updateDatePropertyIfNeeded("signupUntil")
        if (whitelistPartial.logoUrl != null) {
            whitelistToUpdate.logoUrl = whitelistPartial.logoUrl.ifBlank { null }
        }
        discordWhitelistRepository.save(whitelistToUpdate)
        return whitelistToUpdate
    }

    fun deleteWhitelist(guildId: Long, whitelistId: Long) {
        discordWhitelistRepository.deleteById(whitelistId)
    }

    fun getWhitelistSignups(guildId: Long, whitelistIdOrName: String): Set<io.hazelnet.community.data.discord.WhitelistSignup> {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return try {
            val whitelistId = whitelistIdOrName.toLong()
            return getWhitelistById(discordServer, whitelistId).signups
        }
        catch(e: NumberFormatException) {
            getWhitelistByName(discordServer, whitelistIdOrName).signups
        }
    }

    fun getSharedWhitelists(guildId: Long, withSignups: Boolean): List<SharedWhitelist> {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val sharedWhitelists = discordWhitelistRepository.findBySharedWithServer(discordServer.id!!)
        return sharedWhitelists.map {
            val sharingServer = discordServerService.getDiscordServerByInternalId(it.discordServerId)
            SharedWhitelist(
                guildId = sharingServer.guildId,
                guildName = sharingServer.guildName,
                whitelistName = it.name,
                whitelistDisplayName = it.displayName,
                signups = if (withSignups) it.signups.map { signup -> WhitelistSignup(signup.address, signup.signupTime!!) }.toSet() else emptySet()
            )
        }
    }

    private fun getWhitelistById(discordServer: DiscordServer, whitelistId: Long) =
        discordServer.whitelists.find { it.id == whitelistId }
            ?: throw NoSuchElementException("No whitelist with ID $whitelistId found on Discord server ${discordServer.guildId}")

    private fun getWhitelistByName(discordServer: DiscordServer, whitelistName: String) =
        discordServer.whitelists.find { it.name == whitelistName }
            ?: throw NoSuchElementException("No whitelist with name $whitelistName found on Discord server ${discordServer.guildId}")

    @Transactional
    fun addWhitelistSignup(guildId: Long, whitelistId: Long, whitelistSignup: io.hazelnet.community.data.discord.WhitelistSignup): io.hazelnet.community.data.discord.WhitelistSignup {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val whitelist = getWhitelistById(discordServer, whitelistId)
        if (whitelist.closed) {
            throw WhitelistRequirementNotMetException("Signup failed as whitelist $whitelistId on server ${discordServer.guildId} is currently closed.")
        }
        if(whitelist.getCurrentUsers() >= (whitelist.maxUsers ?: Int.MAX_VALUE)) {
            throw WhitelistRequirementNotMetException("Signup failed as whitelist $whitelistId on server ${discordServer.guildId} has already reached the user limit.")
        }
        whitelist.signupAfter?.let {
            if(Date().before(it)) {
                throw WhitelistRequirementNotMetException("Signup failed as whitelist $whitelistId on server ${discordServer.guildId} has not yet opened for registration.")
            }
        }
        whitelist.signupUntil?.let {
            if(Date().after(it)) {
                throw WhitelistRequirementNotMetException("Signup failed as whitelist $whitelistId on server ${discordServer.guildId} already closed its registration.")
            }
        }
        // Remove existing signup (currently only one per external account possible)
        whitelist.signups.removeIf { it.externalAccountId == whitelistSignup.externalAccountId }
        whitelistSignup.signupTime = Date.from(ZonedDateTime.now().toInstant())
        whitelist.signups.add(whitelistSignup)
        discordWhitelistRepository.save(whitelist)
        return whitelistSignup
    }

    @Transactional
    fun deleteWhitelistSignup(guildId: Long, whitelistId: Long, externalAccountId: Long) {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val whitelist = getWhitelistById(discordServer, whitelistId)
        whitelist.signups.removeIf { it.externalAccountId == externalAccountId }
        discordWhitelistRepository.save(whitelist)
    }

    fun getWhitelistSignup(guildId: Long, whitelistId: Long, externalAccountId: Long): io.hazelnet.community.data.discord.WhitelistSignup {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val whitelist = getWhitelistById(discordServer, whitelistId)
        return whitelist.signups.find { it.externalAccountId == externalAccountId }
            ?: throw NoSuchElementException("No whitelist registration found for external account $externalAccountId for whitelist ID $whitelistId on Discord server ${discordServer.guildId}")
    }  
    

    fun getExternalAccountWhitelists(externalAccountId: Long): List<SummarizedWhitelistSignup> {
        externalAccountService.getExternalAccount(externalAccountId)
        val whitelists = discordWhitelistRepository.findBySignupsOfExternalAccount(externalAccountId)
        return whitelists.map {
            val discordServer = discordServerService.getDiscordServerByInternalId(it.discordServerId)
            SummarizedWhitelistSignup(
                externalAccountId = externalAccountId,
                guildId = discordServer.guildId,
                guildName = discordServer.guildName,
                whitelistDisplayName = it.displayName,
                signupTime = it.signups.first { signup -> signup.externalAccountId == externalAccountId}.signupTime!!,
                launchDate = it.launchDate,
                logoUrl = it.logoUrl,
            )
        }
    }
}