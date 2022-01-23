package io.hazelnet.community.services

import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.discord.DiscordServerSetting
import io.hazelnet.community.data.Verification
import io.hazelnet.community.data.cardano.Stakepool
import io.hazelnet.community.data.cardano.TokenPolicy
import io.hazelnet.community.data.discord.*
import io.hazelnet.community.persistence.DiscordDelegatorRoleRepository
import io.hazelnet.community.persistence.DiscordServerRepository
import io.hazelnet.community.persistence.DiscordTokenOwnershipRoleRepository
import io.hazelnet.community.persistence.DiscordWhitelistRepository
import org.springframework.security.oauth2.core.AuthorizationGrantType
import org.springframework.security.oauth2.core.OAuth2AccessToken
import org.springframework.security.oauth2.server.authorization.OAuth2Authorization
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository
import org.springframework.stereotype.Service
import java.lang.NumberFormatException
import java.time.Duration
import java.time.Instant
import java.time.ZonedDateTime
import java.util.*
import javax.transaction.Transactional
import kotlin.NoSuchElementException

const val LOOKUP_NAME_ALL_POOLS = "all"

@Service
class DiscordServerService(
        private val stakepoolService: StakepoolService,
        private val verificationService: VerificationService,
        private val connectService: ConnectService,
        private val discordServerRepository: DiscordServerRepository,
        private val discordDelegatorRoleRepository: DiscordDelegatorRoleRepository,
        private val discordTokenOwnershipRoleRepository: DiscordTokenOwnershipRoleRepository,
        private val discordWhitelistRepository: DiscordWhitelistRepository,
        private val oAuth2AuthorizationService: OAuth2AuthorizationService,
        private val registeredClientRepository: RegisteredClientRepository,
        private val config: CommunityApplicationConfiguration
) {
    fun addDiscordServer(discordServer: DiscordServer): DiscordServer {
        discordServer.joinTime = Date.from(ZonedDateTime.now().toInstant())
        discordServer.settings.add(DiscordServerSetting(DiscordSettings.PROTECTION_ADDR_REMOVAL.name, true.toString()))
        return discordServerRepository.save(discordServer)
    }

    fun getDiscordServer(guildId: Long): DiscordServer {
        val discordServer = discordServerRepository.findByGuildId(guildId)
                .orElseThrow { NoSuchElementException("No Discord Server with guild ID $guildId found") }
        val stakepoolMap = stakepoolService.getStakepools()
        discordServer.stakepools.map { it.info = stakepoolMap[it.poolHash] }
        return discordServer
    }

    fun addTokenPolicy(guildId: Long, tokenPolicy: TokenPolicy): TokenPolicy {
        val discordServer = getDiscordServer(guildId)
        discordServer.tokenPolicies.add(tokenPolicy)
        discordServerRepository.save(discordServer)
        return tokenPolicy
    }

    fun addStakepool(guildId: Long, stakepool: Stakepool): Stakepool {
        val discordServer = getDiscordServer(guildId)
        this.confirmValidPoolAndUpdateHashIfNeeded(stakepool)
        discordServer.stakepools.add(stakepool)
        discordServerRepository.save(discordServer)
        val stakepoolMap = stakepoolService.getStakepools()
        stakepool.info = stakepoolMap[stakepool.poolHash]
        return stakepool
    }

    private fun confirmValidPoolAndUpdateHashIfNeeded(stakepool: Stakepool) {
        val validPools = if (stakepool.poolHash.startsWith("pool1")) {
            connectService.resolvePoolView(stakepool.poolHash)
        } else {
            connectService.resolvePoolHash(stakepool.poolHash)
        }
        if (!validPools.isEmpty()) {
            stakepool.poolHash = validPools[0].hash
            return
        }
        throw NoSuchElementException("No stakepool found with pool ID ${stakepool.poolHash}")
    }

    fun addDelegatorRole(guildId: Long, delegatorRole: DelegatorRole): DelegatorRole {
        val discordServer = getDiscordServer(guildId)
        discordDelegatorRoleRepository.save(delegatorRole)
        discordServer.delegatorRoles.add(delegatorRole)
        discordServerRepository.save(discordServer)
        return delegatorRole
    }

    fun addTokenOwnershipRole(guildId: Long, tokenOwnershipRole: TokenOwnershipRole): TokenOwnershipRole {
        val discordServer = getDiscordServer(guildId)
        discordTokenOwnershipRoleRepository.save(tokenOwnershipRole)
        discordServer.tokenRoles.add(tokenOwnershipRole)
        discordServerRepository.save(discordServer)
        return tokenOwnershipRole
    }

    fun addWhitelist(guildId: Long, whitelist: Whitelist): Whitelist {
        val discordServer = getDiscordServer(guildId)
        discordWhitelistRepository.save(whitelist)
        discordServer.whitelists.add(whitelist)
        discordServerRepository.save(discordServer)
        return whitelist
    }

    fun addMember(guildId: Long, discordMember: DiscordMember): DiscordMember {
        val discordServer = getDiscordServer(guildId)
        discordMember.joinTime = Date.from(ZonedDateTime.now().toInstant())
        discordServer.members.add(discordMember)
        discordServerRepository.save(discordServer)
        return discordMember
    }

    fun removeMember(guildId: Long, externalAccountId: Long) {
        val discordServer = getDiscordServer(guildId)
        discordServer.members.removeIf { it.externalAccountId == externalAccountId }
        discordServerRepository.save(discordServer)
    }

    fun getMembers(guildId: Long): Set<DiscordMember> {
        return getDiscordServer(guildId).members
    }

    fun updateSettings(guildId: Long, discordServerSetting: DiscordServerSetting): DiscordServerSetting {
        val discordServer = getDiscordServer(guildId)
        discordServer.settings.removeIf { it.name == discordServerSetting.name }
        discordServer.settings.add(discordServerSetting)
        discordServerRepository.save(discordServer)
        return discordServerSetting
    }

    fun deleteSettings(guildId: Long, settingName: String) {
        val discordServer = getDiscordServer(guildId)
        discordServer.settings.removeIf { it.name == settingName }
        discordServerRepository.save(discordServer)
    }


    fun deleteTokenPolicy(guildId: Long, policyId: String) {
        val discordServer = getDiscordServer(guildId)
        discordServer.tokenPolicies.removeIf { it.policyId.equals(policyId, ignoreCase = true) }
        discordServerRepository.save(discordServer)
    }

    fun deleteStakepool(guildId: Long, poolHash: String) {
        val discordServer = getDiscordServer(guildId)
        discordServer.stakepools.removeIf { it.poolHash.equals(poolHash, ignoreCase = true) }
        discordServerRepository.save(discordServer)
    }

    fun deleteDelegatorRole(guildId: Long, delegatorRoleId: Long) {
        discordDelegatorRoleRepository.deleteById(delegatorRoleId)
    }

    fun deleteTokenOwnershipRole(guildId: Long, tokenRoleId: Long) {
        discordTokenOwnershipRoleRepository.deleteById(tokenRoleId)
    }

    fun deleteWhitelist(guildId: Long, whitelistId: Long) {
        discordWhitelistRepository.deleteById(whitelistId)
    }

    fun getWhitelistSignups(guildId: Long, whitelistIdOrName: String): Set<WhitelistSignup> {
        val discordServer = getDiscordServer(guildId)
        return try {
            val whitelistId = whitelistIdOrName.toLong()
            return getWhitelistById(discordServer, whitelistId).signups
        }
        catch(e: NumberFormatException) {
            getWhitelistByName(discordServer, whitelistIdOrName).signups
        }
    }

    private fun getWhitelistById(discordServer: DiscordServer, whitelistId: Long) =
            discordServer.whitelists.find { it.id == whitelistId }
                    ?: throw NoSuchElementException("No whitelist with ID $whitelistId found on Discord server ${discordServer.guildId}")

    private fun getWhitelistByName(discordServer: DiscordServer, whitelistName: String) =
            discordServer.whitelists.find { it.name == whitelistName }
                    ?: throw NoSuchElementException("No whitelist with name $whitelistName found on Discord server ${discordServer.guildId}")

    @Transactional
    fun addWhitelistSignup(guildId: Long, whitelistId: Long, whitelistSignup: WhitelistSignup): WhitelistSignup {
        val discordServer = getDiscordServer(guildId)
        val whitelist = getWhitelistById(discordServer, whitelistId)
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
        // TODO might be sensible to verify if external account ID exists
        whitelistSignup.signupTime = Date.from(ZonedDateTime.now().toInstant())
        whitelist.signups.add(whitelistSignup)
        discordWhitelistRepository.save(whitelist)
        return whitelistSignup
    }

    @Transactional
    fun deleteWhitelistSignup(guildId: Long, whitelistId: Long, externalAccountId: Long) {
        val discordServer = getDiscordServer(guildId)
        val whitelist = getWhitelistById(discordServer, whitelistId)
        whitelist.signups.removeIf { it.externalAccountId == externalAccountId }
        discordWhitelistRepository.save(whitelist)
    }

    fun getWhitelistSignup(guildId: Long, whitelistId: Long, externalAccountId: Long): WhitelistSignup {
        val discordServer = getDiscordServer(guildId)
        val whitelist = getWhitelistById(discordServer, whitelistId)
        return whitelist.signups.find { it.externalAccountId == externalAccountId }
                ?: throw NoSuchElementException("No whitelist registration found for external account $externalAccountId for whitelist ID $whitelistId on Discord server ${discordServer.guildId}")
    }

    fun getDiscordServers(): Iterable<DiscordServer> = discordServerRepository.findAll()

    fun getCurrentTokenRolesAssignments(guildId: Long): Set<DiscordRoleAssignment> {
        val discordServer = getDiscordServer(guildId)
        val allVerificationsOfMembers = verificationService.getAllCompletedVerificationsForDiscordServer(discordServer.id!!)
        val allVerifiedStakeAddresses = allVerificationsOfMembers.mapNotNull { it.cardanoStakeAddress }
        val relevantPolicyIds   = discordServer.tokenRoles.map { it.policyId }
        if(relevantPolicyIds.isNotEmpty()) {
            val tokenOwnershipData = connectService.getAllTokenOwnership(allVerifiedStakeAddresses, relevantPolicyIds)
            val memberIdsToTokenPolicyOwnershipCounts = mutableMapOf<Long, Map<String, Long>>()
            val externalAccountLookup = mutableMapOf<Long, ExternalAccount>()
            allVerificationsOfMembers.forEach { verification ->
                val mapOfExternalAccount = prepareExternalAccountMap(verification, externalAccountLookup, memberIdsToTokenPolicyOwnershipCounts)
                relevantPolicyIds.forEach { policy ->
                    val tokenCountForStakeAddress = tokenOwnershipData.find { it.stakeAddress == verification.cardanoStakeAddress && it.policyId == policy }
                    tokenCountForStakeAddress?.let {
                        val newAmount = tokenCountForStakeAddress.assetCount
                        mapOfExternalAccount.compute(tokenCountForStakeAddress.policyId) { _, v ->
                            (v ?: 0) + newAmount
                        }
                    }
                }
            }

            return memberIdsToTokenPolicyOwnershipCounts.map { tokenOwnershipInfo ->
                discordServer.tokenRoles.mapNotNull { role ->
                    externalAccountLookup[tokenOwnershipInfo.key]?.let {
                        if ((tokenOwnershipInfo.value[role.policyId] ?: 0) >= role.minimumTokenQuantity) {
                            DiscordRoleAssignment(discordServer.guildId, it.referenceId.toLong(), role.roleId)
                        } else {
                            null
                        }
                    }
                }
            }.flatten().toSet()
        }
        return emptySet()
    }

    fun getCurrentDelegatorRoleAssignments(guildId: Long): Set<DiscordRoleAssignment> {
        val discordServer = getDiscordServer(guildId)
        val allDelegationToAllowedPools = connectService.getActiveDelegationForPools(discordServer.stakepools.map { it.poolHash })
        val allVerificationsOfMembers = verificationService.getAllCompletedVerificationsForDiscordServer(discordServer.id!!)
        val memberIdsToDelegationBuckets = mutableMapOf<Long, Map<String, Long>>()
        val externalAccountLookup = mutableMapOf<Long, ExternalAccount>()
        allVerificationsOfMembers.forEach { verification ->
            val mapOfExternalAccount = prepareExternalAccountMap(verification, externalAccountLookup, memberIdsToDelegationBuckets)
            val delegationForStakeAddress = allDelegationToAllowedPools.find { it.stakeAddress == verification.cardanoStakeAddress }
            delegationForStakeAddress?.let {
                val newAmount = delegationForStakeAddress.amount
                mapOfExternalAccount.compute(delegationForStakeAddress.poolHash) { _, v -> (v ?: 0) + newAmount }
                mapOfExternalAccount.compute(LOOKUP_NAME_ALL_POOLS) { _, v -> (v ?: 0) + newAmount }
            }
        }

        return memberIdsToDelegationBuckets.map { delegations ->
            discordServer.delegatorRoles.mapNotNull { role ->
                val lookupName = role.poolHash ?: LOOKUP_NAME_ALL_POOLS
                externalAccountLookup[delegations.key]?.let {
                    if ((delegations.value[lookupName] ?: 0) >= role.minimumStake) {
                        DiscordRoleAssignment(discordServer.guildId, it.referenceId.toLong(), role.roleId)
                    } else {
                        null
                    }
                }
            }
        }.flatten().toSet()
    }

    private fun prepareExternalAccountMap(verification: Verification, externalAccountLookup: MutableMap<Long, ExternalAccount>, memberIdsToTokenPolicyOwnershipCounts: MutableMap<Long, Map<String, Long>>): MutableMap<String, Long> {
        val externalAccountId = verification.externalAccount.id!!
        externalAccountLookup[externalAccountId] = verification.externalAccount
        return memberIdsToTokenPolicyOwnershipCounts.computeIfAbsent(externalAccountId) { mutableMapOf() } as MutableMap
    }

    fun regenerateAccessToken(guildId: Long): String {
        val discordServer = getDiscordServer(guildId)
        val snowflakeId = discordServer.guildId.toString()
        deleteTokenInternal(snowflakeId)

        val token = OAuth2AccessToken(OAuth2AccessToken.TokenType.BEARER, "${UUID.randomUUID()}.${discordServer.guildId}", Instant.now(), Instant.now().plus(Duration.ofDays(3600)), setOf("whitelist:read"))
        oAuth2AuthorizationService.save(OAuth2Authorization.withRegisteredClient(registeredClientRepository.findByClientId("hazelnet-external"))
                .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
                .id(snowflakeId)
                .token(token) { it["discord"] = snowflakeId }
                .attribute("discord", snowflakeId)
                .principalName(snowflakeId)
                .build())
        return token.tokenValue
    }

    private fun deleteTokenInternal(snowflakeId: String) {
        val existingAuthorization = oAuth2AuthorizationService.findById(snowflakeId)
        existingAuthorization?.let {
            oAuth2AuthorizationService.remove(it)
        }
    }

    fun deleteAccessToken(guildId: Long) {
        val discordServer = getDiscordServer(guildId)
        deleteTokenInternal(discordServer.guildId.toString())
    }

    fun getBotFunding(guildId: Long): Long {
        if(config.fundedpool != null) {
            val discordServer = getDiscordServer(guildId)
            val discordMemberDelegations = discordServerRepository.getDiscordMembersWithStake(discordServer.id!!)
            val stakeAddressesOnThisServer = discordMemberDelegations
                    .filter { it.getDiscordServerId() == discordServer.id }
                    .map { it.getCardanoStakeAddress() }
            // Get a map of stake addresses to number of servers each unique stake address is registered on (regardless of how many different users have registered it)
            val stakeAddressesToServerMembershipCounts = discordMemberDelegations
                    .groupBy { it.getCardanoStakeAddress() }
                    .mapValues { it.value.distinctBy { stakeInfo -> "${stakeInfo.getDiscordServerId()}.${stakeInfo.getCardanoStakeAddress()}" }.size }
            val allDelegationToFundedPool = connectService.getActiveDelegationForPools(listOf(config.fundedpool))
            // Divide each stake amount by the number of Discord servers the respective stake is verified on
            return allDelegationToFundedPool
                    .filter { stakeAddressesOnThisServer.contains(it.stakeAddress) }
                    .sumOf {
                        it.amount / (stakeAddressesToServerMembershipCounts[it.stakeAddress] ?: 1)
                    }
        }
        return 0
    }
}