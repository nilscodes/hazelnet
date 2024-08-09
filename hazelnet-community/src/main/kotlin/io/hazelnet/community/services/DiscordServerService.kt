package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo
import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.EmbeddableSetting
import io.hazelnet.community.data.cardano.Stakepool
import io.hazelnet.community.data.cardano.TokenPolicy
import io.hazelnet.community.data.claim.ClaimList
import io.hazelnet.community.data.claim.ClaimListsWithProducts
import io.hazelnet.community.data.claim.PhysicalOrder
import io.hazelnet.community.data.claim.PhysicalProduct
import io.hazelnet.community.data.discord.*
import io.hazelnet.community.persistence.*
import io.hazelnet.community.persistence.data.TokenOwnershipRoleRepository
import io.micrometer.core.instrument.Gauge
import io.micrometer.core.instrument.MeterRegistry
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.cache.annotation.Cacheable
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*
import javax.transaction.Transactional

const val LOOKUP_NAME_ALL_POOLS = "all"
const val MIN_PAUSE_BETWEEN_MANUAL_LINKING = 24 * 60 * 60 * 1000L

@Service
class DiscordServerService(
    private val stakepoolService: StakepoolService,
    private val verificationService: VerificationService,
    private val connectService: ConnectService,
    private val discordServerRepository: DiscordServerRepository,
    private val discordDelegatorRoleRepository: DiscordDelegatorRoleRepository,
    private val discordTokenOwnershipRoleRepository: DiscordTokenOwnershipRoleRepository,
    private val discordTokenRoleMetadataFilterRepository: DiscordTokenRoleMetadataFilterRepository,
    private val externalAccountService: ExternalAccountService,
    private val claimListService: ClaimListService,
    private val globalCommunityService: GlobalCommunityService,
    private val roleAssignmentService: RoleAssignmentService,
    private val discordMemberActivityRepository: DiscordMemberActivityRepository,
    private val rabbitTemplate: RabbitTemplate,
    private val apiTokenService: ApiTokenService,
    private val config: CommunityApplicationConfiguration,
    tokenOwnershipRoleRepository: TokenOwnershipRoleRepository,
    meterRegistry: MeterRegistry,
) {
    private val lastManualUserLinking: MutableMap<Long, Date> = mutableMapOf()

    init {
        Gauge.builder("discord_lifetime_server_count", discordServerRepository) {
            it.count().toDouble()
        }
            .description("Lifetime number of Discord servers")
            .register(meterRegistry)
        Gauge.builder("discord_active_server_count", discordServerRepository) {
            it.countByActive(true).toDouble()
        }
            .description("Number of currently active Discord servers")
            .register(meterRegistry)
        Gauge.builder("discord_premium_server_count", discordServerRepository) {
            it.countByPremiumUntilAfter(Date()).toDouble()
        }
            .description("Number of currently active premium Discord servers")
            .register(meterRegistry)
        Gauge.builder("discord_server_user_count_total", discordServerRepository) {
            it.sumGuildMemberCountForActiveServers().toDouble()
        }
            .description("Total member count across all Discord servers (with duplicates)")
            .register(meterRegistry)
        Gauge.builder("discord_token_role_count_total", tokenOwnershipRoleRepository) {
            it.count().toDouble()
        }
            .description("Total active token roles")
            .register(meterRegistry)
    }

    @Transactional
    fun addDiscordServer(discordServer: DiscordServer): DiscordServer {
        discordServer.joinTime = Date.from(ZonedDateTime.now().toInstant())
        discordServer.settings.add(EmbeddableSetting(DiscordSettings.PROTECTION_ADDR_REMOVAL.name, true.toString()))
        augmentWithSponsoredInfo(discordServer)
        return discordServerRepository.save(discordServer)
    }

    fun augmentWithSponsoredInfo(discordServer: DiscordServer) {
        val allSettings = globalCommunityService.getSettings()
        val sponsoredGuild = allSettings
            .filter { it.key.startsWith("SPONSORED_GUILDS_") }
            .map { Pair(it.key.substring("SPONSORED_GUILDS_".length).toInt(), it.value.split(",").map { guildId -> guildId.toLong() }.toSet()) }
            .find { it.second.contains(discordServer.guildId) }
            ?.first
        if (sponsoredGuild != null) {
            discordServer.settings.add(EmbeddableSetting("SPONSORED_BY", sponsoredGuild.toString()))
            allSettings
                .filter { it.key.startsWith("SPONSOR_${sponsoredGuild}_") }
                .forEach { discordServer.settings.add(EmbeddableSetting(it.key.substring("SPONSOR_${sponsoredGuild}_".length), it.value)) }
        }
    }

    fun getDiscordServer(guildId: Long): DiscordServer {
        return discordServerRepository.findByGuildId(guildId)
                .orElseThrow { NoSuchElementException("No Discord Server with guild ID $guildId found") }
    }

    fun getDiscordServerWithStakepoolInfo(guildId: Long): DiscordServer {
        val discordServer = getDiscordServer(guildId)
        val stakepoolMap = stakepoolService.getStakepools()
        discordServer.stakepools.map { it.info = stakepoolMap[it.poolHash] }
        return discordServer
    }

    fun getDiscordServerByInternalId(serverId: Int): DiscordServer {
        return discordServerRepository.findById(serverId)
            .orElseThrow { NoSuchElementException("No Discord Server with server ID $serverId found") }
    }

    fun updateDiscordServer(guildId: Long, discordServerPartial: DiscordServerPartial): DiscordServer {
        val discordServer = getDiscordServer(guildId)
        if (discordServerPartial.guildMemberCount != null) {
            discordServer.guildMemberCount = discordServerPartial.guildMemberCount
            discordServer.guildMemberUpdateTime = Date.from(ZonedDateTime.now().toInstant())
        }
        if (discordServerPartial.guildName != null) {
            discordServer.guildName = discordServerPartial.guildName
        }
        if (discordServerPartial.guildOwner != null) {
            discordServer.guildOwner = discordServerPartial.guildOwner
        }
        if (discordServerPartial.active != null) {
            discordServer.active = discordServerPartial.active
        }
        if (discordServerPartial.referral != null && discordServer.referral == null) { // Can only set referral once
            discordServer.referral = discordServerPartial.referral
        }
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

    fun updateTokenOwnershipRole(guildId: Long, tokenRoleId: Long, tokenOwnershipRolePartial: TokenOwnershipRolePartial): TokenOwnershipRole {
        val tokenOwnershipRole = getTokenRole(guildId, tokenRoleId)
        if (tokenOwnershipRolePartial.acceptedAssets != null) {
            tokenOwnershipRole.acceptedAssets = tokenOwnershipRolePartial.acceptedAssets
        }
        if (tokenOwnershipRolePartial.aggregationType != null) {
            tokenOwnershipRole.aggregationType = tokenOwnershipRolePartial.aggregationType
        }
        if (tokenOwnershipRolePartial.minimumTokenQuantity != null) {
            tokenOwnershipRole.minimumTokenQuantity = tokenOwnershipRolePartial.minimumTokenQuantity
        }
        if (tokenOwnershipRolePartial.maximumTokenQuantity != null) {
            tokenOwnershipRole.maximumTokenQuantity = if (tokenOwnershipRolePartial.maximumTokenQuantity == 0L) null else tokenOwnershipRolePartial.maximumTokenQuantity
        }
        if (tokenOwnershipRolePartial.roleId != null) {
            tokenOwnershipRole.roleId = tokenOwnershipRolePartial.roleId
        }
        if (tokenOwnershipRolePartial.stakingType != null) {
            tokenOwnershipRole.stakingType = tokenOwnershipRolePartial.stakingType
        }
        discordTokenOwnershipRoleRepository.save(tokenOwnershipRole)
        return tokenOwnershipRole
    }

    fun addMetadataFilterToTokenRole(guildId: Long, tokenRoleId: Long, tokenRoleMetadataFilter: TokenRoleMetadataFilter): TokenRoleMetadataFilter {
        val tokenRole = getTokenRole(guildId, tokenRoleId)
        discordTokenRoleMetadataFilterRepository.save(tokenRoleMetadataFilter)
        tokenRole.filters.add(tokenRoleMetadataFilter)
        discordTokenOwnershipRoleRepository.save(tokenRole)
        return tokenRoleMetadataFilter
    }

    @Transactional
    fun addMember(guildId: Long, discordMember: DiscordMember): DiscordMember {
        val discordServer = getDiscordServer(guildId)
        discordMember.joinTime = Date.from(ZonedDateTime.now().toInstant())
        discordServer.members.add(discordMember)
        discordServerRepository.save(discordServer)
        val lastManualUserLinkingForUser = lastManualUserLinking[discordMember.externalAccountId]
        if (lastManualUserLinkingForUser == null
            || lastManualUserLinkingForUser.before(Date(System.currentTimeMillis() - MIN_PAUSE_BETWEEN_MANUAL_LINKING))
        ) {
            lastManualUserLinking[discordMember.externalAccountId] = Date()
            roleAssignmentService.publishRoleAssignmentsForGuildMember(discordServer.guildId, discordMember.externalAccountId)
        }
        return discordMember
    }

    fun getMember(guildId: Long, externalAccountId: Long): DiscordMember {
        val discordServer = getDiscordServer(guildId)
        return getMember(discordServer, externalAccountId)
    }

    private fun getMember(discordServer: DiscordServer, externalAccountId: Long)
        = discordServer.members.find { it.externalAccountId == externalAccountId } ?: throw NoSuchElementException("No discord member with external account ID $externalAccountId found on guild ${discordServer.guildId}")

    @Transactional
    fun updateMember(guildId: Long, externalAccountId: Long, discordMemberPartial: DiscordMemberPartial): DiscordMember {
        val discordServer = getDiscordServer(guildId)
        val member = getMember(discordServer, externalAccountId)
        member.premiumSupport = discordMemberPartial.premiumSupport
        discordServerRepository.save(discordServer)
        discordServerRepository.resetPremiumWeightForExternalAccount(externalAccountId)
        return member
    }

    fun removeMember(guildId: Long, externalAccountId: Long, skipRoleUpdates: Boolean) {
        val discordServer = getDiscordServer(guildId)
        discordServer.members.removeIf { it.externalAccountId == externalAccountId }
        discordServerRepository.save(discordServer)
        if (!skipRoleUpdates) {
            roleAssignmentService.publishRemoveRoleAssignmentsForGuildMember(discordServer.guildId, externalAccountId)
        }
    }

    fun getMembers(guildId: Long): Set<DiscordMember> {
        return getDiscordServer(guildId).members
    }

    fun getTokenPolicies(guildId: Long) = getDiscordServer(guildId).tokenPolicies.toSet()
    fun getTokenRoles(guildId: Long) = getDiscordServer(guildId).tokenRoles.toSet()
    fun getDelegatorRoles(guildId: Long) = getDiscordServer(guildId).delegatorRoles.toSet()
    fun getStakepools(guildId: Long) = getDiscordServerWithStakepoolInfo(guildId).stakepools.toSet()
    fun getWhitelists(guildId: Long) = getDiscordServer(guildId).whitelists.toSet()

    fun updateSettings(guildId: Long, embeddableSetting: EmbeddableSetting): EmbeddableSetting {
        val discordServer = getDiscordServer(guildId)
        discordServer.settings.removeIf { it.name == embeddableSetting.name }
        discordServer.settings.add(embeddableSetting)
        discordServerRepository.save(discordServer)
        return embeddableSetting
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
        getDelegatorRole(guildId, delegatorRoleId) // Verify existence
        discordDelegatorRoleRepository.deleteById(delegatorRoleId)
    }

    fun deleteTokenOwnershipRole(guildId: Long, tokenRoleId: Long) {
        getTokenRole(guildId, tokenRoleId) // Verify existence
        discordTokenOwnershipRoleRepository.deleteById(tokenRoleId)
    }

    fun deleteMetadataFilterFromTokenRole(guildId: Long, tokenRoleId: Long, filterId: Long) {
        val tokenRole = getTokenRole(guildId, tokenRoleId)
        val metadataFilter = tokenRole.filters
            .find { it.id == filterId } ?: throw NoSuchElementException("No filter with ID $filterId found on token role with ID $tokenRoleId on guild $guildId")
        discordTokenRoleMetadataFilterRepository.delete(metadataFilter)
    }

    private fun getTokenRole(
        guildId: Long,
        tokenRoleId: Long
    ): TokenOwnershipRole {
        val discordServer = getDiscordServer(guildId)
        return discordServer.tokenRoles
            .find { it.id == tokenRoleId }
            ?: throw NoSuchElementException("No token role with ID $tokenRoleId found on guild $guildId")
    }

    private fun getDelegatorRole(
        guildId: Long,
        delegatorRoleId: Long
    ): DelegatorRole {
        val discordServer = getDiscordServer(guildId)
        return discordServer.delegatorRoles
            .find { it.id == delegatorRoleId }
            ?: throw NoSuchElementException("No delegator role with ID $delegatorRoleId found on guild $guildId")
    }

    fun getDiscordServers(): Iterable<DiscordServer> = discordServerRepository.findAll()

    fun getAllCurrentTokenRoleAssignmentsForGuild(guildId: Long): Set<DiscordRoleAssignment> {
        val discordServer = getDiscordServer(guildId)
        val allVerificationsOfMembers = verificationService.getAllCompletedVerificationsForDiscordServer(discordServer.id!!)
        return roleAssignmentService.getAllCurrentTokenRoleAssignmentsForVerifications(allVerificationsOfMembers, discordServer)
    }

    fun getAllCurrentDelegatorRoleAssignmentsForGuild(guildId: Long): Set<DiscordRoleAssignment> {
        val discordServer = getDiscordServer(guildId)
        // Calculating live stake is currently very expensive (3 minutes for a small pool vs 2 seconds for the same data without amounts), so if below a certain threshold, we skip the amount calculation in DB sync
        val hasRoleWithAmountOverThreshold = discordServer.delegatorRoles.any { it.minimumStake > config.connect.ignoreAmountIfStakeBelow }
        val allDelegationToAllowedPools = connectService.getActiveDelegationForPools(discordServer.stakepools.map { it.poolHash }, !hasRoleWithAmountOverThreshold)
            .map {
                if (!hasRoleWithAmountOverThreshold) {
                    it.copy(amount = config.connect.ignoreAmountIfStakeBelow)
                } else {
                    it
                }
            }
        val allVerificationsOfMembers = verificationService.getAllCompletedVerificationsForDiscordServer(discordServer.id!!)
        return roleAssignmentService.getAllCurrentDelegatorRoleAssignmentsForVerifications(allVerificationsOfMembers, allDelegationToAllowedPools, discordServer)
    }

    fun getAllCurrentWhitelistRoleAssignmentsForGuild(guildId: Long) =
        roleAssignmentService.getAllCurrentWhitelistRoleAssignmentsForGuild(
            getDiscordServer(guildId)
        )

    fun getAllCurrentQuizRoleAssignmentsForGuild(guildId: Long) =
        roleAssignmentService.getAllCurrentQuizRoleAssignmentsForGuild(
            getDiscordServer(guildId)
        )

    fun regenerateAccessToken(guildId: Long): String {
        getDiscordServer(guildId)
        return apiTokenService.regenerateAccessToken(guildId)
    }

    fun deleteAccessToken(guildId: Long) {
        getDiscordServer(guildId)
        apiTokenService.deleteAccessToken(guildId)
    }

    fun getEligibleTokenRolesOfUser(guildId: Long, externalAccountId: Long): Set<DiscordRoleAssignment> {
        val discordServer = getDiscordServer(guildId)
        return roleAssignmentService.getAllCurrentTokenRoleAssignmentsForGuildMember(discordServer, externalAccountId)
    }

    fun getEligibleDelegatorRolesOfUser(guildId: Long, externalAccountId: Long): Set<DiscordRoleAssignment> {
        val discordServer = getDiscordServer(guildId)
        return roleAssignmentService.getAllCurrentDelegatorRoleAssignmentsForGuildMember(discordServer, externalAccountId)
    }

    @Transactional
    fun queueRoleAssignments(guildId: Long, externalAccountId: Long) {
        val discordServer = getDiscordServer(guildId)
        val discordMember = getMember(discordServer, externalAccountId)
        roleAssignmentService.publishRoleAssignmentsForGuildMember(discordServer.guildId, discordMember.externalAccountId)
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

    /**
     * This cache never expires, it is minimal and the data in the database can never change
     */
    @Cacheable(cacheNames = ["serverIdToGuildId"])
    fun getGuildIdFromServerId(discordServerId: Int): Long {
        return try {
            getDiscordServerByInternalId(discordServerId).guildId
        } catch (e: NoSuchElementException) {
            0
        }
    }

    fun updateMemberActivity(activityMap: Map<String, Long>) {
        val guildIdToServerIdMap = mutableMapOf<Long, Int>()
        activityMap.forEach { activityEntry ->
            val (guildId, userId) = activityEntry.key.split("-")
            val serverId = guildIdToServerIdMap.computeIfAbsent(guildId.toLong()) {
                getDiscordServer(it).id!!
            }
            val activity = DiscordMemberActivity(serverId, userId.toLong(), Date(activityEntry.value), null)
            discordMemberActivityRepository.save(activity)
        }
    }

    @Scheduled(fixedDelay = 3600000, initialDelay = 5000)
    fun sendRemindersForInactiveUsers() {
        val discordsWithReminderFeature = discordServerRepository.findDiscordServersForActivityReminders()
        discordsWithReminderFeature.forEach { discordServer ->
            if (discordServer.getPremium()
                || (discordServer.settings.find { it.name == "FREE_FEATURES" }?.value?.contains("configure-engagement-activityreminder", ignoreCase = true) == true)) {
                val (channelIdString, activityThresholdString) = discordServer.settings.find { it.name == "ACTIVITY_REMINDER" }?.value?.split(",") ?: listOf("", "")
                sendActivityReminders(activityThresholdString, channelIdString, discordServer, true)
                val (resendChannelIdString, reminderResendThresholdString) = discordServer.settings.find { it.name == "ACTIVITY_REMINDER_RESEND" }?.value?.split(",") ?: listOf("", "")
                sendActivityReminders(reminderResendThresholdString, resendChannelIdString, discordServer, false)
            }
        }
    }

    private fun sendActivityReminders(
        activityThresholdString: String,
        channelIdString: String,
        discordServer: DiscordServer,
        initialReminder: Boolean,
    ) {
        if (activityThresholdString.isNotBlank()) {
            val activityThreshold = Date(System.currentTimeMillis() - activityThresholdString.toLong() * 1000)
            val channelId = channelIdString.toLong()
            val userIdsOfInactiveUsers = if (initialReminder) {
                discordMemberActivityRepository.findUsersThatNeedActivityReminder(discordServer.id!!, activityThreshold)
            } else {
                discordMemberActivityRepository.findUsersThatNeedActivityReminderResend(discordServer.id!!, activityThreshold)
            }
            userIdsOfInactiveUsers.forEach {
                rabbitTemplate.convertAndSend(
                    "activityreminders", DiscordActivityReminder(
                        guildId = discordServer.guildId,
                        userId = it.discordUserId!!,
                        channelId = channelId,
                    )
                )
                discordMemberActivityRepository.updateLastReminderTime(it.discordServerId!!, it.discordUserId!!, Date())
            }
        }
    }


}