package io.hazelnet.cardano.connect.data.stakepool

data class StakepoolInfo(
        val hash: String,
        val view: String,
        val ticker: String,
        val name: String,
        val website: String,
        val description: String
) {
    override fun toString(): String {
        return "StakepoolInfo(hash='$hash', view='$view', ticker='$ticker', name='$name', website='$website', description='$description')"
    }
}