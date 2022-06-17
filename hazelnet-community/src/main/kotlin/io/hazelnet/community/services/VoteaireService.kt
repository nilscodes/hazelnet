package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.address.AddressDetails
import io.hazelnet.community.data.external.voteaire.ProposalInfo
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import java.util.*

@Service
class VoteaireService(
    @field:Qualifier("voteaireClient")
    private val voteaireClient: WebClient,
) {

    fun getProposalInfo(proposalId: UUID): ProposalInfo {
        return voteaireClient.get()
            .uri("/proposal/$proposalId")
            .retrieve()
            .bodyToMono(ProposalInfo::class.java)
            .block()!!
    }
}