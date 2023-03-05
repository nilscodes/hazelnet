package io.hazelnet.community.services

import com.bloxbean.cardano.client.util.AssetUtil
import com.fasterxml.jackson.databind.ObjectMapper
import io.hazelnet.cardano.connect.data.stakepool.DelegationInfo
import io.hazelnet.cardano.connect.data.token.*
import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.Verification
import io.hazelnet.community.data.discord.*
import io.hazelnet.community.persistence.DiscordBanRepository
import io.hazelnet.community.persistence.DiscordQuizRepository
import io.hazelnet.community.persistence.DiscordServerRepository
import io.hazelnet.community.persistence.DiscordWhitelistRepository
import io.hazelnet.community.services.external.MutantStakingService
import io.hazelnet.community.services.external.NftCdnService
import mu.KotlinLogging
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import javax.transaction.Transactional

private val logger = KotlinLogging.logger {}

@Service
class RoleAssignmentService(
    private val connectService: ConnectService,
    private val externalAccountService: ExternalAccountService,
    private val rabbitTemplate: RabbitTemplate,
    private val discordServerRepository: DiscordServerRepository,
    private val mutantStakingService: MutantStakingService,
    private val whitelistRepository: DiscordWhitelistRepository,
    private val quizRepository: DiscordQuizRepository,
    private val discordBanRepository: DiscordBanRepository,
    private val nftCdnService: NftCdnService,
) {
    fun getAllCurrentTokenRoleAssignmentsForVerifications(
        verifications: List<Verification>,
        discordServer: DiscordServer
    ): Set<DiscordRoleAssignment> {
        val rolesToAssign =
            if (discordServer.getPremium()) discordServer.tokenRoles
            else listOfNotNull(discordServer.tokenRoles.minByOrNull { it.id!! })
        val bans = discordBanRepository.findByDiscordServerId(discordServer.id!!)
        val bannedStakeAddresses = bans.filter { it.type == DiscordBanType.STAKE_ADDRESS_BAN }.map { it.pattern }.toSet()
        val allEligibleStakeAddresses = verifications
            .mapNotNull { it.cardanoStakeAddress }
            .filterNot { bannedStakeAddresses.contains(it) }
        val bannedAssetFingerprints = bans.filter { it.type == DiscordBanType.ASSET_FINGERPRINT_BAN }.map { it.pattern }.toSet()

        val roleTypes = rolesToAssign.groupBy { it.filters.size > 0 }
        val countBasedRoles = roleTypes[false] ?: listOf()

        val countBasedRoleAssignments = getCountBasedTokenRoleAssignments(
            countBasedRoles,
            allEligibleStakeAddresses,
            verifications,
            bannedAssetFingerprints,
            discordServer
        )

        val filterBasedRoles = roleTypes[true] ?: listOf()
        val filterBasedRoleAssignments = getMetadataBasedTokenRoleAssignments(
            filterBasedRoles,
            allEligibleStakeAddresses,
            verifications,
            bannedAssetFingerprints,
            discordServer
        )

        return countBasedRoleAssignments + filterBasedRoleAssignments
    }

    fun getMetadataBasedTokenRoleAssignments(
        filterBasedRoles: List<TokenOwnershipRole>,
        allVerifiedStakeAddresses: List<String>,
        allVerificationsOfMembers: List<Verification>,
        bannedAssetFingerprints: Set<String>,
        discordServer: DiscordServer
    ): MutableSet<DiscordRoleAssignment> {
        val relevantPolicyIds = filterBasedRoles.map { role ->
            role.acceptedAssets.map { it.policyId + (it.assetFingerprint ?: "") }
        }.flatten().toSet()
        val filterBasedRoleAssignments = mutableSetOf<DiscordRoleAssignment>()
        // TODO We could try to filter out all users that already received a role
        if (relevantPolicyIds.isNotEmpty()) {
            val tokenStakingData = getStakingAssets(allVerifiedStakeAddresses, filterBasedRoles)
            val tokenOwnershipDataInWallet =
                connectService.getAllTokenOwnershipAssetsByPolicyId(allVerifiedStakeAddresses, relevantPolicyIds)
            val tokenOwnershipData = mergeOwnershipForAssetLists(tokenOwnershipDataInWallet, tokenStakingData)
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
                        val existingMetadata =
                            mapOfExternalAccount.computeIfAbsent(tokenListForStakeAddressAndPolicy.policyIdWithOptionalAssetFingerprint) { mutableListOf() }

                        val nonCip68Tokens = tokenListForStakeAddressAndPolicy.assetList.filter { !Cip68Token(it).isValidCip68Token() }
                        collectNonCip68TokenMetadata(
                            nonCip68Tokens,
                            tokenListForStakeAddressAndPolicy.policyIdWithOptionalAssetFingerprint,
                            bannedAssetFingerprints,
                            existingMetadata
                        )
                        val cip68Tokens = tokenListForStakeAddressAndPolicy.assetList.map { Cip68Token(it) }.filter { it.isValidCip68Token() }
                        collectCip68TokenMetadata(
                            cip68Tokens,
                            tokenListForStakeAddressAndPolicy.policyIdWithOptionalAssetFingerprint,
                            bannedAssetFingerprints,
                            existingMetadata
                        )
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

    private fun collectNonCip68TokenMetadata(
        nonCip68Tokens: List<String>,
        policyIdWithOptionalAssetFingerprint: String,
        bannedAssetFingerprints: Set<String>,
        existingMetadata: MutableList<MultiAssetInfo>
    ) {
        if (nonCip68Tokens.isNotEmpty()) {
            val metadata =
                connectService.getMultiAssetInfo(nonCip68Tokens
                    .filter {
                        if (it.isBlank()) {
                            logger.warn { "Ignoring asset with empty name for policy $policyIdWithOptionalAssetFingerprint while aggregating assets" }
                        }
                        it.isNotBlank()
                    }
                    .map { assetName ->
                        Pair(
                            policyIdWithOptionalAssetFingerprint,
                            assetName
                        )
                    })
                    .filterNot { bannedAssetFingerprints.contains(it.assetFingerprint.assetFingerprint) }

            existingMetadata.addAll(metadata)
        }
    }

    private fun collectCip68TokenMetadata(
        cip68Tokens: List<Cip68Token>,
        policyIdWithOptionalAssetFingerprint: String,
        bannedAssetFingerprints: Set<String>,
        existingMetadata: MutableList<MultiAssetInfo>
    ) {
        if (cip68Tokens.isNotEmpty()) {
            val assetFingerprints = cip68Tokens
                .map { AssetUtil.calculateFingerPrint(policyIdWithOptionalAssetFingerprint, it.getReferenceToken().toHexString()) }
                .filterNot { bannedAssetFingerprints.contains(it) }
            val metadata = nftCdnService.getAssetMetadata(assetFingerprints)
                .map { it.toMultiAssetInfo() }
            existingMetadata.addAll(metadata)
        }
    }

    private fun getMinimumAndMaximumTokenCounts(role: TokenOwnershipRole): Pair<Long, Long?> {
        val minimum = when (role.aggregationType) {
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_OR,
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_AND -> role.minimumTokenQuantity
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_ALL_MATCHED,
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_ONE_EACH -> role.filters.size.toLong()
            TokenOwnershipAggregationType.EVERY_POLICY_FILTERED_OR -> role.acceptedAssets.size.toLong()
        }
        val maximum = when (role.aggregationType) {
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_OR,
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_AND -> role.maximumTokenQuantity
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_ALL_MATCHED,
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_ONE_EACH -> null
            TokenOwnershipAggregationType.EVERY_POLICY_FILTERED_OR -> null
        }
        return Pair(minimum, maximum)
    }

    private fun calculateMatchedTokenCountForFiltered(
        role: TokenOwnershipRole,
        tokenOwnershipInfo: Map.Entry<Long, MutableMap<String, MutableList<MultiAssetInfo>>>
    ): Long {
        fun getMatchingAssets(): MutableList<MultiAssetInfo> {
            return role.acceptedAssets.map { asset ->
                val policyIdWithOptionalAssetFingerprint = asset.policyId + (asset.assetFingerprint ?: "")
                val ownedAssets = tokenOwnershipInfo.value[policyIdWithOptionalAssetFingerprint]
                ownedAssets?.filter { assetInfo -> role.meetsFilterCriteria(assetInfo.metadata).first } ?: emptyList()
            }.flatten().toMutableList()
        }

        return when (role.aggregationType) {
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_OR,
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_AND -> {
                role.acceptedAssets.sumOf { asset ->
                    val policyIdWithOptionalAssetFingerprint = asset.policyId + (asset.assetFingerprint ?: "")
                    val ownedAssets = tokenOwnershipInfo.value[policyIdWithOptionalAssetFingerprint]
                    ownedAssets?.sumOf { assetInfo ->
                        val filterMatchInfo = role.meetsFilterCriteria(assetInfo.metadata)
                        if (filterMatchInfo.first) filterMatchInfo.second else 0
                    } ?: 0
                }.toLong()
            }
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_ONE_EACH -> {
                val matchingAssets = getMatchingAssets()
                role.filters.count { filter -> matchingAssets.removeIf { filter.apply(it.metadata) } }.toLong()
            }
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_ALL_MATCHED -> {
                val matchingAssets = getMatchingAssets()
                role.filters.count { filter -> matchingAssets.any { filter.apply(it.metadata) } }.toLong()
            }
            TokenOwnershipAggregationType.EVERY_POLICY_FILTERED_OR -> {
                role.acceptedAssets.sumOf { asset ->
                    val policyIdWithOptionalAssetFingerprint = asset.policyId + (asset.assetFingerprint ?: "")
                    val ownedAssets = tokenOwnershipInfo.value[policyIdWithOptionalAssetFingerprint]
                    if (ownedAssets?.any { assetInfo -> role.meetsFilterCriteria(assetInfo.metadata).first } == true) {
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
        bannedAssetFingerprints: Set<String>,
        discordServer: DiscordServer
    ): Set<DiscordRoleAssignment> {
        val relevantPolicyIds = countBasedRoles.map { role ->
            role.acceptedAssets.map { it.policyId + (it.assetFingerprint ?: "") }
        }.flatten().toSet()
        if (relevantPolicyIds.isNotEmpty()) {
            val tokenStakingData = getStakingCounts(allVerifiedStakeAddresses, countBasedRoles)
            val tokenOwnershipDataInWallet =
                connectService.getAllTokenOwnershipCountsByPolicyId(allVerifiedStakeAddresses, relevantPolicyIds, bannedAssetFingerprints)
            val tokenOwnershipData = mergeOwnershipForAssetCounts(tokenOwnershipDataInWallet, tokenStakingData)
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

    private fun mergeOwnershipForAssetCounts(
        list1: List<TokenOwnershipInfoWithAssetCount>,
        list2: List<TokenOwnershipInfoWithAssetCount>
    ) =
        // Add the counts up that exist in both list1 and list2
        list1.map { it1 ->
            TokenOwnershipInfoWithAssetCount(
                it1.stakeAddress,
                it1.policyIdWithOptionalAssetFingerprint,
                it1.assetCount
                        + (list2.filter { it2 -> it2.stakeAddress == it1.stakeAddress && it2.policyIdWithOptionalAssetFingerprint == it1.policyIdWithOptionalAssetFingerprint }
                    .sumOf { it.assetCount })
            )
        } + // Then concatenate with the counts only present in list 2
                list2.filter { it2 ->
                    !(list1.any { it1 -> it2.stakeAddress == it1.stakeAddress && it2.policyIdWithOptionalAssetFingerprint == it1.policyIdWithOptionalAssetFingerprint })
                }

    private fun mergeOwnershipForAssetLists(
        list1: List<TokenOwnershipInfoWithAssetList>,
        list2: List<TokenOwnershipInfoWithAssetList>
    ) =
        // Add the counts up that exist in both list1 and list2
        list1.map { it1 ->
            TokenOwnershipInfoWithAssetList(
                it1.stakeAddress,
                null,
                it1.policyIdWithOptionalAssetFingerprint,
                it1.assetList
                        + (list2.filter { it2 -> it2.stakeAddress == it1.stakeAddress && it2.policyIdWithOptionalAssetFingerprint == it1.policyIdWithOptionalAssetFingerprint }
                    .map { it.assetList }.flatten())
            )
        } + // Then concatenate with the counts only present in list 2
                list2.filter { it2 ->
                    !(list1.any { it1 -> it2.stakeAddress == it1.stakeAddress && it2.policyIdWithOptionalAssetFingerprint == it1.policyIdWithOptionalAssetFingerprint })
                }

    private fun getStakingCounts(stakeAddresses: List<String>, roles: List<TokenOwnershipRole>): List<TokenOwnershipInfoWithAssetCount>
    {
        val policiesToRetrieveMutantInfoFor = getPoliciesToRetrieveMutantStakingInfoFor(roles)
        if (policiesToRetrieveMutantInfoFor.isNotEmpty()) {
            val mapForStakeAddresses = mutableMapOf<String, MutableMap<String, Long>>()
            mutantStakingService.getStakedAssetsForPolicies(policiesToRetrieveMutantInfoFor)
                .forEach { stakeEntry ->
                    if (stakeAddresses.contains(stakeEntry.stakerStakeAddress)) {
                        val mapForStakeAddress =
                            mapForStakeAddresses.computeIfAbsent(stakeEntry.stakerStakeAddress) { mutableMapOf() }
                        stakeEntry.assets.forEach { asset ->
                            mapForStakeAddress.compute(asset.policyId!!) { _, v -> (v ?: 0) + 1 }
                        }
                    }
                }
            return mapForStakeAddresses.map { stakeAddressEntry ->
                stakeAddressEntry.value.map {
                    TokenOwnershipInfoWithAssetCount(stakeAddressEntry.key, it.key, it.value)
                }
            }.flatten()
        }
        return emptyList()
    }

    private fun getStakingAssets(stakeAddresses: List<String>, roles: List<TokenOwnershipRole>): List<TokenOwnershipInfoWithAssetList> {
        val policiesToRetrieveMutantInfoFor = getPoliciesToRetrieveMutantStakingInfoFor(roles)
        if (policiesToRetrieveMutantInfoFor.isNotEmpty()) {
            val mapForStakeAddresses = mutableMapOf<String, MutableMap<String, MutableSet<String>>>()
            mutantStakingService.getStakedAssetsForPolicies(policiesToRetrieveMutantInfoFor)
                .forEach { stakeEntry ->
                    if (stakeAddresses.contains(stakeEntry.stakerStakeAddress)) {
                        val mapForStakeAddress =
                            mapForStakeAddresses.computeIfAbsent(stakeEntry.stakerStakeAddress) { mutableMapOf() }
                        stakeEntry.assets.forEach { asset ->
                            mapForStakeAddress.computeIfAbsent(asset.policyId!!) { mutableSetOf() }.add(asset.assetName)
                        }
                    }
                }
            return mapForStakeAddresses.map { stakeAddressEntry ->
                stakeAddressEntry.value.map {
                    TokenOwnershipInfoWithAssetList(stakeAddressEntry.key, null, it.key, it.value)
                }
            }.flatten()
        }
        return emptyList()
    }

    private fun getPoliciesToRetrieveMutantStakingInfoFor(roles: List<TokenOwnershipRole>): Set<String> {
        val mutantEnabledPolicies = roles
            .filter { it.stakingType == TokenStakingType.MUTANT_STAKING }
            .map { it.acceptedAssets.map { aa -> aa.policyId } }
            .flatten()
        return if (mutantEnabledPolicies.isNotEmpty()) {
            val mutantSupportedPolicies = mutantStakingService.getStakeablePolicies()
            mutantEnabledPolicies.intersect(mutantSupportedPolicies)
        } else {
            emptySet()
        }
    }

    private fun calculateMatchedTokenCountForCountBased(
        role: TokenOwnershipRole,
        tokenOwnershipInfo: Map.Entry<Long, Map<String, Long>>
    ): Long {
        return when (role.aggregationType) {
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_OR,
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_AND,
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_ONE_EACH,
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_ALL_MATCHED -> {
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
        val bans = discordBanRepository.findByDiscordServerId(discordServer.id!!)
        val bannedStakeAddresses = bans.filter { it.type == DiscordBanType.STAKE_ADDRESS_BAN }.map { it.pattern }.toSet()
        val memberIdsToDelegationBuckets = mutableMapOf<Long, Map<String, Long>>()
        val externalAccountLookup = mutableMapOf<Long, ExternalAccount>()
        allVerificationsOfMembers.forEach { verification ->
            val mapOfExternalAccount = prepareExternalAccountMapForCountBased(
                verification,
                externalAccountLookup,
                memberIdsToDelegationBuckets
            )
            val delegationForStakeAddress =
                allDelegationToAllowedPools.find { it.stakeAddress == verification.cardanoStakeAddress && !bannedStakeAddresses.contains(verification.cardanoStakeAddress) }
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

    fun getAllCurrentWhitelistRoleAssignmentsForGuild(discordServer: DiscordServer) =
        whitelistRepository.findAwardedRoleAssignments(discordServer.id!!)
            .map { DiscordRoleAssignment(discordServer.guildId, it.getExternalReferenceId(), it.getAwardedRole()) }
            .toSet()

    fun getAllCurrentQuizRoleAssignmentsForGuild(discordServer: DiscordServer) =
        quizRepository.findAwardedRoleAssignments(discordServer.id!!)
            .map { DiscordRoleAssignment(discordServer.guildId, it.getExternalReferenceId(), it.getAwardedRole()) }
            .toSet()

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

    fun getAllCurrentWhitelistRoleAssignmentsForGuildMember(discordServer: DiscordServer, externalAccountId: Long) =
        whitelistRepository.findAwardedRoleAssignmentsForExternalAccount(discordServer.id!!, externalAccountId)
            .map { DiscordRoleAssignment(discordServer.guildId, it.getExternalReferenceId(), it.getAwardedRole()) }
            .toSet()

    fun getAllCurrentQuizRoleAssignmentsForGuildMember(discordServer: DiscordServer, externalAccountId: Long) =
        quizRepository.findAwardedRoleAssignmentsForExternalAccount(discordServer.id!!, externalAccountId)
            .map { DiscordRoleAssignment(discordServer.guildId, it.getExternalReferenceId(), it.getAwardedRole()) }
            .toSet()

    @Async
    @Transactional
    fun publishRoleAssignmentsForGuildMember(guildId: Long, externalAccountId: Long) {
        val discordServer = discordServerRepository.findByGuildId(guildId)
            .orElseThrow { NoSuchElementException("No Discord Server with guild ID $guildId found") }
        if (discordServer.tokenRoles.isNotEmpty() || discordServer.delegatorRoles.isNotEmpty()) {
            val externalAccount = externalAccountService.getExternalAccount(externalAccountId)
            val allVerificationsOfMember =
                externalAccountService.getConfirmedExternalAccountVerifications(externalAccountId)
            val allDelegationToAllowedPools = getDelegationIfNeeded(discordServer)
            publishTokenRoleAssignmentsForGuildMember(allVerificationsOfMember, discordServer, externalAccount)
            publishDelegatorRoleAssignmentsForGuildMember(allVerificationsOfMember, allDelegationToAllowedPools, discordServer, externalAccount)
        }
    }

    // Cannot be @Async for now because if it is called from external, the transaction that updates the whitelist is not yet committed while this thread starts immediately
    @Transactional
    fun publishWhitelistRoleAssignmentsForGuildMember(guildId: Long, externalAccountId: Long) {
        val discordServer = discordServerRepository.findByGuildId(guildId)
            .orElseThrow { NoSuchElementException("No Discord Server with guild ID $guildId found") }
        if (discordServer.whitelists.any { it.awardedRole != null }) {
            val externalAccount = externalAccountService.getExternalAccount(externalAccountId)
            publishWhitelistRoleAssignmentsForGuildMember(discordServer, externalAccount)
        }
    }

    // Cannot be @Async for now because if it is called from external, the transaction that updates the whitelist is not yet committed while this thread starts immediately
    @Transactional
    fun publishQuizRoleAssignmentsForGuildMember(guildId: Long, externalAccountId: Long) {
        val discordServer = discordServerRepository.findByGuildId(guildId)
            .orElseThrow { NoSuchElementException("No Discord Server with guild ID $guildId found") }
        val quizzes = quizRepository.findByDiscordServerId(discordServer.id!!)
        if (quizzes.any { it.awardedRole != null }) {
            val externalAccount = externalAccountService.getExternalAccount(externalAccountId)
            publishQuizRoleAssignmentsForGuildMember(discordServer, externalAccount)
        }
    }

    @Async
    @Transactional
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

    private fun publishWhitelistRoleAssignmentsForGuildMember(
        discordServer: DiscordServer,
        externalAccount: ExternalAccount
    ) {
        rabbitTemplate.convertAndSend(
            "whitelistroles", DiscordRoleAssignmentListForGuildMember(
                guildId = discordServer.guildId,
                userId = externalAccount.referenceId.toLong(),
                assignments = getAllCurrentWhitelistRoleAssignmentsForGuildMember(discordServer, externalAccount.id!!)
            )
        )
    }

    private fun publishQuizRoleAssignmentsForGuildMember(
        discordServer: DiscordServer,
        externalAccount: ExternalAccount
    ) {
        rabbitTemplate.convertAndSend(
            "quizroles", DiscordRoleAssignmentListForGuildMember(
                guildId = discordServer.guildId,
                userId = externalAccount.referenceId.toLong(),
                assignments = getAllCurrentQuizRoleAssignmentsForGuildMember(discordServer, externalAccount.id!!)
            )
        )
    }

    @Async
    fun publishRemoveRoleAssignmentsForGuildMember(guildId: Long, externalAccountId: Long) {
        val discordServer = discordServerRepository.findByGuildId(guildId)
            .orElseThrow { NoSuchElementException("No Discord Server with guild ID $guildId found") }
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
        // Whitelist roles are independent of verifications and not removed here
    }

}