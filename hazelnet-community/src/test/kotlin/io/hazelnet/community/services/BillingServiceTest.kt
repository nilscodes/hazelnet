package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.stakepool.DelegationInfo
import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo
import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.DiscordServerMemberStakeImpl
import io.hazelnet.community.persistence.DiscordServerRepository
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import java.util.*

internal class BillingServiceTest {
    private val testServer = DiscordServer(
        id = 12,
        guildId = 717264144759390200,
        guildName = "My guild",
        guildOwner = 69693469034096,
        joinTime = Date(),
        guildMemberCount = 420,
        guildMemberUpdateTime = null,
        ownerAccount = null,
        premiumUntil = null,
        premiumReminder = null,
        tokenPolicies = mutableSetOf(),
        stakepools = mutableSetOf(),
        delegatorRoles = mutableSetOf(),
        tokenRoles = mutableSetOf(),
        whitelists = mutableSetOf(),
        settings = mutableSetOf()
    )

    @Test
    fun getBotFunding() {
        val discordServerRepository = getMockDiscordServerRepository()
        every { discordServerRepository.getDiscordMembersWithStakeAndPremiumPledge(testServer.id!!) } returns listOf(
            DiscordServerMemberStakeImpl(12, 1, "stake1u85acdjxss6vl3wlcjalf8ygxydt6frv3getwvs4eqn25gss9a3ff"),
            DiscordServerMemberStakeImpl(
                12,
                1,
                "stake1u85acdjxss6vl3wlcjalf8ygxydt6frv3getwvs4eqn25gss9a3ff"
            ), // Verify dupes from same user get removed
            DiscordServerMemberStakeImpl(
                12,
                3,
                "stake1u85acdjxss6vl3wlcjalf8ygxydt6frv3getwvs4eqn25gss9a3ff"
            ), // Verify dupes across different users only get counted once
            DiscordServerMemberStakeImpl(
                2,
                1,
                "stake1u85acdjxss6vl3wlcjalf8ygxydt6frv3getwvs4eqn25gss9a3ff"
            ), // Verify stake used on other server is divided by servers used
            DiscordServerMemberStakeImpl(
                12,
                2,
                "stake1u83symn8huw6s8qldqggdj2rz0n2f72yqxpt8txcya87vcsrlqsmy"
            ) // Verify unrelated external account is considered
        )
        val stakepoolService = getMockStakepoolService()
        every { stakepoolService.getDelegation("be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4") } returns listOf(
            DelegationInfo(
                "be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4",
                7191940752,
                "stake1u83symn8huw6s8qldqggdj2rz0n2f72yqxpt8txcya87vcsrlqsmy"
            ),
            DelegationInfo(
                "be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4",
                167765168318,
                "stake1u85acdjxss6vl3wlcjalf8ygxydt6frv3getwvs4eqn25gss9a3ff"
            ),
            DelegationInfo(
                "be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4",
                323824643,
                "stake1u85p5zmf22334d83yzf76femww5zm6cf2cdzfsceehh3eggzfyypy"
            ),
        )
        val discordServerService = mockk<DiscordServerService>()
        every { discordServerService.getDiscordServer(testServer.guildId) } returns(testServer)
        val mockConfig = mockk<CommunityApplicationConfiguration>()
        every { mockConfig.fundedpool } returns "be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4"
        val billingService = BillingService(
            mockConfig,
            stakepoolService,
            discordServerService,
            discordServerRepository,
            mockk(),
            mockk(),
            mockk(),
        )

        assertEquals(91074524911L, billingService.getBotFunding(testServer.guildId))

    }

    private fun getMockDiscordServerRepository(): DiscordServerRepository {
        val discordServerRepository = mockk<DiscordServerRepository>()
        every { discordServerRepository.findByGuildId(testServer.guildId) } returns Optional.of(testServer)
        return discordServerRepository
    }

    private fun getMockStakepoolService(): StakepoolService {
        val stakepoolService = mockk<StakepoolService>()
        every { stakepoolService.getStakepools() } returns mapOf(
            "be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4" to StakepoolInfo(
                "be80794a946cf5e578846fc81e3c62ac13f4ab3335e0f5dc046edad4",
                "hazel",
                "HAZEL",
                "",
                "",
                ""
            ),
        )
        return stakepoolService
    }

    @Test
    fun calculateMonthlyActualCostInLovelace() {
        val billingService = BillingService(mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk())
        assertEquals(10000000, getCost(billingService, 50, 0))
        assertEquals(8000000, getCost(billingService, 50, 100))
        assertEquals(4000000, getCost(billingService, 50, 300))
        assertEquals(10000000, getCost(billingService, 100, 0))
        assertEquals(9000000, getCost(billingService, 100, 100))
        assertEquals(5000000, getCost(billingService, 100, 500))
        assertEquals(10000000, getCost(billingService, 250, 0))
        assertEquals(8000000, getCost(billingService, 250, 500))
        assertEquals(2000000, getCost(billingService, 250, 2000))
        assertEquals(10000000, getCost(billingService, 500, 0))
        assertEquals(9000000, getCost(billingService, 500, 500))
        assertEquals(2000000, getCost(billingService, 500, 4000))
        assertEquals(20000000, getCost(billingService, 1000, 0))
        assertEquals(18000000, getCost(billingService, 1000, 1000))
        assertEquals(8000000, getCost(billingService, 1000, 6000))
        assertEquals(20000000, getCost(billingService, 2000, 0))
        assertEquals(18000000, getCost(billingService, 2000, 2000))
        assertEquals(8000000, getCost(billingService, 2000, 12000))
        assertEquals(30000000, getCost(billingService, 5000, 0))
        assertEquals(24000000, getCost(billingService, 5000, 10000))
        assertEquals(12000000, getCost(billingService, 5000, 30000))
        assertEquals(40000000, getCost(billingService, 10000, 0))
        assertEquals(38000000, getCost(billingService, 10000, 5000))
        assertEquals(28000000, getCost(billingService, 10000, 30000))
        assertEquals(40000000, getCost(billingService, 20000, 0))
        assertEquals(38000000, getCost(billingService, 20000, 10000))
        assertEquals(34000000, getCost(billingService, 20000, 30000))
        assertEquals(49000000, getCost(billingService, 25000, 5000))
        assertEquals(45000000, getCost(billingService, 25000, 25000))
        assertEquals(40000000, getCost(billingService, 25000, 50000))
        assertEquals(59400000, getCost(billingService, 50000, 5000))
        assertEquals(54000000, getCost(billingService, 50000, 50000))
        assertEquals(48000000, getCost(billingService, 50000, 100000))
        assertEquals(69300000, getCost(billingService, 100000, 10000))
        assertEquals(66500000, getCost(billingService, 100000, 50000))
        assertEquals(56000000, getCost(billingService, 100000, 200000))
    }

    private fun getCost(billingService: BillingService, memberCount: Int, delegationInAda: Long): Long {
        return billingService.calculateMonthlyActualCostInLovelace(
            billingService.calculateMonthlyTotalCostInLovelace(memberCount),
            delegationInAda * 1000000,
            billingService.calculateMaximumDelegationDiscountAmountInLovelace(memberCount),
        )
    }

    @Test
    fun calculateMaximumDelegationDiscountAmountInLovelace() {
        val billingService = BillingService(mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk())
        assertEquals(500000000, billingService.calculateMaximumDelegationDiscountAmountInLovelace(50))
        assertEquals(1000000000, billingService.calculateMaximumDelegationDiscountAmountInLovelace(100))
        assertEquals(2500000000, billingService.calculateMaximumDelegationDiscountAmountInLovelace(250))
        assertEquals(5000000000, billingService.calculateMaximumDelegationDiscountAmountInLovelace(500))
        assertEquals(10000000000, billingService.calculateMaximumDelegationDiscountAmountInLovelace(1000))
        assertEquals(20000000000, billingService.calculateMaximumDelegationDiscountAmountInLovelace(2000))
        assertEquals(50000000000, billingService.calculateMaximumDelegationDiscountAmountInLovelace(5000))
        assertEquals(100000000000, billingService.calculateMaximumDelegationDiscountAmountInLovelace(10000))
        assertEquals(200000000000, billingService.calculateMaximumDelegationDiscountAmountInLovelace(20000))
        assertEquals(250000000000, billingService.calculateMaximumDelegationDiscountAmountInLovelace(25000))
        assertEquals(500000000000, billingService.calculateMaximumDelegationDiscountAmountInLovelace(50000))
        assertEquals(1000000000000, billingService.calculateMaximumDelegationDiscountAmountInLovelace(100000))
    }

    @Test
    fun calculateMonthlyTotalCostInLovelace() {
        val billingService = BillingService(mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk())
        assertEquals(10000000, billingService.calculateMonthlyTotalCostInLovelace(50))
        assertEquals(10000000, billingService.calculateMonthlyTotalCostInLovelace(999))
        assertEquals(20000000, billingService.calculateMonthlyTotalCostInLovelace(1000))
        assertEquals(20000000, billingService.calculateMonthlyTotalCostInLovelace(4999))
        assertEquals(30000000, billingService.calculateMonthlyTotalCostInLovelace(5000))
        assertEquals(30000000, billingService.calculateMonthlyTotalCostInLovelace(9999))
        assertEquals(40000000, billingService.calculateMonthlyTotalCostInLovelace(10000))
        assertEquals(40000000, billingService.calculateMonthlyTotalCostInLovelace(24999))
        assertEquals(50000000, billingService.calculateMonthlyTotalCostInLovelace(25000))
        assertEquals(50000000, billingService.calculateMonthlyTotalCostInLovelace(49999))
        assertEquals(60000000, billingService.calculateMonthlyTotalCostInLovelace(50000))
        assertEquals(60000000, billingService.calculateMonthlyTotalCostInLovelace(99999))
        assertEquals(70000000, billingService.calculateMonthlyTotalCostInLovelace(100000))
        assertEquals(70000000, billingService.calculateMonthlyTotalCostInLovelace(249999))
        assertEquals(70000000, billingService.calculateMonthlyTotalCostInLovelace(500000))

    }
}