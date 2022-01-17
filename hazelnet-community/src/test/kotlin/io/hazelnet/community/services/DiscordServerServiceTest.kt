package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.stakepool.DelegationInfo
import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo
import io.hazelnet.cardano.connect.data.token.TokenOwnershipInfo
import io.hazelnet.community.data.BlockchainType
import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.ExternalAccountType
import io.hazelnet.community.data.Verification
import io.hazelnet.community.data.cardano.Stakepool
import io.hazelnet.community.data.discord.DelegatorRole
import io.hazelnet.community.data.discord.DiscordRoleAssignment
import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.TokenOwnershipRole
import io.hazelnet.community.persistence.DiscordServerRepository
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import java.util.*

internal class DiscordServerServiceTest {

    private val acc1 = ExternalAccount(1, "7854", "Person 1", Date(), ExternalAccountType.DISCORD, null)
    private val acc2 = ExternalAccount(2, "12333", "Person 2", Date(), ExternalAccountType.DISCORD, null)
    private val acc3 = ExternalAccount(3, "510598102", "Person 3", Date(), ExternalAccountType.DISCORD, null)
    private val acc4 = ExternalAccount(4, "69", "Person 4", Date(), ExternalAccountType.DISCORD, null)

    private val testServer = DiscordServer(
            12,
            717264144759390200,
            "My guild",
            69693469034096,
            Date(),
            420,
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
            mutableSetOf(
                    TokenOwnershipRole(1, "ceb5dedd6cda3f0b4a98919b5d3827e15e324771642b57e0e6aabd57", 120, 999),
                    TokenOwnershipRole(2, "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601", 3, 31),
                    TokenOwnershipRole(3, "0e14267a8020229adc0184dd25fa3174c3f7d6caadcb4425c70e7c04", 76, 12),
            ),
            mutableSetOf(),
            mutableSetOf()
    )

    @Test
    fun getCurrentDelegatorRoleAssignments() {
        val connectService = mockk<ConnectService>()
        every { connectService.getCurrentEpoch() } returns 311
        every { connectService.getActiveDelegationForPools(testServer.stakepools.map { it.poolHash }) } returns listOf(
                DelegationInfo("be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4", 5000, "acc1_hazel"),
                DelegationInfo("9679eaa0fa242a9cdae4b030e714b66c0119fc9b3f7564b8f03a5316", 55000, "acc1_bloom"),
                DelegationInfo("f5b2ef0d7db63c8d00446cd7d9ce9cdb9e73023ffaa5e806decceb66", 200, "acc2_kaizn"),
                DelegationInfo("f5b2ef0d7db63c8d00446cd7d9ce9cdb9e73023ffaa5e806decceb66", 200000, "acc3_kaizn"),
                DelegationInfo("be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4", 100000, "acc4_hazel"),
        )
        val discordServerService = DiscordServerService(
                getMockStakepoolService(),
                getMockVerificationService(),
                connectService,
                getMockDiscordServerRepository(),
                mockk(),
                mockk(),
                mockk(),
                mockk(),
                mockk()
        )

        val actual = discordServerService.getCurrentDelegatorRoleAssignments(testServer.guildId)
        Assertions.assertEquals(setOf(
                DiscordRoleAssignment(testServer.guildId, acc1.referenceId.toLong(), 78),
                DiscordRoleAssignment(testServer.guildId, acc1.referenceId.toLong(), 662),
                DiscordRoleAssignment(testServer.guildId, acc3.referenceId.toLong(), 78),
                DiscordRoleAssignment(testServer.guildId, acc4.referenceId.toLong(), 78),
                DiscordRoleAssignment(testServer.guildId, acc4.referenceId.toLong(), 21),
        ), actual)
    }

    @Test
    fun getCurrentTokenRoleAssignments() {
        val connectService = mockk<ConnectService>()
        every { connectService.getCurrentEpoch() } returns 311
        every { connectService.getAllTokenOwnership(listOf("acc1_hazel", "acc1_bloom", "acc2_kaizn", "acc3_kaizn", "acc4_hazel"), testServer.tokenRoles.map { it.policyId }) } returns listOf(
                TokenOwnershipInfo("acc1_hazel", "ceb5dedd6cda3f0b4a98919b5d3827e15e324771642b57e0e6aabd57", 50),
                TokenOwnershipInfo("acc1_bloom", "ceb5dedd6cda3f0b4a98919b5d3827e15e324771642b57e0e6aabd57", 70),
                TokenOwnershipInfo("acc1_hazel", "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601", 1),
                TokenOwnershipInfo("acc1_bloom", "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601", 1),
                TokenOwnershipInfo("acc2_kaizn", "ceb5dedd6cda3f0b4a98919b5d3827e15e324771642b57e0e6aabd57", 600),
                TokenOwnershipInfo("acc2_kaizn", "0e14267a8020229adc0184dd25fa3174c3f7d6caadcb4425c70e7c04", 600),
                TokenOwnershipInfo("acc3_kaizn", "1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601", 3),
                TokenOwnershipInfo("acc4_hazel", "0e14267a8020229adc0184dd25fa3174c3f7d6caadcb4425c70e7c04", 75),
        )
        val discordServerService = DiscordServerService(
                getMockStakepoolService(),
                getMockVerificationService(),
                connectService,
                getMockDiscordServerRepository(),
                mockk(),
                mockk(),
                mockk(),
                mockk(),
                mockk()
        )

        val actual = discordServerService.getCurrentTokenRolesAssignments(testServer.guildId)
        Assertions.assertEquals(setOf(
                DiscordRoleAssignment(testServer.guildId, acc1.referenceId.toLong(), 999),
                DiscordRoleAssignment(testServer.guildId, acc2.referenceId.toLong(), 999),
                DiscordRoleAssignment(testServer.guildId, acc2.referenceId.toLong(), 12),
                DiscordRoleAssignment(testServer.guildId, acc3.referenceId.toLong(), 31),
        ), actual)
    }

    private fun getMockStakepoolService(): StakepoolService {
        val stakepoolService = mockk<StakepoolService>()
        every { stakepoolService.getStakepools() } returns mapOf(
                "be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4" to StakepoolInfo("be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4", "hazel", "HAZEL", "", "", ""),
                "9679eaa0fa242a9cdae4b030e714b66c0119fc9b3f7564b8f03a5316" to StakepoolInfo("9679eaa0fa242a9cdae4b030e714b66c0119fc9b3f7564b8f03a5316", "bloom", "BLOOM", "", "", ""),
                "f5b2ef0d7db63c8d00446cd7d9ce9cdb9e73023ffaa5e806decceb66" to StakepoolInfo("f5b2ef0d7db63c8d00446cd7d9ce9cdb9e73023ffaa5e806decceb66", "kaizn", "KAIZN", "", "", ""),
        )
        return stakepoolService
    }

    private fun getMockVerificationService(): VerificationService {
        val verificationService = mockk<VerificationService>()
        every { verificationService.getAllCompletedVerificationsForDiscordServer(testServer.id!!) } returns listOf(
                Verification(1, 1, BlockchainType.CARDANO, "", "acc1_hazel", "", acc1, Date(), Date(), true, Date(), false),
                Verification(2, 1, BlockchainType.CARDANO, "", "acc1_bloom", "", acc1, Date(), Date(), true, Date(), false),
                Verification(3, 1, BlockchainType.CARDANO, "", "acc2_kaizn", "", acc2, Date(), Date(), true, Date(), false),
                Verification(4, 1, BlockchainType.CARDANO, "", "acc3_kaizn", "", acc3, Date(), Date(), true, Date(), false),
                Verification(5, 1, BlockchainType.CARDANO, "", "acc4_hazel", "", acc4, Date(), Date(), true, Date(), false),
        )
        return verificationService
    }

    private fun getMockDiscordServerRepository(): DiscordServerRepository {
        val discordServerRepository = mockk<DiscordServerRepository>()
        every { discordServerRepository.findByGuildId(testServer.guildId) } returns Optional.of(testServer)
        return discordServerRepository
    }
}