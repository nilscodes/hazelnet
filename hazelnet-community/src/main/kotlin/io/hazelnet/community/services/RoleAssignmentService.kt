package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.stakepool.DelegationInfo
import io.hazelnet.cardano.connect.data.token.MultiAssetInfo
import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.Verification
import io.hazelnet.community.data.discord.*
import io.hazelnet.community.persistence.DiscordServerRepository
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service

@Service
class RoleAssignmentService(
    private val connectService: ConnectService,
    private val externalAccountService: ExternalAccountService,
    private val rabbitTemplate: RabbitTemplate,
    private val discordServerRepository: DiscordServerRepository,
) {
    fun getAllCurrentTokenRoleAssignmentsForVerifications(
        verifications: List<Verification>,
        discordServer: DiscordServer
    ): Set<DiscordRoleAssignment> {
        val allVerifiedStakeAddresses = verifications.mapNotNull { it.cardanoStakeAddress }
        val rolesToAssign =
            if (discordServer.getPremium()) discordServer.tokenRoles
            else listOfNotNull(discordServer.tokenRoles.minByOrNull { it.id!! })

        val roleTypes = rolesToAssign.groupBy { it.filters.size > 0 }
        val countBasedRoles = roleTypes[false] ?: listOf()

        val countBasedRoleAssignments = getCountBasedTokenRoleAssignments(
            countBasedRoles,
            allVerifiedStakeAddresses,
            verifications,
            discordServer
        )

        val filterBasedRoles = roleTypes[true] ?: listOf()
        val filterBasedRoleAssignments = getMetadataBasedTokenRoleAssignments(
            filterBasedRoles,
            allVerifiedStakeAddresses,
            verifications,
            discordServer
        )

        return countBasedRoleAssignments + filterBasedRoleAssignments
    }

    private fun getMetadataBasedTokenRoleAssignments(
        filterBasedRoles: List<TokenOwnershipRole>,
        allVerifiedStakeAddresses: List<String>,
        allVerificationsOfMembers: List<Verification>,
        discordServer: DiscordServer
    ): MutableSet<DiscordRoleAssignment> {
        val relevantPolicyIds = filterBasedRoles.map { role ->
            role.acceptedAssets.map { it.policyId + (it.assetFingerprint ?: "") }
        }.flatten().toSet()
        val filterBasedRoleAssignments = mutableSetOf<DiscordRoleAssignment>()
        // TODO We could try to filter out all users that already received a role
        if (relevantPolicyIds.isNotEmpty()) {
            val tokenOwnershipData =
                connectService.getAllTokenOwnershipAssetsByPolicyId(allVerifiedStakeAddresses, relevantPolicyIds)
            val memberIdsToTokenPolicyOwnershipAssets = mutableMapOf<Long, MutableMap<String, MutableList<MultiAssetInfo>>>()
            val externalAccountLookup = mutableMapOf<Long, ExternalAccount>()
            allVerificationsOfMembers.forEach { verification ->
                val mapOfExternalAccount = prepareExternalAccountMapForAssetBased(
                    verification,
                    externalAccountLookup,
                    memberIdsToTokenPolicyOwnershipAssets
                )
                relevantPolicyIds.forEach { policy ->
                    val tokenListForStakeAddressAndPolicy =
                        tokenOwnershipData.find { it.stakeAddress == verification.cardanoStakeAddress && it.policyIdWithOptionalAssetFingerprint == policy }
                    tokenListForStakeAddressAndPolicy?.let {
                        val metadata =
                            connectService.getMultiAssetInfo(tokenListForStakeAddressAndPolicy.assetList.map { assetName ->
                                Pair(
                                    tokenListForStakeAddressAndPolicy.policyIdWithOptionalAssetFingerprint,
                                    assetName
                                )
                            })
                        val existingMetadata =
                            mapOfExternalAccount.computeIfAbsent(tokenListForStakeAddressAndPolicy.policyIdWithOptionalAssetFingerprint) { mutableListOf() }
                        existingMetadata.addAll(metadata)
                    }
                }
            }
            filterBasedRoleAssignments.addAll(memberIdsToTokenPolicyOwnershipAssets.map { tokenOwnershipInfo ->
                filterBasedRoles.mapNotNull { role ->
                    externalAccountLookup[tokenOwnershipInfo.key]?.let {
                        val tokenCount = calculateMatchedTokenCountForFiltered(role, tokenOwnershipInfo)
                        val (minimum, maximum) = getMinimumAndMaximumTokenCounts(role)

                        if (
                            tokenCount >= minimum
                            && (maximum == null || tokenCount <= maximum)
                        ) {
                            DiscordRoleAssignment(discordServer.guildId, it.referenceId.toLong(), role.roleId)
                        } else {
                            null
                        }
                    }
                }
            }.flatten().toSet())
        }
        return filterBasedRoleAssignments
    }

    private fun getMinimumAndMaximumTokenCounts(role: TokenOwnershipRole): Pair<Long, Long?> {
        val minimum = when (role.aggregationType) {
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_OR,
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_AND -> role.minimumTokenQuantity
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_ONE_EACH -> role.filters.size.toLong()
            TokenOwnershipAggregationType.EVERY_POLICY_FILTERED_OR -> role.acceptedAssets.size.toLong()
        }
        val maximum = when (role.aggregationType) {
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_OR,
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_AND -> role.maximumTokenQuantity
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_ONE_EACH -> null
            TokenOwnershipAggregationType.EVERY_POLICY_FILTERED_OR -> null
        }
        return Pair(minimum, maximum)
    }

    private fun calculateMatchedTokenCountForFiltered(
        role: TokenOwnershipRole,
        tokenOwnershipInfo: Map.Entry<Long, MutableMap<String, MutableList<MultiAssetInfo>>>
    ): Long {
        return when (role.aggregationType) {
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_OR,
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_AND -> {
                role.acceptedAssets.sumOf { asset ->
                    val policyIdWithOptionalAssetFingerprint = asset.policyId + (asset.assetFingerprint ?: "")
                    val ownedAssets = tokenOwnershipInfo.value[policyIdWithOptionalAssetFingerprint]
                    ownedAssets?.filter { assetInfo -> role.meetsFilterCriteria(assetInfo.metadata) }?.size ?: 0
                }.toLong()
            }
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_ONE_EACH -> {
                val matchingAssets = role.acceptedAssets.map { asset ->
                    val policyIdWithOptionalAssetFingerprint = asset.policyId + (asset.assetFingerprint ?: "")
                    val ownedAssets = tokenOwnershipInfo.value[policyIdWithOptionalAssetFingerprint]
                    ownedAssets?.filter { assetInfo -> role.meetsFilterCriteria(assetInfo.metadata) } ?: emptyList()
                }.flatten().toMutableList()

                role.filters.count { filter -> matchingAssets.removeIf { filter.apply(it.metadata) } }.toLong()
            }
            TokenOwnershipAggregationType.EVERY_POLICY_FILTERED_OR -> {
                role.acceptedAssets.sumOf { asset ->
                    val policyIdWithOptionalAssetFingerprint = asset.policyId + (asset.assetFingerprint ?: "")
                    val ownedAssets = tokenOwnershipInfo.value[policyIdWithOptionalAssetFingerprint]
                    if (ownedAssets?.any { assetInfo -> role.meetsFilterCriteria(assetInfo.metadata) } == true) {
                        1L
                    } else {
                        0L
                    }
                }
            }
        }
    }

    private fun getCountBasedTokenRoleAssignments(
        countBasedRoles: List<TokenOwnershipRole>,
        allVerifiedStakeAddresses: List<String>,
        allVerificationsOfMembers: List<Verification>,
        discordServer: DiscordServer
    ): Set<DiscordRoleAssignment> {
        val relevantPolicyIds = countBasedRoles.map { role ->
            role.acceptedAssets.map { it.policyId + (it.assetFingerprint ?: "") }
        }.flatten().toSet()
        if (relevantPolicyIds.isNotEmpty()) {
            val tokenOwnershipData =
                connectService.getAllTokenOwnershipCountsByPolicyId(allVerifiedStakeAddresses, relevantPolicyIds)
            val memberIdsToTokenPolicyOwnershipCounts = mutableMapOf<Long, Map<String, Long>>()
            val externalAccountLookup = mutableMapOf<Long, ExternalAccount>()
            allVerificationsOfMembers.forEach { verification ->
                val mapOfExternalAccount = prepareExternalAccountMapForCountBased(
                    verification,
                    externalAccountLookup,
                    memberIdsToTokenPolicyOwnershipCounts
                )
                relevantPolicyIds.forEach { policy ->
                    val tokenCountForStakeAddress =
                        tokenOwnershipData.find { it.stakeAddress == verification.cardanoStakeAddress && it.policyIdWithOptionalAssetFingerprint == policy }
                    tokenCountForStakeAddress?.let {
                        val newAmount = tokenCountForStakeAddress.assetCount
                        mapOfExternalAccount.compute(tokenCountForStakeAddress.policyIdWithOptionalAssetFingerprint) { _, v ->
                            (v ?: 0) + newAmount
                        }
                    }
                }
            }

            return memberIdsToTokenPolicyOwnershipCounts.map { tokenOwnershipInfo ->
                countBasedRoles.mapNotNull { role ->
                    externalAccountLookup[tokenOwnershipInfo.key]?.let {
                        val tokenCount = calculateMatchedTokenCountForCountBased(role, tokenOwnershipInfo)
                        val (minimum, maximum) = getMinimumAndMaximumTokenCounts(role)

                        if (
                            tokenCount >= minimum
                            && (maximum == null || tokenCount <= maximum)
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

    private fun calculateMatchedTokenCountForCountBased(
        role: TokenOwnershipRole,
        tokenOwnershipInfo: Map.Entry<Long, Map<String, Long>>
    ): Long {
        return when (role.aggregationType) {
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_OR,
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_AND,
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_ONE_EACH -> {
                role.acceptedAssets.sumOf { asset ->
                    val policyIdWithOptionalAssetFingerprint = asset.policyId + (asset.assetFingerprint ?: "")
                    (tokenOwnershipInfo.value[policyIdWithOptionalAssetFingerprint] ?: 0)
                }
            }
            TokenOwnershipAggregationType.EVERY_POLICY_FILTERED_OR -> {
                role.acceptedAssets.sumOf { asset ->
                    val policyIdWithOptionalAssetFingerprint = asset.policyId + (asset.assetFingerprint ?: "")
                    val ownedAssets = tokenOwnershipInfo.value[policyIdWithOptionalAssetFingerprint]
                    if (ownedAssets != null && ownedAssets > 0) {
                        1L
                    } else {
                        0L
                    }
                }
            }
        }
    }

    fun getAllCurrentDelegatorRoleAssignmentsForVerifications(
        allVerificationsOfMembers: List<Verification>,
        allDelegationToAllowedPools: List<DelegationInfo>,
        discordServer: DiscordServer
    ): Set<DiscordRoleAssignment> {
        val memberIdsToDelegationBuckets = mutableMapOf<Long, Map<String, Long>>()
        val externalAccountLookup = mutableMapOf<Long, ExternalAccount>()
        allVerificationsOfMembers.forEach { verification ->
            val mapOfExternalAccount = prepareExternalAccountMapForCountBased(
                verification,
                externalAccountLookup,
                memberIdsToDelegationBuckets
            )
            val delegationForStakeAddress =
                allDelegationToAllowedPools.find { it.stakeAddress == verification.cardanoStakeAddress }
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

    private fun prepareExternalAccountMapForCountBased(verification: Verification, externalAccountLookup: MutableMap<Long, ExternalAccount>, memberIdsToTokenPolicyOwnershipCounts: MutableMap<Long, Map<String, Long>>): MutableMap<String, Long> {
        val externalAccountId = verification.externalAccount.id!!
        externalAccountLookup[externalAccountId] = verification.externalAccount
        return memberIdsToTokenPolicyOwnershipCounts.computeIfAbsent(externalAccountId) { mutableMapOf() } as MutableMap
    }

    private fun prepareExternalAccountMapForAssetBased(verification: Verification, externalAccountLookup: MutableMap<Long, ExternalAccount>, memberIdsToTokenPolicyOwnershipCounts: MutableMap<Long, MutableMap<String, MutableList<MultiAssetInfo>>>): MutableMap<String, MutableList<MultiAssetInfo>> {
        val externalAccountId = verification.externalAccount.id!!
        externalAccountLookup[externalAccountId] = verification.externalAccount
        return memberIdsToTokenPolicyOwnershipCounts.computeIfAbsent(externalAccountId) { mutableMapOf() }
    }

    fun getAllCurrentTokenRoleAssignmentsForGuildMember(discordServer: DiscordServer, externalAccountId: Long): Set<DiscordRoleAssignment> {
        return if (discordServer.tokenRoles.isNotEmpty()) {
            val allVerificationsOfMember =
                externalAccountService.getConfirmedExternalAccountVerifications(externalAccountId)
            getAllCurrentTokenRoleAssignmentsForVerifications(allVerificationsOfMember, discordServer)
        } else {
            emptySet()
        }
    }

    fun getAllCurrentDelegatorRoleAssignmentsForGuildMember(discordServer: DiscordServer, externalAccountId: Long): Set<DiscordRoleAssignment> {
        return if (discordServer.delegatorRoles.isNotEmpty()) {
            val allVerificationsOfMember =
                externalAccountService.getConfirmedExternalAccountVerifications(externalAccountId)
            val allDelegationToAllowedPools = getDelegationIfNeeded(discordServer)
            getAllCurrentDelegatorRoleAssignmentsForVerifications(allVerificationsOfMember, allDelegationToAllowedPools, discordServer)
        } else {
            emptySet()
        }
    }

    @Async
    fun publishRoleAssignmentsForGuildMember(discordServer: DiscordServer, externalAccountId: Long) {
        if (discordServer.tokenRoles.isNotEmpty() || discordServer.delegatorRoles.isNotEmpty()) {
            val externalAccount = externalAccountService.getExternalAccount(externalAccountId)
            val allVerificationsOfMember =
                externalAccountService.getConfirmedExternalAccountVerifications(externalAccountId)
            val allDelegationToAllowedPools = getDelegationIfNeeded(discordServer)
            publishTokenRoleAssignmentsForGuildMember(allVerificationsOfMember, discordServer, externalAccount)
            publishDelegatorRoleAssignmentsForGuildMember(allVerificationsOfMember, allDelegationToAllowedPools, discordServer, externalAccount)
        }
    }

    @Async
    fun publishRoleAssignmentsForGuildMemberOnAllServers(externalAccountId: Long) {
        val discordServers = discordServerRepository.getDiscordServersForMember(externalAccountId = externalAccountId)
        if (discordServers.isNotEmpty()) {
            val externalAccount = externalAccountService.getExternalAccount(externalAccountId)
            val allVerificationsOfMember =
                externalAccountService.getConfirmedExternalAccountVerifications(externalAccountId)
            discordServers.forEach {
                val allDelegationToAllowedPools = getDelegationIfNeeded(it)
                publishTokenRoleAssignmentsForGuildMember(allVerificationsOfMember, it, externalAccount)
                publishDelegatorRoleAssignmentsForGuildMember(allVerificationsOfMember, allDelegationToAllowedPools, it, externalAccount)
            }
        }
    }

    private fun getDelegationIfNeeded(discordServer: DiscordServer) =
        if (discordServer.delegatorRoles.isNotEmpty()) connectService.getActiveDelegationForPools(discordServer.stakepools.map { pool -> pool.poolHash })
        else listOf()

    private fun publishTokenRoleAssignmentsForGuildMember(
        allVerificationsOfMember: List<Verification>,
        discordServer: DiscordServer,
        externalAccount: ExternalAccount
    ) {
        if (discordServer.tokenRoles.isNotEmpty()) {
            val tokenRoleAssignmentsForGuildMember =
                getAllCurrentTokenRoleAssignmentsForVerifications(allVerificationsOfMember, discordServer)
            rabbitTemplate.convertAndSend(
                "tokenroles", DiscordRoleAssignmentListForGuildMember(
                    guildId = discordServer.guildId,
                    userId = externalAccount.referenceId.toLong(),
                    assignments = tokenRoleAssignmentsForGuildMember,
                )
            )
        }
    }

    private fun publishDelegatorRoleAssignmentsForGuildMember(
        allVerificationsOfMember: List<Verification>,
        allDelegationToAllowedPools: List<DelegationInfo>,
        discordServer: DiscordServer,
        externalAccount: ExternalAccount
    ) {
        if (discordServer.delegatorRoles.isNotEmpty()) {
            val delegatorRoleAssignmentsForGuildMember =
                getAllCurrentDelegatorRoleAssignmentsForVerifications(allVerificationsOfMember, allDelegationToAllowedPools, discordServer)
            rabbitTemplate.convertAndSend(
                "delegatorroles", DiscordRoleAssignmentListForGuildMember(
                    guildId = discordServer.guildId,
                    userId = externalAccount.referenceId.toLong(),
                    assignments = delegatorRoleAssignmentsForGuildMember,
                )
            )
        }
    }

    @Async
    fun publishRemoveRoleAssignmentsForGuildMember(discordServer: DiscordServer, externalAccountId: Long) {
        val externalAccount = externalAccountService.getExternalAccount(externalAccountId)
        fun publishRoleRemoval(roleType: String) {
            rabbitTemplate.convertAndSend(
                roleType, DiscordRoleAssignmentListForGuildMember(
                    guildId = discordServer.guildId,
                    userId = externalAccount.referenceId.toLong(),
                    assignments = emptySet(),
                )
            )
        }

        publishRoleRemoval("tokenroles")
        publishRoleRemoval("delegatorroles")
    }

}