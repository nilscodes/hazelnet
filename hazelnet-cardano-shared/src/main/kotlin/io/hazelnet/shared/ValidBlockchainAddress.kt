import io.hazelnet.shared.data.BlockchainType
import javax.validation.Constraint
import javax.validation.ConstraintValidator
import javax.validation.ConstraintValidatorContext
import javax.validation.Payload
import kotlin.annotation.AnnotationRetention.RUNTIME
import kotlin.annotation.AnnotationTarget.*
import kotlin.reflect.KClass

@Target(FIELD)
@Retention(RUNTIME)
@MustBeDocumented
@Constraint(validatedBy = [BlockchainAddressValidator::class])
annotation class ValidBlockchainAddress(
    val message: String = "Invalid blockchain address",
    val groups: Array<KClass<out Any>> = [],
    val payload: Array<KClass<out Payload>> = [],
    val allowedTypes: Array<BlockchainType> = []
)

const val cardanoPattern = "^(addr1|ADDR1)[A-Za-z0-9]{98}$"
const val ethereumPattern = "^(0x)?[0-9a-fA-F]{40}$"
const val bitcoinPaymentPattern = "^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$"
const val bitcoinTaprootPattern = "^[bB][cC]1[pP][a-zA-Z0-9]{38,58}$"
const val bitcoinSegwitPattern = "^[bB][cC]1[qQ][a-zA-Z0-9]{38,58}$"

class BlockchainAddressValidator : ConstraintValidator<ValidBlockchainAddress, String> {
    private lateinit var allowedTypes: Array<BlockchainType>

    override fun initialize(constraintAnnotation: ValidBlockchainAddress) {
        this.allowedTypes = constraintAnnotation.allowedTypes.let { types ->
            if (types.isEmpty()) {
                BlockchainType.values()
            } else {
                types
            }
        }
    }

    override fun isValid(value: String?, context: ConstraintValidatorContext): Boolean {
        if (value == null) {
            return false
        }

        for (type in allowedTypes) {
            val pattern = when (type) {
                BlockchainType.CARDANO -> cardanoPattern
                BlockchainType.ETHEREUM -> ethereumPattern
                BlockchainType.POLYGON -> ethereumPattern
                BlockchainType.BITCOIN -> bitcoinPaymentPattern
            }
            if (value.matches(pattern.toRegex())) {
                return true
            }
        }
        return false
    }

    companion object {
        fun blockchainFromAddress(address: String): Set<BlockchainType> {
            return when {
                address.matches(cardanoPattern.toRegex()) -> {
                    setOf(BlockchainType.CARDANO)
                }
                address.matches(ethereumPattern.toRegex()) -> {
                    setOf(BlockchainType.ETHEREUM, BlockchainType.POLYGON)
                }
                address.matches(bitcoinPaymentPattern.toRegex())
                        || address.matches(bitcoinTaprootPattern.toRegex())
                        || address.matches(bitcoinSegwitPattern.toRegex()) -> {
                    setOf(BlockchainType.BITCOIN)
                }
                else -> {
                    emptySet()
                }
            }
        }
    }
}
