package io.hazelnet.community.services

import io.hazelnet.community.data.BlockchainType
import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.Verification
import io.hazelnet.community.data.VerificationDto
import io.hazelnet.community.persistence.ExternalAccountRepository
import io.hazelnet.community.persistence.VerificationRepository
import io.hazelnet.shared.data.ExternalAccountType
import io.micrometer.core.instrument.simple.SimpleMeterRegistry
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Test
import java.util.*

class ExternalAccountServiceTest {

    @Test
    fun `adding a CIP-0030 verification invalidates other verifications for that stake address`() {
        val externalAccountRepository = mockk<ExternalAccountRepository>()
        every { externalAccountRepository.findById(2) } returns Optional.of(ExternalAccount(2, "", "", Date(), ExternalAccountType.DISCORD, null, false))
        val verificationRepository = mockk<VerificationRepository>(relaxed = true)
        val slot = slot<Verification>()
        every {
            verificationRepository.save(capture(slot))
        } answers {
            slot.captured.id = 3
            slot.captured
        }
        val externalAccountService = ExternalAccountService(externalAccountRepository, verificationRepository, mockk(), mockk(), mockk(), mockk(), SimpleMeterRegistry())
        externalAccountService.addExternalAccountVerification(2, VerificationDto(
            externalAccountId = 2,
            address = "addr1",
            blockchain = BlockchainType.CARDANO,
            cardanoStakeAddress = "stake1",
            validAfter = Date(),
            validBefore = Date(),
            confirmed = true,
            obsolete = false,
            confirmedAt = Date(),
        ))
        verify { verificationRepository.invalidateOutdatedVerifications("stake1", 3)}
    }
}