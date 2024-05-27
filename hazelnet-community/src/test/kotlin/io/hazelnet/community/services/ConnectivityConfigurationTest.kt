package io.hazelnet.community.services

import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.NftCdnConfiguration
import io.hazelnet.community.configuration.ConnectivityConfiguration
import io.mockk.*
import org.junit.jupiter.api.Test

import org.junit.jupiter.api.Assertions.*
import org.springframework.http.HttpMethod
import org.springframework.web.reactive.function.client.ClientRequest
import org.springframework.web.reactive.function.client.ExchangeFunction
import reactor.core.publisher.Mono
import java.net.URI

class ConnectivityConfigurationTest {

    @Test
    fun nftCdnHash() {
        val connectivityConfiguration = ConnectivityConfiguration(
            CommunityApplicationConfiguration(
                mockk(),
                mockk(),
                mockk(),
                mockk(),
                mockk(),
                null,
                null,
                null,
                null,
                mockk(),
                NftCdnConfiguration("hazel", "ghTahnr2pfjjGn100vBPfF0BA8lXmH8rMQWklCtw0yA="),
                null,
            )
        )

        val imageNoParams =
            "https://asset1rhmwfllvhgczltxm0y7rdump6g5p5ax4c25csq.hazel.nftcdn.io/image?tk=mbaF3LIcIgvM0FsNgaBSkPnTzkVFNUnunuglF_XSIYE"
        val imageSizeParam =
            "https://asset1rhmwfllvhgczltxm0y7rdump6g5p5ax4c25csq.hazel.nftcdn.io/image?size=512&tk=Nhw3mLbvAAoMvilAiEWoOL4IKcAODbJbZHSyshR41tQ"
        val imageMultipleParams =
            "https://asset1rhmwfllvhgczltxm0y7rdump6g5p5ax4c25csq.hazel.nftcdn.io/image?size=256&ts=1667531328&exp=604800&tk=RRbEbvzDWaJbDkJ2xXjkxqRVqaB8P2Pz59ODMNsiBjw"
        val metadataNoParams =
            "https://asset1rhmwfllvhgczltxm0y7rdump6g5p5ax4c25csq.hazel.nftcdn.io/metadata?tk=1qTVmYWmQ8mRRaImUbK8hw7Wlbqe2WLsCVjbf0i8fIM"

        val requestSlot1 = prepareRequest(connectivityConfiguration, "https://asset1rhmwfllvhgczltxm0y7rdump6g5p5ax4c25csq.hazel.nftcdn.io/image")
        assertEquals(imageNoParams, requestSlot1.captured.url().toASCIIString())
        val requestSlot2 = prepareRequest(connectivityConfiguration, "https://asset1rhmwfllvhgczltxm0y7rdump6g5p5ax4c25csq.hazel.nftcdn.io/image?size=512")
        assertEquals(imageSizeParam, requestSlot2.captured.url().toASCIIString())
        val requestSlot3 = prepareRequest(connectivityConfiguration, "https://asset1rhmwfllvhgczltxm0y7rdump6g5p5ax4c25csq.hazel.nftcdn.io/image?size=256&ts=1667531328&exp=604800")
        assertEquals(imageMultipleParams, requestSlot3.captured.url().toASCIIString())
        val requestSlot4 = prepareRequest(connectivityConfiguration, "https://asset1rhmwfllvhgczltxm0y7rdump6g5p5ax4c25csq.hazel.nftcdn.io/metadata")
        assertEquals(metadataNoParams, requestSlot4.captured.url().toASCIIString())
    }

    private fun prepareRequest(connectivityConfiguration: ConnectivityConfiguration, url: String): CapturingSlot<ClientRequest> {
        val request = ClientRequest.create(
            HttpMethod.GET,
            URI(url)
        ).build()
        val mockExchange = mockk<ExchangeFunction>()
        val requestSlot = slot<ClientRequest>()
        every {
            mockExchange.exchange(capture(requestSlot))
        }.answers { Mono.empty() }
        connectivityConfiguration.nftCdnHash().invoke(request, mockExchange)
        return requestSlot
    }
}