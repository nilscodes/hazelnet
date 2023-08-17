package io.hazelnet.community.services

import io.hazelnet.shared.data.BlockchainType
import io.hazelnet.community.data.ExposedWallet
import io.hazelnet.community.data.Verification
import io.hazelnet.community.persistence.ExposedWalletRepository
import io.hazelnet.community.persistence.VerificationRepository
import io.micrometer.core.instrument.simple.SimpleMeterRegistry
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import java.util.*

internal class VerificationServiceTest {
    @Test
    fun `getExposedWallets should throw exception if verification does not exist`() {
        val verificationRepository = mockk<VerificationRepository>()
        every { verificationRepository.findById(1) } returns Optional.empty()
        val verificationService = VerificationService(mockk(), verificationRepository, mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), SimpleMeterRegistry())
        assertThrows(NoSuchElementException::class.java) {
            verificationService.getExposedWallets(1)
        }
    }

    @Test
    fun `addExposedWallet should throw exception if verification does not exist`() {
        val verificationRepository = mockk<VerificationRepository>()
        every { verificationRepository.findById(1) } returns Optional.empty()
        val verificationService = VerificationService(mockk(), verificationRepository, mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), SimpleMeterRegistry())
        assertThrows(NoSuchElementException::class.java) {
            verificationService.addExposedWallet(1, mockk())
        }
    }

    @Test
    fun `deleteExposedWallet should throw exception if verification does not exist`() {
        val verificationRepository = mockk<VerificationRepository>()
        every { verificationRepository.findById(1) } returns Optional.empty()
        val verificationService = VerificationService(mockk(), verificationRepository, mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), SimpleMeterRegistry())
        assertThrows(NoSuchElementException::class.java) {
            verificationService.deleteExposedWallet(1, 2)
        }
    }

    @Test
    fun `deleteExposedWallet should throw exception if exposed wallet ID does not exist`() {
        val verificationRepository = mockk<VerificationRepository>()
        every { verificationRepository.findById(1) } returns Optional.of(Verification(
            id = 1,
            amount = 1L,
            blockchain = BlockchainType.CARDANO,
            address = "",
            cardanoStakeAddress = "",
            transactionHash = "",
            externalAccount = mockk(),
            validBefore = Date(),
            validAfter = Date(),
            confirmedAt = Date(),
            confirmed = true,
            obsolete = false,
            succeededBy = null,
            exposedWallets = mutableSetOf()
        ))
        val verificationService = VerificationService(mockk(), verificationRepository, mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), SimpleMeterRegistry())
        assertThrows(NoSuchElementException::class.java) {
            verificationService.deleteExposedWallet(1, 2)
        }
    }

    @Test
    fun `getExposedWallets should return correct list of exposed wallets`() {
        val verificationRepository = mockk<VerificationRepository>()
        val expected = listOf(
            ExposedWallet(id = 1, discordServerId = 1, exposedAt = Date(), verificationId = 1),
            ExposedWallet(id = 2, discordServerId = 2, exposedAt = Date(), verificationId = 1),
        )
        every { verificationRepository.findById(1) } returns Optional.of(Verification(
            id = 1,
            amount = 1L,
            blockchain = BlockchainType.CARDANO,
            address = "",
            cardanoStakeAddress = "",
            transactionHash = "",
            externalAccount = mockk(),
            validBefore = Date(),
            validAfter = Date(),
            confirmedAt = Date(),
            confirmed = true,
            obsolete = false,
            succeededBy = null,
            exposedWallets = expected.toMutableSet()
        ))
        val verificationService = VerificationService(mockk(), verificationRepository, mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), SimpleMeterRegistry())
        assertEquals(expected, verificationService.getExposedWallets(1))
    }

    @Test
    fun `saving new exposed wallet works correctly`() {
        val exposedWalletRepository = mockk<ExposedWalletRepository>()
        val verificationRepository = mockk<VerificationRepository>()
        every { verificationRepository.findById(1) } returns Optional.of(Verification(
            id = 1,
            amount = 1L,
            blockchain = BlockchainType.CARDANO,
            address = "",
            cardanoStakeAddress = "",
            transactionHash = "",
            externalAccount = mockk(),
            validBefore = Date(),
            validAfter = Date(),
            confirmedAt = Date(),
            confirmed = true,
            obsolete = false,
            succeededBy = null,
            exposedWallets = mutableSetOf()
        ))
        every { exposedWalletRepository.save(any()) } answers {
            val savedExposedWallet = firstArg<ExposedWallet>()
            savedExposedWallet.id = 5
            savedExposedWallet
        }
        every { verificationRepository.save(any()) } returnsArgument 0
        val verificationService = VerificationService(mockk(), verificationRepository, mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), exposedWalletRepository, SimpleMeterRegistry())
        val exposedWallet = verificationService.addExposedWallet(1, ExposedWallet(id = null, discordServerId = 1, exposedAt = null, verificationId = 1))
        assertEquals(5, exposedWallet.id, "Correct ID set and save called")
        assertNotNull(exposedWallet.exposedAt, "Exposed at set as part of saving")
    }

    @Test
    fun `saving new exposed wallet throws exception on mismatch between base verification ID and verification ID in body`() {
        val verificationRepository = mockk<VerificationRepository>()
        every { verificationRepository.findById(1) } returns Optional.of(Verification(
            id = 1,
            amount = 1L,
            blockchain = BlockchainType.CARDANO,
            address = "",
            cardanoStakeAddress = "",
            transactionHash = "",
            externalAccount = mockk(),
            validBefore = Date(),
            validAfter = Date(),
            confirmedAt = Date(),
            confirmed = true,
            obsolete = false,
            succeededBy = null,
            exposedWallets = mutableSetOf()
        ))
        val verificationService = VerificationService(mockk(), verificationRepository, mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), SimpleMeterRegistry())
        assertThrows(IllegalArgumentException::class.java) {
            verificationService.addExposedWallet(1, ExposedWallet(id = null, discordServerId = 1, exposedAt = Date(), verificationId = 2))
        }
    }

    @Test
    fun `deleting exposed wallet works correctly`() {
        val exposedWalletRepository = mockk<ExposedWalletRepository>()
        val verificationRepository = mockk<VerificationRepository>()
        val expected = listOf(
            ExposedWallet(id = 1, discordServerId = 1, exposedAt = Date(), verificationId = 1),
            ExposedWallet(id = 2, discordServerId = 2, exposedAt = Date(), verificationId = 1),
        )
        every { exposedWalletRepository.delete(any()) } returns Unit
        every { verificationRepository.findById(1) } returns Optional.of(Verification(
            id = 1,
            amount = 1L,
            blockchain = BlockchainType.CARDANO,
            address = "",
            cardanoStakeAddress = "",
            transactionHash = "",
            externalAccount = mockk(),
            validBefore = Date(),
            validAfter = Date(),
            confirmedAt = Date(),
            confirmed = true,
            obsolete = false,
            succeededBy = null,
            exposedWallets = expected.toMutableSet()
        ))
        val verificationService = VerificationService(mockk(), verificationRepository, mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), exposedWalletRepository, SimpleMeterRegistry())
        verificationService.deleteExposedWallet(1, 2)
        verify { exposedWalletRepository.delete(expected[1]) }
    }
}