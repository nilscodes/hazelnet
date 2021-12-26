package io.hazelnet.community.data

import javax.persistence.*

@Entity
@Table(name = "accounts")
class Account(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="account_id")
    var id: Long?,

    @OneToMany(fetch = FetchType.EAGER)
    @JoinColumn(name = "account_id")
    var externalAccounts: MutableSet<ExternalAccount> = HashSet()
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Account

        if (id != other.id) return false
        if (externalAccounts != other.externalAccounts) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id?.hashCode() ?: 0
        result = 31 * result + externalAccounts.hashCode()
        return result
    }

    override fun toString(): String {
        return "Account(id=$id, externalAccounts=$externalAccounts)"
    }


}