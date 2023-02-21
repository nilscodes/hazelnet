package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.other.SyncInfo
import io.hazelnet.cardano.connect.data.stakepool.DelegationInfo
import io.hazelnet.cardano.connect.data.token.*
import io.hazelnet.community.data.*
import io.hazelnet.community.data.cardano.Stakepool
import io.hazelnet.community.data.discord.*
import io.hazelnet.community.persistence.DiscordBanRepository
import io.hazelnet.shared.data.ExternalAccountType
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import java.util.*

internal class RoleAssignmentServiceTest {
    private val acc1 = ExternalAccount(1, "7854", "Person 1", Date(), ExternalAccountType.DISCORD, null)
    private val acc2 = ExternalAccount(2, "12333", "Person 2", Date(), ExternalAccountType.DISCORD, null)
    private val acc3 = ExternalAccount(3, "510598102", "Person 3", Date(), ExternalAccountType.DISCORD, null)
    private val acc4 = ExternalAccount(4, "69", "Person 4", Date(), ExternalAccountType.DISCORD, null)

    private val DEFAULT_TOKEN_ROLES = mutableSetOf(
        TokenOwnershipRole(
            1,
            mutableSetOf(
                TokenRoleAssetInfo("ceb5dedd6cda3f0b4a98919b5d3827e15e324771642b57e0e6aabd57"),
            ),
            120,
            null,
            mutableSetOf(),
            999
        ),
        TokenOwnershipRole(
            2,
            mutableSetOf(TokenRoleAssetInfo("1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601")),
            3,
            null,
            mutableSetOf(),
            31
        ),
        TokenOwnershipRole(
            3,
            mutableSetOf(TokenRoleAssetInfo("0e14267a8020229adc0184dd25fa3174c3f7d6caadcb4425c70e7c04")),
            76,
            null,
            mutableSetOf(),
            12
        ),
        TokenOwnershipRole(
            4,
            mutableSetOf(TokenRoleAssetInfo("0e14267a8020229adc0184dd25fa3174c3f7d6caadcb4425c70e7c04")),
            150,
            null,
            mutableSetOf(),
            13
        ),
        TokenOwnershipRole(
            5,
            mutableSetOf(TokenRoleAssetInfo("2d01b3496fd22b1a61e6227c27250225b1186e5ebae7360b1fc5392c")),
            1,
            null,
            mutableSetOf(
                TokenRoleMetadataFilter(3, "attributes.Eyes", AttributeOperatorType.EQUALS, "Drowsy")
            ),
            16
        ),
        TokenOwnershipRole(
            6,
            mutableSetOf(TokenRoleAssetInfo("1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601")),
            2,
            null,
            mutableSetOf(
                TokenRoleMetadataFilter(1, "tags", AttributeOperatorType.CONTAINS, "smoking"),
                TokenRoleMetadataFilter(2, "tags", AttributeOperatorType.CONTAINS, "soul patch"),
            ),
            17
        ),
        TokenOwnershipRole(
            7,
            mutableSetOf(TokenRoleAssetInfo("1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601")),
            2,
            null,
            mutableSetOf(
                TokenRoleMetadataFilter(3, "tags", AttributeOperatorType.CONTAINS, "potatoes"),
                TokenRoleMetadataFilter(4, "tags", AttributeOperatorType.CONTAINS, "face mask"),
            ),
            18,
            aggregationType = TokenOwnershipAggregationType.ANY_POLICY_FILTERED_OR,
        ),
        TokenOwnershipRole(
            8,
            mutableSetOf(TokenRoleAssetInfo("1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601")),
            3,
            null,
            mutableSetOf(
                TokenRoleMetadataFilter(
                    5,
                    "properties[?(@.key==\"type\")].value",
                    AttributeOperatorType.EQUALS,
                    "dead"
                ),
                TokenRoleMetadataFilter(
                    6,
                    "properties[?(@.key==\"type\")].value",
                    AttributeOperatorType.EQUALS,
                    "vampire"
                ),
                TokenRoleMetadataFilter(
                    7,
                    "properties[?(@.key==\"type\")].value",
                    AttributeOperatorType.EQUALS,
                    "alien"
                ),
            ),
            19,
            aggregationType = TokenOwnershipAggregationType.ANY_POLICY_FILTERED_ONE_EACH,
        ),
        TokenOwnershipRole(
            9,
            mutableSetOf(
                TokenRoleAssetInfo("1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601"),
                TokenRoleAssetInfo("0e14267a8020229adc0184dd25fa3174c3f7d6caadcb4425c70e7c04"),
                TokenRoleAssetInfo("2d01b3496fd22b1a61e6227c27250225b1186e5ebae7360b1fc5392c"),
            ),
            3,
            null,
            mutableSetOf(
                TokenRoleMetadataFilter(8, "image", AttributeOperatorType.STARTSWITH, "ipfs://"),
            ),
            20,
            aggregationType = TokenOwnershipAggregationType.EVERY_POLICY_FILTERED_OR,
        ),
        TokenOwnershipRole(
            10,
            mutableSetOf(
                TokenRoleAssetInfo("1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601"),
                TokenRoleAssetInfo("0e14267a8020229adc0184dd25fa3174c3f7d6caadcb4425c70e7c04"),
                TokenRoleAssetInfo("2d01b3496fd22b1a61e6227c27250225b1186e5ebae7360b1fc5392c"),
            ),
            3,
            null,
            mutableSetOf(),
            21,
            aggregationType = TokenOwnershipAggregationType.EVERY_POLICY_FILTERED_OR,
        ),
    )

    private fun makeTestDiscordServer(tokenRoles: MutableSet<TokenOwnershipRole>? = null): DiscordServer {
        val useTokenRoles = tokenRoles ?: DEFAULT_TOKEN_ROLES
        return DiscordServer(
            12,
            717264144759390200,
            "My guild",
            69693469034096,
            Date(),
            420,
            null,
            null,
            Date(System.currentTimeMillis() + 60000000L),
            null,
            mutableSetOf(),
            mutableSetOf(
                Stakepool("be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4", null),
                Stakepool("9679eaa0fa242a9cdae4b030e714b66c0119fc9b3f7564b8f03a5316", null),
                Stakepool("f5b2ef0d7db63c8d00446cd7d9ce9cdb9e73023ffaa5e806decceb66", null),
            ),
            mutableSetOf(
                DelegatorRole(1, null, 60000, 78),
                DelegatorRole(2, "be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4", 10000, 21),
                DelegatorRole(3, "9679eaa0fa242a9cdae4b030e714b66c0119fc9b3f7564b8f03a5316", 1, 662)
            ),
            useTokenRoles,
            mutableSetOf(),
            mutableSetOf()
        )
    }

    @Test
    fun getCurrentDelegatorRoleAssignments() {
        val connectService = mockk<ConnectService>()
        every { connectService.getSyncInfo() } returns SyncInfo(311, Date(), 100.0)

        val activeDelegation = listOf(
            DelegationInfo("be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4", 5000, "acc1_hazel"),
            DelegationInfo("9679eaa0fa242a9cdae4b030e714b66c0119fc9b3f7564b8f03a5316", 55000, "acc1_bloom"),
            DelegationInfo("f5b2ef0d7db63c8d00446cd7d9ce9cdb9e73023ffaa5e806decceb66", 200, "acc2_kaizn"),
            DelegationInfo("f5b2ef0d7db63c8d00446cd7d9ce9cdb9e73023ffaa5e806decceb66", 200000, "acc3_kaizn"),
            DelegationInfo("be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4", 100000, "acc4_hazel"),
        )
        val roleAssignmentService = RoleAssignmentService(
            connectService,
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            makeDiscordBanRepository(emptyList()),
        )
        val testServer = makeTestDiscordServer()
        val actual = roleAssignmentService.getAllCurrentDelegatorRoleAssignmentsForVerifications(
            getMockVerificationData(),
            activeDelegation,
            testServer
        )
        Assertions.assertEquals(
            setOf(
                DiscordRoleAssignment(testServer.guildId, acc1.referenceId.toLong(), 78),
                DiscordRoleAssignment(testServer.guildId, acc1.referenceId.toLong(), 662),
                DiscordRoleAssignment(testServer.guildId, acc3.referenceId.toLong(), 78),
                DiscordRoleAssignment(testServer.guildId, acc4.referenceId.toLong(), 78),
                DiscordRoleAssignment(testServer.guildId, acc4.referenceId.toLong(), 21),
            ), actual
        )
    }

    private fun makeDiscordBanRepository(discordBans: List<DiscordBan>): DiscordBanRepository {
        val discordBanRepository = mockk<DiscordBanRepository>()
        every { discordBanRepository.findByDiscordServerId(any()) }.returns(discordBans)
        return discordBanRepository
    }

    @Test
    fun tokenRoleAssignmentsWorkWithAssetFingerprints() {
        //TODO("to write")
    }

    @Test
    fun tokenRoleAssignmentsDoNotGetCountedTwiceForTwoDifferentTokenRoles() {
        val testServer = makeTestDiscordServer()
        val connectService = mockk<ConnectService>()
        every { connectService.getSyncInfo() } returns SyncInfo(311, Date(), 100.0)
        every {
            connectService.getAllTokenOwnershipCountsByPolicyId(
                listOf(
                    "acc1_hazel",
                    "acc1_bloom",
                    "acc2_kaizn",
                    "acc3_kaizn",
                    "acc4_hazel"
                ),
                testServer.tokenRoles.filter { it.filters.isEmpty() }.map { r -> r.acceptedAssets.map { it.policyId } }
                    .flatten().toSet(),
                emptySet(),
            )
        } returns listOf(
            TokenOwnershipInfoWithAssetCount(
                "acc4_hazel",
                "0e14267a8020229adc0184dd25fa3174c3f7d6caadcb4425c70e7c04",
                75
            ),
        )
        every {
            connectService.getAllTokenOwnershipAssetsByPolicyId(any(), any())
        } answers { emptyList() }
        val roleAssignmentService = RoleAssignmentService(
            connectService,
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            makeDiscordBanRepository(emptyList()),
        )

        val actual = roleAssignmentService.getAllCurrentTokenRoleAssignmentsForVerifications(
            getMockVerificationData(),
            testServer
        )
        Assertions.assertEquals(emptySet<DiscordRoleAssignment>(), actual)
    }

    @Test
    fun getCurrentTokenRoleAssignmentsByAssetsAggregationAnyPolicyFilterAnd() {
        val testServer = makeTestDiscordServer()
        val connectService = mockk<ConnectService>()
        every { connectService.getSyncInfo() } returns SyncInfo(311, Date(), 100.0)
        every {
            connectService.getAllTokenOwnershipAssetsByPolicyId(
                listOf(
                    "acc1_hazel",
                    "acc1_bloom",
                    "acc2_kaizn",
                    "acc3_kaizn",
                    "acc4_hazel"
                ),
                testServer.tokenRoles.filter { it.filters.isNotEmpty() }
                    .map { r -> r.acceptedAssets.map { it.policyId } }.flatten().toSet()
            )
        } returns listOf(
            TokenOwnershipInfoWithAssetList(
                stakeAddress = "acc1_hazel",
                policyIdWithOptionalAssetFingerprint = "2d01b3496fd22b1a61e6227c27250225b1186e5ebae7360b1fc5392c",
                assetList = setOf("Tavern1")
            ),
            TokenOwnershipInfoWithAssetList(
                stakeAddress = "acc2_kaizn",
                policyIdWithOptionalAssetFingerprint = "2d01b3496fd22b1a61e6227c27250225b1186e5ebae7360b1fc5392c",
                assetList = setOf("Tavern2")
            ),
            TokenOwnershipInfoWithAssetList(
                stakeAddress = "acc2_kaizn",
                policyIdWithOptionalAssetFingerprint = "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601",
                assetList = setOf("PXL1", "PXL2")
            ),
            TokenOwnershipInfoWithAssetList(
                stakeAddress = "acc1_hazel",
                policyIdWithOptionalAssetFingerprint = "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601",
                assetList = setOf("PXL3", "PXL4")
            ),
        )
        every {
            connectService.getAllTokenOwnershipCountsByPolicyId(any(), any(), any())
        } answers { emptyList() }
        val metadataMap = mapOf(
            Pair("Tavern1", METADATA_TAVERNSQUAD_1),
            Pair("Tavern2", METADATA_TAVERNSQUAD_2),
            Pair("PXL1", METADATA_DEADPXLZ_1),
            Pair("PXL2", METADATA_DEADPXLZ_1),
            Pair("PXL3", METADATA_DEADPXLZ_1),
            Pair("PXL4", METADATA_DEADPXLZ_2),
        )
        val slot = slot<List<Pair<String, String>>>()
        every {
            connectService.getMultiAssetInfo(capture(slot))
        } answers {
            slot.captured.map {
                MultiAssetInfo(
                    PolicyId(it.first),
                    it.second,
                    AssetFingerprint("asset1796zkkayd4nxd2k9aw8epxphdeglnv86uzjpae"),
                    metadataMap[it.second] ?: "",
                    "",
                    1
                )
            }
        }
        val roleAssignmentService = RoleAssignmentService(
            connectService,
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            makeDiscordBanRepository(emptyList()),
        )

        val actual = roleAssignmentService.getAllCurrentTokenRoleAssignmentsForVerifications(
            getMockVerificationData(),
            testServer
        )
        Assertions.assertEquals(
            setOf(
                DiscordRoleAssignment(testServer.guildId, acc1.referenceId.toLong(), 16),
                DiscordRoleAssignment(testServer.guildId, acc2.referenceId.toLong(), 17),
            ), actual
        )
    }

    @Test
    fun getCurrentTokenRoleAssignmentsByAssetsAggregationAnyPolicyFilterOr() {
        val testServer = makeTestDiscordServer()
        val connectService = mockk<ConnectService>()
        every { connectService.getSyncInfo() } returns SyncInfo(311, Date(), 100.0)
        every {
            connectService.getAllTokenOwnershipAssetsByPolicyId(
                listOf(
                    "acc1_hazel",
                    "acc1_bloom",
                    "acc2_kaizn",
                    "acc3_kaizn",
                    "acc4_hazel"
                ),
                testServer.tokenRoles.filter { it.filters.isNotEmpty() }
                    .map { r -> r.acceptedAssets.map { it.policyId } }.flatten().toSet()
            )
        } returns listOf(
            TokenOwnershipInfoWithAssetList(
                stakeAddress = "acc2_kaizn",
                policyIdWithOptionalAssetFingerprint = "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601",
                assetList = setOf("PXL1", "PXL2")
            ),
            TokenOwnershipInfoWithAssetList(
                stakeAddress = "acc1_hazel",
                policyIdWithOptionalAssetFingerprint = "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601",
                assetList = setOf("PXL3", "PXL4")
            ),
        )
        every {
            connectService.getAllTokenOwnershipCountsByPolicyId(any(), any(), any())
        } answers { emptyList() }
        val metadataMap = mapOf(
            Pair("PXL1", METADATA_DEADPXLZ_1),
            Pair("PXL2", METADATA_DEADPXLZ_3),
            Pair("PXL3", METADATA_DEADPXLZ_3),
            Pair("PXL4", METADATA_DEADPXLZ_4),
        )
        val slot = slot<List<Pair<String, String>>>()
        every {
            connectService.getMultiAssetInfo(capture(slot))
        } answers {
            slot.captured.map {
                MultiAssetInfo(
                    PolicyId(it.first),
                    it.second,
                    AssetFingerprint("asset1796zkkayd4nxd2k9aw8epxphdeglnv86uzjpae"),
                    metadataMap[it.second] ?: "",
                    "",
                    1
                )
            }
        }
        val roleAssignmentService = RoleAssignmentService(
            connectService,
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            makeDiscordBanRepository(emptyList()),
        )

        val actual = roleAssignmentService.getAllCurrentTokenRoleAssignmentsForVerifications(
            getMockVerificationData(),
            testServer
        )
        Assertions.assertEquals(
            setOf(
                DiscordRoleAssignment(testServer.guildId, acc1.referenceId.toLong(), 18),
            ), actual
        )
    }

    @Test
    fun getCurrentTokenRoleAssignmentsByAssetsAggregationAnyPolicyFilterOneEach() {
        val testServer = makeTestDiscordServer()
        val connectService = mockk<ConnectService>()
        every { connectService.getSyncInfo() } returns SyncInfo(311, Date(), 100.0)
        every {
            connectService.getAllTokenOwnershipAssetsByPolicyId(
                listOf(
                    "acc1_hazel",
                    "acc1_bloom",
                    "acc2_kaizn",
                    "acc3_kaizn",
                    "acc4_hazel"
                ),
                testServer.tokenRoles.filter { it.filters.isNotEmpty() }
                    .map { r -> r.acceptedAssets.map { it.policyId } }.flatten().toSet()
            )
        } returns listOf(
            TokenOwnershipInfoWithAssetList(
                stakeAddress = "acc2_kaizn",
                policyIdWithOptionalAssetFingerprint = "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601",
                assetList = setOf("PXL1", "PXL2", "PXL3")
            ),
            TokenOwnershipInfoWithAssetList(
                stakeAddress = "acc1_hazel",
                policyIdWithOptionalAssetFingerprint = "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601",
                assetList = setOf("PXL4", "PXL5", "PXL6")
            ),
        )
        every {
            connectService.getAllTokenOwnershipCountsByPolicyId(any(), any(), any())
        } answers { emptyList() }
        val metadataMap = mapOf(
            Pair("PXL1", METADATA_DEADPXLZ_1),
            Pair("PXL2", METADATA_DEADPXLZ_2),
            Pair("PXL3", METADATA_DEADPXLZ_3),
            Pair("PXL4", METADATA_DEADPXLZ_2),
            Pair("PXL5", METADATA_DEADPXLZ_3),
            Pair("PXL6", METADATA_DEADPXLZ_4),
        )
        val slot = slot<List<Pair<String, String>>>()
        every {
            connectService.getMultiAssetInfo(capture(slot))
        } answers {
            slot.captured.map {
                MultiAssetInfo(
                    PolicyId(it.first),
                    it.second,
                    AssetFingerprint("asset1796zkkayd4nxd2k9aw8epxphdeglnv86uzjpae"),
                    metadataMap[it.second] ?: "",
                    "",
                    1
                )
            }
        }
        val roleAssignmentService = RoleAssignmentService(
            connectService,
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            makeDiscordBanRepository(emptyList()),
        )

        val actual = roleAssignmentService.getAllCurrentTokenRoleAssignmentsForVerifications(
            getMockVerificationData(),
            testServer
        )
        Assertions.assertEquals(
            setOf(
                DiscordRoleAssignment(testServer.guildId, acc1.referenceId.toLong(), 18),
                DiscordRoleAssignment(testServer.guildId, acc1.referenceId.toLong(), 19),
            ), actual
        )
    }

    @Test
    fun getCurrentTokenRoleAssignmentsByAssetsAggregationEveryPolicyFilterOr() {
        val testServer = makeTestDiscordServer()
        val connectService = mockk<ConnectService>()
        every { connectService.getSyncInfo() } returns SyncInfo(311, Date(), 100.0)
        every {
            connectService.getAllTokenOwnershipAssetsByPolicyId(
                listOf(
                    "acc1_hazel",
                    "acc1_bloom",
                    "acc2_kaizn",
                    "acc3_kaizn",
                    "acc4_hazel"
                ),
                testServer.tokenRoles.filter { it.filters.isNotEmpty() }
                    .map { r -> r.acceptedAssets.map { it.policyId } }.flatten().toSet()
            )
        } returns listOf(
            TokenOwnershipInfoWithAssetList(
                stakeAddress = "acc2_kaizn",
                policyIdWithOptionalAssetFingerprint = "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601",
                assetList = setOf("PXL1", "PXL2")
            ),
            TokenOwnershipInfoWithAssetList(
                stakeAddress = "acc2_kaizn",
                policyIdWithOptionalAssetFingerprint = "2d01b3496fd22b1a61e6227c27250225b1186e5ebae7360b1fc5392c",
                assetList = setOf("Tavern1")
            ),
            TokenOwnershipInfoWithAssetList(
                stakeAddress = "acc1_hazel",
                policyIdWithOptionalAssetFingerprint = "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601",
                assetList = setOf("PXL3")
            ),
            TokenOwnershipInfoWithAssetList(
                stakeAddress = "acc1_hazel",
                policyIdWithOptionalAssetFingerprint = "2d01b3496fd22b1a61e6227c27250225b1186e5ebae7360b1fc5392c",
                assetList = setOf("Tavern2")
            ),
            TokenOwnershipInfoWithAssetList(
                stakeAddress = "acc1_hazel",
                policyIdWithOptionalAssetFingerprint = "0e14267a8020229adc0184dd25fa3174c3f7d6caadcb4425c70e7c04",
                assetList = setOf("Gotchi")
            ),
        )
        every {
            connectService.getAllTokenOwnershipCountsByPolicyId(any(), any(), any())
        } answers { emptyList() }
        val metadataMap = mapOf(
            Pair("Tavern1", METADATA_TAVERNSQUAD_1),
            Pair("Tavern2", METADATA_TAVERNSQUAD_2),
            Pair("PXL1", METADATA_DEADPXLZ_1),
            Pair("PXL2", METADATA_DEADPXLZ_2),
            Pair("PXL3", METADATA_DEADPXLZ_3),
            Pair("Gotchi", METADATA_ADAGOTCHI_1),
        )
        val slot = slot<List<Pair<String, String>>>()
        every {
            connectService.getMultiAssetInfo(capture(slot))
        } answers {
            slot.captured.map {
                MultiAssetInfo(
                    PolicyId(it.first),
                    it.second,
                    AssetFingerprint("asset1796zkkayd4nxd2k9aw8epxphdeglnv86uzjpae"),
                    metadataMap[it.second] ?: "",
                    "",
                    1
                )
            }
        }
        val roleAssignmentService = RoleAssignmentService(
            connectService,
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            makeDiscordBanRepository(emptyList()),
        )

        val actual = roleAssignmentService.getAllCurrentTokenRoleAssignmentsForVerifications(
            getMockVerificationData(),
            testServer
        )
        Assertions.assertEquals(
            setOf(
                DiscordRoleAssignment(testServer.guildId, acc1.referenceId.toLong(), 20),
                DiscordRoleAssignment(testServer.guildId, acc2.referenceId.toLong(), 16),
            ), actual
        )
    }

    @Test
    fun getCurrentTokenRoleAssignmentsByCounts() {
        val testServer = makeTestDiscordServer()
        val connectService = mockk<ConnectService>()
        every { connectService.getSyncInfo() } returns SyncInfo(311, Date(), 100.0)
        every {
            connectService.getAllTokenOwnershipCountsByPolicyId(
                listOf(
                    "acc1_hazel",
                    "acc1_bloom",
                    "acc2_kaizn",
                    "acc3_kaizn",
                    "acc4_hazel"
                ),
                testServer.tokenRoles.filter { it.filters.isEmpty() }.map { r -> r.acceptedAssets.map { it.policyId } }
                    .flatten().toSet(),
                emptySet(),

            )
        } returns listOf(
            TokenOwnershipInfoWithAssetCount(
                "acc1_hazel",
                "ceb5dedd6cda3f0b4a98919b5d3827e15e324771642b57e0e6aabd57",
                50
            ),
            TokenOwnershipInfoWithAssetCount(
                "acc1_bloom",
                "ceb5dedd6cda3f0b4a98919b5d3827e15e324771642b57e0e6aabd57",
                70
            ),
            TokenOwnershipInfoWithAssetCount(
                "acc1_hazel",
                "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601",
                1
            ),
            TokenOwnershipInfoWithAssetCount(
                "acc1_bloom",
                "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601",
                1
            ),
            TokenOwnershipInfoWithAssetCount(
                "acc2_kaizn",
                "ceb5dedd6cda3f0b4a98919b5d3827e15e324771642b57e0e6aabd57",
                600
            ),
            TokenOwnershipInfoWithAssetCount(
                "acc2_kaizn",
                "0e14267a8020229adc0184dd25fa3174c3f7d6caadcb4425c70e7c04",
                600
            ),
            TokenOwnershipInfoWithAssetCount(
                "acc3_kaizn",
                "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601",
                3
            ),
            TokenOwnershipInfoWithAssetCount(
                "acc4_hazel",
                "0e14267a8020229adc0184dd25fa3174c3f7d6caadcb4425c70e7c04",
                75
            ),
        )
        every {
            connectService.getAllTokenOwnershipAssetsByPolicyId(any(), any())
        } answers { emptyList() }
        val roleAssignmentService = RoleAssignmentService(
            connectService,
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            makeDiscordBanRepository(emptyList()),
        )

        val actual = roleAssignmentService.getAllCurrentTokenRoleAssignmentsForVerifications(
            getMockVerificationData(),
            testServer
        )
        Assertions.assertEquals(
            setOf(
                DiscordRoleAssignment(testServer.guildId, acc1.referenceId.toLong(), 999),
                DiscordRoleAssignment(testServer.guildId, acc2.referenceId.toLong(), 999),
                DiscordRoleAssignment(testServer.guildId, acc2.referenceId.toLong(), 12),
                DiscordRoleAssignment(testServer.guildId, acc2.referenceId.toLong(), 13),
                DiscordRoleAssignment(testServer.guildId, acc3.referenceId.toLong(), 31),
            ), actual
        )
    }

    @Test
    fun getCurrentTokenRoleAssignmentsByCountsAggregationEveryPolicyFilterOr() {
        val testServer = makeTestDiscordServer()
        val connectService = mockk<ConnectService>()
        every { connectService.getSyncInfo() } returns SyncInfo(311, Date(), 100.0)
        every {
            connectService.getAllTokenOwnershipCountsByPolicyId(
                listOf(
                    "acc1_hazel",
                    "acc1_bloom",
                    "acc2_kaizn",
                    "acc3_kaizn",
                    "acc4_hazel"
                ),
                testServer.tokenRoles.filter { it.filters.isEmpty() }.map { r -> r.acceptedAssets.map { it.policyId } }
                    .flatten().toSet(),
                emptySet(),
            )
        } returns listOf(
            TokenOwnershipInfoWithAssetCount(
                "acc2_kaizn",
                "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601",
                1
            ),
            TokenOwnershipInfoWithAssetCount(
                "acc2_kaizn",
                "2d01b3496fd22b1a61e6227c27250225b1186e5ebae7360b1fc5392c",
                2
            ),
            TokenOwnershipInfoWithAssetCount(
                "acc1_hazel",
                "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601",
                1
            ),
            TokenOwnershipInfoWithAssetCount(
                "acc1_hazel",
                "2d01b3496fd22b1a61e6227c27250225b1186e5ebae7360b1fc5392c",
                1
            ),
            TokenOwnershipInfoWithAssetCount(
                "acc1_hazel",
                "0e14267a8020229adc0184dd25fa3174c3f7d6caadcb4425c70e7c04",
                1
            ),
        )
        every {
            connectService.getAllTokenOwnershipAssetsByPolicyId(any(), any())
        } answers { emptyList() }
        val roleAssignmentService = RoleAssignmentService(
            connectService,
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            makeDiscordBanRepository(emptyList()),
        )

        val actual = roleAssignmentService.getAllCurrentTokenRoleAssignmentsForVerifications(
            getMockVerificationData(),
            testServer
        )
        Assertions.assertEquals(
            setOf(
                DiscordRoleAssignment(testServer.guildId, acc1.referenceId.toLong(), 21),
            ), actual
        )
    }

    @Test
    fun `metadata filter based roles with weights work`() {
        val testServer = makeTestDiscordServer(
            mutableSetOf(
                TokenOwnershipRole(
                    11,
                    mutableSetOf(TokenRoleAssetInfo("1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601")),
                    6,
                    null,
                    mutableSetOf(
                        TokenRoleMetadataFilter(3, "tags", AttributeOperatorType.CONTAINS, "potatoes", 5),
                        TokenRoleMetadataFilter(4, "tags", AttributeOperatorType.NOTCONTAINS, "potatoes", 1),
                    ),
                    22,
                    aggregationType = TokenOwnershipAggregationType.ANY_POLICY_FILTERED_OR,
                )
            )
        )
        val connectService = mockk<ConnectService>()
        every { connectService.getSyncInfo() } returns SyncInfo(311, Date(), 100.0)
        every {
            connectService.getAllTokenOwnershipAssetsByPolicyId(any(),
                testServer.tokenRoles.filter { it.filters.isNotEmpty() }
                    .map { r -> r.acceptedAssets.map { it.policyId } }.flatten().toSet()
            )
        } returns listOf(
            TokenOwnershipInfoWithAssetList(
                stakeAddress = "acc2_kaizn",
                policyIdWithOptionalAssetFingerprint = "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601",
                assetList = setOf("PXL1", "PXL4")
            ),
            TokenOwnershipInfoWithAssetList(
                stakeAddress = "acc1_hazel",
                policyIdWithOptionalAssetFingerprint = "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601",
                assetList = setOf("PXL3")
            ),
        )
        every {
            connectService.getAllTokenOwnershipCountsByPolicyId(any(), any(), any())
        } answers { emptyList() }
        val metadataMap = mapOf(
            Pair("PXL1", METADATA_DEADPXLZ_1),
            Pair("PXL4", METADATA_DEADPXLZ_4),
            Pair("PXL3", METADATA_DEADPXLZ_3),
        )
        val slot = slot<List<Pair<String, String>>>()
        every {
            connectService.getMultiAssetInfo(capture(slot))
        } answers {
            slot.captured.map {
                MultiAssetInfo(
                    PolicyId(it.first),
                    it.second,
                    AssetFingerprint("asset1796zkkayd4nxd2k9aw8epxphdeglnv86uzjpae"),
                    metadataMap[it.second] ?: "",
                    "",
                    1
                )
            }
        }
        val roleAssignmentService = RoleAssignmentService(
            connectService,
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            mockk(),
            makeDiscordBanRepository(emptyList()),
        )

        val actual = roleAssignmentService.getAllCurrentTokenRoleAssignmentsForVerifications(
            getMockVerificationData(),
            testServer
        )
        Assertions.assertEquals(
            setOf(
                DiscordRoleAssignment(testServer.guildId, acc2.referenceId.toLong(), 22),
            ), actual
        )
    }

//    private fun getMockStakepoolService(): StakepoolService {
//        val stakepoolService = mockk<StakepoolService>()
//        every { stakepoolService.getStakepools() } returns mapOf(
//            "be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4" to StakepoolInfo(
//                "be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4",
//                "hazel",
//                "HAZEL",
//                "",
//                "",
//                ""
//            ),
//            "9679eaa0fa242a9cdae4b030e714b66c0119fc9b3f7564b8f03a5316" to StakepoolInfo(
//                "9679eaa0fa242a9cdae4b030e714b66c0119fc9b3f7564b8f03a5316",
//                "bloom",
//                "BLOOM",
//                "",
//                "",
//                ""
//            ),
//            "f5b2ef0d7db63c8d00446cd7d9ce9cdb9e73023ffaa5e806decceb66" to StakepoolInfo(
//                "f5b2ef0d7db63c8d00446cd7d9ce9cdb9e73023ffaa5e806decceb66",
//                "kaizn",
//                "KAIZN",
//                "",
//                "",
//                ""
//            ),
//        )
//        return stakepoolService
//    }

    private fun getMockVerificationData() = listOf(
        Verification(1, 1, BlockchainType.CARDANO, "", "acc1_hazel", "", acc1, Date(), Date(), true, Date(), false),
        Verification(2, 1, BlockchainType.CARDANO, "", "acc1_bloom", "", acc1, Date(), Date(), true, Date(), false),
        Verification(3, 1, BlockchainType.CARDANO, "", "acc2_kaizn", "", acc2, Date(), Date(), true, Date(), false),
        Verification(4, 1, BlockchainType.CARDANO, "", "acc3_kaizn", "", acc3, Date(), Date(), true, Date(), false),
        Verification(5, 1, BlockchainType.CARDANO, "", "acc4_hazel", "", acc4, Date(), Date(), true, Date(), false),
    )

}