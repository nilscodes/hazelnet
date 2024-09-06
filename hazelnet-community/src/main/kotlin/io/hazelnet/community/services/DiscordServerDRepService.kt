package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.drep.DRepInfo
import io.hazelnet.community.data.cardano.DRep
import io.hazelnet.community.data.discord.DRepDelegatorRole
import io.hazelnet.community.data.discord.DiscordRoleAssignment
import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.persistence.DiscordDRepDelegatorRoleRepository
import io.hazelnet.community.persistence.DiscordServerRepository
import org.springframework.stereotype.Service

@Service
class DiscordServerDRepService(
    private val discordServerRetriever: DiscordServerRetriever,
    private val discordServerRepository: DiscordServerRepository,
    private val discordDRepDelegatorRoleRepository: DiscordDRepDelegatorRoleRepository,
    private val connectService: ConnectService,
    private val roleAssignmentService: RoleAssignmentService,
    private val verificationService: VerificationService,
    private val dRepService: DRepService,
) {
    fun getDReps(guildId: Long) = getDiscordServerWithDRepInfo(guildId).dreps.toSet()

    private fun getDiscordServerWithDRepInfo(guildId: Long): DiscordServer {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        val dRepMap = dRepService.getDReps()
        discordServer.dreps.map { it.info = dRepMap[it.dRepHash] }
        return discordServer
    }

    fun addDRep(guildId: Long, dRep: DRep): DRep {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        this.confirmValidDRepAndUpdateHashIfNeeded(dRep)
        discordServer.dreps.add(dRep)
        discordServerRepository.save(discordServer)
        val dRepMap = dRepService.getDReps()
        dRep.info = dRepMap[dRep.dRepHash]
        return dRep
    }

    private fun confirmValidDRepAndUpdateHashIfNeeded(dRep: DRep) {
        val validDReps = getValidDReps(dRep.dRepHash)
        if (validDReps.isNotEmpty()) {
            dRep.dRepHash = validDReps[0].hash
            return
        }
        throw NoSuchElementException("No dRep found with dRep hash ${dRep.dRepHash}")
    }

    private fun getValidDReps(drepHash: String): List<DRepInfo> {
        val validDReps = if (drepHash.startsWith("drep1")) {
            connectService.resolveDRepView(drepHash)
        } else {
            connectService.resolveDRepHash(drepHash)
        }
        return validDReps
    }

    fun deleteDRep(guildId: Long, dRepHash: String) {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        discordServer.dreps.removeIf { it.dRepHash.equals(dRepHash, ignoreCase = true) }
        discordServerRepository.save(discordServer)
    }

    fun addDRepDelegatorRole(guildId: Long, delegatorRole: DRepDelegatorRole): DRepDelegatorRole {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        this.confirmValidDRepAndUpdateHashIfNeeded(delegatorRole)
        discordDRepDelegatorRoleRepository.save(delegatorRole)
        discordServer.drepDelegatorRoles.add(delegatorRole)
        discordServerRepository.save(discordServer)
        return delegatorRole
    }

    fun getDRepDelegatorRoles(guildId: Long) = discordServerRetriever.getDiscordServer(guildId).drepDelegatorRoles.toSet()

    private fun confirmValidDRepAndUpdateHashIfNeeded(dRepDelegatorRole: DRepDelegatorRole) {
        if (dRepDelegatorRole.dRepHash != null) {
            val validDReps = getValidDReps(dRepDelegatorRole.dRepHash!!)
            if (validDReps.isNotEmpty()) {
                dRepDelegatorRole.dRepHash = validDReps[0].hash
                return
            }
            throw NoSuchElementException("No stakepool found with dRep hash ${dRepDelegatorRole.dRepHash}")
        }
    }

    fun deleteDRepDelegatorRole(guildId: Long, dRepDelegatorRoleId: Long) {
        getDRepDelegatorRole(guildId, dRepDelegatorRoleId) // Verify existence
        discordDRepDelegatorRoleRepository.deleteById(dRepDelegatorRoleId)
    }

    private fun getDRepDelegatorRole(
        guildId: Long,
        dRepDelegatorRoleId: Long
    ): DRepDelegatorRole {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        return discordServer.drepDelegatorRoles
            .find { it.id == dRepDelegatorRoleId }
            ?: throw NoSuchElementException("No dRep delegator role with ID $dRepDelegatorRoleId found on guild $guildId")
    }

    fun getEligibleDRepDelegatorRolesOfUser(guildId: Long, externalAccountId: Long): Set<DiscordRoleAssignment> {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        return roleAssignmentService.getAllCurrentDRepDelegatorRoleAssignmentsForGuildMember(discordServer, externalAccountId)
    }

    fun getAllCurrentDRepDelegatorRoleAssignmentsForGuild(guildId: Long): Set<DiscordRoleAssignment> {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        val allDelegationToAllowedPools = connectService.getActiveDelegationForDReps(discordServer.dreps.map { it.dRepHash }, false)
        val allVerificationsOfMembers = verificationService.getAllCompletedVerificationsForDiscordServer(discordServer.id!!)
        return roleAssignmentService.getAllCurrentDRepDelegatorRoleAssignmentsForVerifications(allVerificationsOfMembers, allDelegationToAllowedPools, discordServer)
    }


}