package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo
import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.Verification
import io.hazelnet.community.data.cardano.Stakepool
import io.hazelnet.community.data.cardano.TokenPolicy
import io.hazelnet.community.data.claim.ClaimList
import io.hazelnet.community.data.claim.ClaimListsWithProducts
import io.hazelnet.community.data.claim.PhysicalOrder
import io.hazelnet.community.data.claim.PhysicalProduct
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
import java.time.Duration
import java.time.Instant
import java.time.ZonedDateTime
import java.util.*
import javax.transaction.Transactional

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
        private val externalAccountService: ExternalAccountService,
        private val claimListService: ClaimListService,
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

    fun updateDiscordServer(guildId: Long, discordServerPartial: DiscordServerPartial): DiscordServer {
        val discordServer = getDiscordServer(guildId)
        discordServer.guildMemberCount = discordServerPartial.guildMemberCount
        discordServer.guildName = discordServerPartial.guildName
        discordServer.guildOwner = discordServerPartial.guildOwner
        discordServer.guildMemberUpdateTime = Date.from(ZonedDateTime.now().toInstant())
        return discordServerRepository.save(discordServer)
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
        val validPools = getValidPools(stakepool.poolHash)
        if (validPools.isNotEmpty()) {
            stakepool.poolHash = validPools[0].hash
            return
        }
        throw NoSuchElementException("No stakepool found with pool ID ${stakepool.poolHash}")
    }

    private fun getValidPools(poolHash: String): List<StakepoolInfo> {
        val validPools = if (poolHash.startsWith("pool1")) {
            connectService.resolvePoolView(poolHash)
        } else {
            connectService.resolvePoolHash(poolHash)
        }
        return validPools
    }

    fun addDelegatorRole(guildId: Long, delegatorRole: DelegatorRole): DelegatorRole {
        val discordServer = getDiscordServer(guildId)
        this.confirmValidPoolAndUpdateHashIfNeeded(delegatorRole)
        discordDelegatorRoleRepository.save(delegatorRole)
        discordServer.delegatorRoles.add(delegatorRole)
        discordServerRepository.save(discordServer)
        return delegatorRole
    }

    private fun confirmValidPoolAndUpdateHashIfNeeded(delegatorRole: DelegatorRole) {
        if (delegatorRole.poolHash != null) {
            val validPools = getValidPools(delegatorRole.poolHash!!)
            if (validPools.isNotEmpty()) {
                delegatorRole.poolHash = validPools[0].hash
                return
            }
            throw NoSuchElementException("No stakepool found with pool ID ${delegatorRole.poolHash}")
        }
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
        whitelist.createTime = Date.from(ZonedDateTime.now().toInstant())
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


    fun getMember(guildId: Long, externalAccountId: Long): DiscordMember {
        val discordServer = getDiscordServer(guildId)
        return discordServer.members.find { it.externalAccountId == externalAccountId } ?: throw NoSuchElementException("No discord member with external account ID $externalAccountId found on guild $guildId")
    }

    fun updateMember(guildId: Long, externalAccountId: Long, discordMemberPartial: DiscordMemberPartial): DiscordMember {
        val discordServer = getDiscordServer(guildId)
        val member = discordServer.members.find { it.externalAccountId == externalAccountId } ?: throw NoSuchElementException("No discord member with external account ID $externalAccountId found on guild $guildId")
        member.premiumSupport = discordMemberPartial.premiumSupport
        discordServerRepository.save(discordServer)
        return member
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

    fun updateWhitelist(guildId: Long, whitelistId: Long, whitelistPartial: WhitelistPartial): Whitelist {
        val discordServer = getDiscordServer(guildId)
        val whitelistToUpdate = getWhitelistById(discordServer, whitelistId)
        whitelistToUpdate.closed = whitelistPartial.closed
        discordWhitelistRepository.save(whitelistToUpdate)
        return whitelistToUpdate
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
        val relevantPolicyIds = discordServer.tokenRoles.map { role ->
            role.acceptedAssets.map { it.policyId + (it.assetFingerprint ?: "") }
        }.flatten().toSet()
        if(relevantPolicyIds.isNotEmpty()) {
            val tokenOwnershipData = connectService.getAllTokenOwnershipByPolicyId(allVerifiedStakeAddresses, relevantPolicyIds)
            val memberIdsToTokenPolicyOwnershipCounts = mutableMapOf<Long, Map<String, Long>>()
            val externalAccountLookup = mutableMapOf<Long, ExternalAccount>()
            allVerificationsOfMembers.forEach { verification ->
                val mapOfExternalAccount = prepareExternalAccountMap(verification, externalAccountLookup, memberIdsToTokenPolicyOwnershipCounts)
                relevantPolicyIds.forEach { policy ->
                    val tokenCountForStakeAddress = tokenOwnershipData.find { it.stakeAddress == verification.cardanoStakeAddress && it.policyIdWithOptionalAssetFingerprint == policy }
                    tokenCountForStakeAddress?.let {
                        val newAmount = tokenCountForStakeAddress.assetCount
                        mapOfExternalAccount.compute(tokenCountForStakeAddress.policyIdWithOptionalAssetFingerprint) { _, v ->
                            (v ?: 0) + newAmount
                        }
                    }
                }
            }

            val rolesToAssign =
                if (discordServer.getPremium()) discordServer.tokenRoles
                else listOfNotNull(discordServer.tokenRoles.minByOrNull { it.id!! })

            return memberIdsToTokenPolicyOwnershipCounts.map { tokenOwnershipInfo ->
                rolesToAssign.mapNotNull { role ->
                    externalAccountLookup[tokenOwnershipInfo.key]?.let {
                        val tokenCount = role.acceptedAssets.sumOf { asset ->
                            val policyIdWithOptionalAssetFingerprint = asset.policyId + (asset.assetFingerprint ?: "")
                            (tokenOwnershipInfo.value[policyIdWithOptionalAssetFingerprint] ?: 0)
                        }

                        if (
                            tokenCount >= role.minimumTokenQuantity
                            && (role.maximumTokenQuantity == null || tokenCount <= role.maximumTokenQuantity!!)
                        ) {
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

        val rolesToAssign =
            if (discordServer.getPremium()) discordServer.delegatorRoles
            else listOfNotNull(discordServer.delegatorRoles.minByOrNull { it.id!! })

        return memberIdsToDelegationBuckets.map { delegations ->
            rolesToAssign.mapNotNull { role ->
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

    fun getEligibleClaimListsOfUser(guildId: Long, externalAccountId: Long): ClaimListsWithProducts {
        val discordServer = getDiscordServer(guildId)
        val discordMember = discordServer.members.find { it.externalAccountId == externalAccountId }
        if (discordMember != null) {
            val claimListsOfDiscord = claimListService.getClaimListsOfDiscordServer(discordServer.id!!)
            val confirmedStakeAddressesOfUser = externalAccountService.getExternalAccountVerifications(externalAccountId)
                .filter { it.confirmed }
                .mapNotNull { it.cardanoStakeAddress }
            val validClaimListsForMember = claimListsOfDiscord
                .filter { cl -> cl.claims.any { confirmedStakeAddressesOfUser.contains(it.stakeAddress) } }
                .map { ClaimList(it, confirmedStakeAddressesOfUser) }
            val applicableProductIds = validClaimListsForMember.map { cl -> cl.claims.map { it.claimableProduct } }.flatten()
            val applicableProducts = claimListService.getProducts(applicableProductIds).toList()
            return ClaimListsWithProducts(validClaimListsForMember, applicableProducts)
        }
        return ClaimListsWithProducts(emptyList(), emptyList())
    }

    fun getOrderOfUserForClaimList(guildId: Long, externalAccountId: Long, claimListId: Int): PhysicalOrder {
        getClaimListForDiscordServer(guildId, claimListId)
        return claimListService.getPhysicalOrderForUser(claimListId, externalAccountId)
    }

    fun setOrderOfUserForClaimList(guildId: Long, externalAccountId: Long, claimListId: Int, physicalOrder: PhysicalOrder): PhysicalOrder {
        getClaimListForDiscordServer(guildId, claimListId)
        return claimListService.addAndVerifyPhysicalOrder(claimListId, physicalOrder)
    }

    fun getAllOrdersForClaimList(guildId: Long, claimListIdOrName: String): List<PhysicalOrder> {
        val claimList = getClaimListForDiscordServer(guildId, claimListIdOrName)
        return claimListService.getPhysicalOrders(claimList.id!!)
    }

    fun getAllProductsForClaimList(guildId: Long, claimListIdOrName: String): List<PhysicalProduct> {
        val claimList = getClaimListForDiscordServer(guildId, claimListIdOrName)
        val availableProducts = claimList.claims.map { it.claimableProduct }
        return claimListService.getProducts(availableProducts).toList()
    }

    private fun getClaimListForDiscordServer(
        guildId: Long,
        claimListId: Int
    ): ClaimList {
        val discordServer = getDiscordServer(guildId)
        val claimListsOfDiscord = claimListService.getClaimListsOfDiscordServer(discordServer.id!!)
        val claimListForOrder = claimListsOfDiscord.find { claimListId == it.id }
        if (claimListForOrder != null) {
            return claimListForOrder
        }
        throw NoSuchElementException("No claim list with ID $claimListId found on Discord server with guild ID $guildId")
    }

    private fun getClaimListForDiscordServer(
        guildId: Long,
        claimListIdOrName: String
    ): ClaimList {
        return try {
            val claimListId = claimListIdOrName.toInt()
            return getClaimListForDiscordServer(guildId, claimListId)
        }
        catch(e: NumberFormatException) {
            val discordServer = getDiscordServer(guildId)
            val claimListsOfDiscord = claimListService.getClaimListsOfDiscordServer(discordServer.id!!)
            val claimListForOrder = claimListsOfDiscord.find { claimListIdOrName == it.name }
            claimListForOrder ?: throw NoSuchElementException("No claim list with name $claimListIdOrName found on Discord server with guild ID $guildId")
        }
    }

}