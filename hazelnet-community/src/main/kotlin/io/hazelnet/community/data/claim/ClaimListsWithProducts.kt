package io.hazelnet.community.data.claim

data class ClaimListsWithProducts(
    val claimLists: List<ClaimList>,
    val claimableProducts: List<PhysicalProduct>,
)
