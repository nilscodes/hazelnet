package io.hazelnet.community.services

import io.hazelnet.community.data.discord.*
import io.hazelnet.community.data.discord.whitelists.Whitelist
import io.hazelnet.community.data.discord.whitelists.WhitelistAutojoin
import io.hazelnet.community.data.discord.whitelists.WhitelistPartial
import io.hazelnet.community.data.discord.whitelists.WhitelistRequirementNotMetException
import io.hazelnet.community.persistence.AutojoinProjection
import io.hazelnet.community.persistence.DiscordServerRepository
import io.hazelnet.community.persistence.DiscordWhitelistRepository
import io.hazelnet.shared.data.*
import mu.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*
import java.util.concurrent.TimeUnit
import javax.transaction.Transactional
import kotlin.reflect.KMutableProperty1
import kotlin.reflect.full.memberProperties

@Service
class WhitelistService(
    private val discordServerRetriever: DiscordServerRetriever,
    private val discordServerRepository: DiscordServerRepository,
    private val externalAccountService: ExternalAccountService,
    private val discordWhitelistRepository: DiscordWhitelistRepository,
    private val roleAssignmentService: RoleAssignmentService,
) {
    fun addWhitelist(guildId: Long, whitelist: Whitelist): Whitelist {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        whitelist.createTime = Date.from(ZonedDateTime.now().toInstant())
        discordServer.whitelists.add(whitelist)
        discordServerRepository.save(discordServer)
        return whitelist
    }

    fun updateWhitelist(guildId: Long, whitelistId: Long, whitelistPartial: WhitelistPartial): Whitelist {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
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
        if (whitelistPartial.awardedRole != null) {
            whitelistToUpdate.awardedRole = if (whitelistPartial.awardedRole > 0) whitelistPartial.awardedRole else null
        }
        if (whitelistPartial.requiredRoles != null) {
            whitelistToUpdate.requiredRoles = whitelistPartial.requiredRoles
        }
        discordWhitelistRepository.save(whitelistToUpdate)
        return whitelistToUpdate
    }

    fun deleteWhitelist(guildId: Long, whitelistId: Long) {
        discordWhitelistRepository.deleteById(whitelistId)
    }

    fun getWhitelistSignups(guildId: Long, whitelistIdOrName: String): Set<WhitelistSignup> {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        val whitelist = getWhitelistByIdOrName(whitelistIdOrName, discordServer)
        return whitelist.signups.map { signup ->
                buildWhitelistSignup(whitelist, signup)
            }.toSet()
    }

    private fun getWhitelistByIdOrName(
        whitelistIdOrName: String,
        discordServer: DiscordServer
    ): Whitelist {
        val whitelist = if (whitelistIdOrName.toLongOrNull() != null) {
            getWhitelistById(discordServer, whitelistIdOrName.toLong())
        } else {
            getWhitelistByName(discordServer, whitelistIdOrName)
        }
        return whitelist
    }

    fun getSharedWhitelists(guildId: Long, withSignups: Boolean): List<SharedWhitelist> {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        val sharedWhitelists = discordWhitelistRepository.findBySharedWithServer(discordServer.id!!)
        return sharedWhitelists.map {
            val sharingServer = discordServerRetriever.getDiscordServerByInternalId(it.discordServerId)
            SharedWhitelist(
                guildId = sharingServer.guildId,
                guildName = sharingServer.guildName,
                whitelistName = it.name,
                whitelistDisplayName = it.displayName,
                type = it.type,
                signups = if (withSignups) it.signups.map { signup ->
                    buildWhitelistSignup(it, signup)
                }.toSet() else emptySet()
            )
        }
    }

    private fun buildWhitelistSignup(
        whitelist: Whitelist,
        signup: io.hazelnet.community.data.discord.whitelists.WhitelistSignup
    ): WhitelistSignup {
        // TODO improve very inefficient looped SQL queries
        val externalAccount =
            if (whitelist.type == WhitelistType.DISCORD_ID) externalAccountService.getExternalAccount(signup.externalAccountId) else null
        return WhitelistSignup(
            externalAccountId = signup.externalAccountId,
            address = signup.address,
            signupTime = signup.signupTime!!,
            referenceId = externalAccount?.referenceId,
            referenceName = externalAccount?.referenceName,
            referenceType = externalAccount?.type,
        )
    }

    private fun getWhitelistById(discordServer: DiscordServer, whitelistId: Long) =
        discordServer.whitelists.find { it.id == whitelistId }
            ?: throw NoSuchElementException("No whitelist with ID $whitelistId found on Discord server ${discordServer.guildId}")

    private fun getWhitelistByName(discordServer: DiscordServer, whitelistName: String) =
        discordServer.whitelists.find { it.name == whitelistName }
            ?: throw NoSuchElementException("No whitelist with name $whitelistName found on Discord server ${discordServer.guildId}")

    @Transactional
    fun addWhitelistSignup(guildId: Long, whitelistId: Long, whitelistSignup: io.hazelnet.community.data.discord.whitelists.WhitelistSignup): io.hazelnet.community.data.discord.whitelists.WhitelistSignup {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
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
        if (whitelist.type == WhitelistType.WALLET_ADDRESS) {
            if (whitelistSignup.address == null) {
                throw WhitelistRequirementNotMetException("Signup failed as whitelist $whitelistId on server ${discordServer.guildId} cannot be signed up to without a valid address.")
            }
            val blockchainForSignup = BlockchainAddressValidator.blockchainFromAddress(whitelistSignup.address!!)
            if (blockchainForSignup.isEmpty()) {
                throw WhitelistRequirementNotMetException("Signup failed for whitelist $whitelistId on server ${discordServer.guildId} as address ${whitelistSignup.address} could not be mapped to any blockchain.")
            } else if (blockchainForSignup.size > 1) {
                throw WhitelistRequirementNotMetException("Signup failed for whitelist $whitelistId on server ${discordServer.guildId} as address ${whitelistSignup.address} could be mapped to multiple blockchains.")
            } else if (whitelist.blockchains.isNotEmpty() && !whitelist.blockchains.contains(blockchainForSignup.first())) {
                throw WhitelistRequirementNotMetException("Signup failed for whitelist $whitelistId on server ${discordServer.guildId} as address ${whitelistSignup.address} is not on the blockchains allowed for this whitelist.")
            }
            whitelistSignup.blockchain = blockchainForSignup.first()
        } else if (whitelist.type == WhitelistType.DISCORD_ID) {
            whitelistSignup.address = null
        }
        // Remove existing signup (currently only one per external account possible)
        whitelist.signups.removeIf { it.externalAccountId == whitelistSignup.externalAccountId }
        whitelistSignup.signupTime = Date.from(ZonedDateTime.now().toInstant())
        val added = whitelist.signups.add(whitelistSignup)
        discordWhitelistRepository.save(whitelist)
        if (added && whitelist.awardedRole != null) {
            roleAssignmentService.publishWhitelistRoleAssignmentsForGuildMember(discordServer.guildId, whitelistSignup.externalAccountId)
        }
        return whitelistSignup
    }

    @Transactional
    fun deleteWhitelistSignup(guildId: Long, whitelistId: Long, externalAccountId: Long) {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        val whitelist = getWhitelistById(discordServer, whitelistId)
        val removed = whitelist.signups.removeIf { it.externalAccountId == externalAccountId }
        discordWhitelistRepository.save(whitelist)
        if (removed && whitelist.awardedRole != null) {
            roleAssignmentService.publishWhitelistRoleAssignmentsForGuildMember(discordServer.guildId, externalAccountId)
        }
    }

    fun getWhitelistSignup(guildId: Long, whitelistId: Long, externalAccountId: Long): io.hazelnet.community.data.discord.whitelists.WhitelistSignup {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        val whitelist = getWhitelistById(discordServer, whitelistId)
        return whitelist.signups.find { it.externalAccountId == externalAccountId }
            ?: throw NoSuchElementException("No whitelist registration found for external account $externalAccountId for whitelist ID $whitelistId on Discord server ${discordServer.guildId}")
    }

    @Transactional
    fun addWhitelistAutojoin(guildId: Long, whitelistIdOrName: String, autojoin: NewWhitelistAutojoinDto): WhitelistAutojoinDto {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        val whitelist = getWhitelistByIdOrName(whitelistIdOrName, discordServer)
        val existingAutojoin = whitelist.autojoins.find { it.address == autojoin.address && it.blockchain == autojoin.blockchain }
        if (existingAutojoin != null) {
            return existingAutojoin.toDto()
        }
        val autojoinEntity = WhitelistAutojoin(
            address = autojoin.address,
            blockchain = autojoin.blockchain,
            autojoinCreation = Date.from(ZonedDateTime.now().toInstant())
        )
        whitelist.autojoins.add(autojoinEntity)
        discordWhitelistRepository.save(whitelist)
        return autojoinEntity.toDto()
    }

    @Scheduled(fixedDelay = 3600, timeUnit = TimeUnit.SECONDS, initialDelay = 60)
    @Transactional
    fun autojoinWhitelists() {
        val openAutojoins = discordWhitelistRepository.findOpenNonCardanoAutojoins()
        logger.info { "Found ${openAutojoins.size} open autojoins to process across all servers and users." }
        autoJoinWhitelists(openAutojoins)
    }

    @Transactional
    fun autojoinWhitelistsForUser(externalAccountId: Long) {
        val openAutojoins = discordWhitelistRepository.findOpenNonCardanoAutojoinsForExternalAccount(externalAccountId)
        logger.info { "Found ${openAutojoins.size} open autojoins to process for external account $externalAccountId." }
        autoJoinWhitelists(openAutojoins)
    }

    fun autoJoinWhitelists(openAutojoins: List<AutojoinProjection>) {
        val discordServerMap = mutableMapOf<Int, DiscordServer>()
        val whitelistMap = mutableMapOf<Long, Whitelist>()
        openAutojoins.forEach {
            logger.debug { "Autojoining address ${it.getAddress()} on Discord server ${it.getDiscordServerId()} to whitelist ${it.getDiscordWhitelistId()}" }
            val discordServer = discordServerMap.getOrPut(it.getDiscordServerId()) {
                discordServerRetriever.getDiscordServerByInternalId(it.getDiscordServerId())
            }
            val whitelist = whitelistMap.getOrPut(it.getDiscordWhitelistId()) {
                getWhitelistById(discordServer, it.getDiscordWhitelistId())
            }
            val externalAccount = externalAccountService.getExternalAccount(it.getExternalAccountId())
            val signup = io.hazelnet.community.data.discord.whitelists.WhitelistSignup(
                externalAccountId = externalAccount.id!!,
                address = it.getAddress(),
                blockchain = it.getBlockchain(),
                signupTime = Date.from(ZonedDateTime.now().toInstant())
            )
            whitelist.signups.add(signup)
            discordWhitelistRepository.save(whitelist)
            if (whitelist.awardedRole != null) {
                roleAssignmentService.publishWhitelistRoleAssignmentsForGuildMember(
                    discordServer.guildId,
                    externalAccount.id!!
                )
            }
        }
    }

    fun getExternalAccountWhitelists(externalAccountId: Long): List<SummarizedWhitelistSignup> {
        externalAccountService.getExternalAccount(externalAccountId)
        val whitelists = discordWhitelistRepository.findBySignupsOfExternalAccount(externalAccountId)
        return whitelists.map {
            val discordServer = discordServerRetriever.getDiscordServerByInternalId(it.discordServerId)
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

    companion object {
        private val logger = KotlinLogging.logger {}
    }

}