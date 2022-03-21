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
        12,
        717264144759390200,
        "My guild",
        69693469034096,
        Date(),
        420,
        null,
        null,
        null,
        mutableSetOf(),
        mutableSetOf(),
        mutableSetOf(),
        mutableSetOf(),
        mutableSetOf(),
        mutableSetOf()
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
}