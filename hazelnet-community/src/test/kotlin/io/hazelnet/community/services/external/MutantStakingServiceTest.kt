package io.hazelnet.community.services.external

import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.configuration.ConnectivityConfiguration
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource


@EnableConfigurationProperties(CommunityApplicationConfiguration::class)
@TestPropertySource("classpath:application.properties")
@SpringBootTest(classes = [MutantStakingService::class, ConnectivityConfiguration::class])
internal class MutantStakingServiceTest {

    @Autowired
    private lateinit var mutantStakingService: MutantStakingService


    @Test
    fun `check if mutant staking API results can be read by our code`()
    {
        Assertions.assertTrue(
            mutantStakingService.getStakedAssetsForPolicies(setOf("ca5fc915496a771109b98c4a2b76e32c21a8229f3332398cb8babcd7"))
                .isNotEmpty()
        )
    }

    @Test
    fun `check if mutant staking policies API contains a known used policy`()
    {
        Assertions.assertTrue(
            mutantStakingService.getStakeablePolicies().contains("ca5fc915496a771109b98c4a2b76e32c21a8229f3332398cb8babcd7")
        )
    }
}