package io.hazelnet.community.security

import org.springframework.jdbc.core.ArgumentPreparedStatementSetter
import org.springframework.jdbc.core.JdbcOperations
import org.springframework.jdbc.core.PreparedStatementSetter
import org.springframework.jdbc.core.SqlParameterValue
import org.springframework.lang.Nullable
import org.springframework.security.oauth2.core.OAuth2TokenType
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames
import org.springframework.security.oauth2.server.authorization.JdbcOAuth2AuthorizationService
import org.springframework.security.oauth2.server.authorization.OAuth2Authorization
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository
import org.springframework.util.Assert
import java.nio.charset.StandardCharsets
import java.sql.Types

private const val COLUMN_NAMES = ("id, "
        + "registered_client_id, "
        + "principal_name, "
        + "authorization_grant_type, "
        + "attributes, "
        + "state, "
        + "authorization_code_value, "
        + "authorization_code_issued_at, "
        + "authorization_code_expires_at,"
        + "authorization_code_metadata,"
        + "access_token_value,"
        + "access_token_issued_at,"
        + "access_token_expires_at,"
        + "access_token_metadata,"
        + "access_token_type,"
        + "access_token_scopes,"
        + "oidc_id_token_value,"
        + "oidc_id_token_issued_at,"
        + "oidc_id_token_expires_at,"
        + "oidc_id_token_metadata,"
        + "refresh_token_value,"
        + "refresh_token_issued_at,"
        + "refresh_token_expires_at,"
        + "refresh_token_metadata")

private const val TABLE_NAME = "oauth2_authorization"

private const val UNKNOWN_TOKEN_TYPE_FILTER = "state = ? OR authorization_code_value = ? OR " +
        "access_token_value = ? OR refresh_token_value = ?"

private const val STATE_FILTER = "state = ?"
private const val AUTHORIZATION_CODE_FILTER = "authorization_code_value = ?"
private const val ACCESS_TOKEN_FILTER = "access_token_value = ?"
private const val REFRESH_TOKEN_FILTER = "refresh_token_value = ?"

private const val LOAD_AUTHORIZATION_SQL = ("SELECT " + COLUMN_NAMES
        + " FROM " + TABLE_NAME
        + " WHERE ")

class PostgresJdbcOAuth2AuthorizationService(jdbcOperations: JdbcOperations, registeredClientRepository: RegisteredClientRepository): JdbcOAuth2AuthorizationService(jdbcOperations, registeredClientRepository) {

    @Nullable
    override fun findByToken(token: String, @Nullable tokenType: OAuth2TokenType?): OAuth2Authorization? {
        Assert.hasText(token, "token cannot be empty")
        val parameters: MutableList<SqlParameterValue> = ArrayList()
        if (tokenType == null) {
            parameters.add(SqlParameterValue(Types.VARCHAR, token))
            parameters.add(SqlParameterValue(Types.BINARY, token.toByteArray(StandardCharsets.UTF_8)))
            parameters.add(SqlParameterValue(Types.BINARY, token.toByteArray(StandardCharsets.UTF_8)))
            parameters.add(SqlParameterValue(Types.BINARY, token.toByteArray(StandardCharsets.UTF_8)))
            return findBy(UNKNOWN_TOKEN_TYPE_FILTER, parameters)
        } else if (OAuth2ParameterNames.STATE == tokenType.value) {
            parameters.add(SqlParameterValue(Types.VARCHAR, token))
            return findBy(STATE_FILTER, parameters)
        } else if (OAuth2ParameterNames.CODE == tokenType.value) {
            parameters.add(SqlParameterValue(Types.BINARY, token.toByteArray(StandardCharsets.UTF_8)))
            return findBy(AUTHORIZATION_CODE_FILTER, parameters)
        } else if (OAuth2TokenType.ACCESS_TOKEN == tokenType) {
            parameters.add(SqlParameterValue(Types.BINARY, token.toByteArray(StandardCharsets.UTF_8)))
            return findBy(ACCESS_TOKEN_FILTER, parameters)
        } else if (OAuth2TokenType.REFRESH_TOKEN == tokenType) {
            parameters.add(SqlParameterValue(Types.BINARY, token.toByteArray(StandardCharsets.UTF_8)))
            return findBy(REFRESH_TOKEN_FILTER, parameters)
        }
        return null
    }

    private fun findBy(filter: String, parameters: List<SqlParameterValue>): OAuth2Authorization? {
        val pss: PreparedStatementSetter = ArgumentPreparedStatementSetter(parameters.toTypedArray())
        val result = jdbcOperations.query(LOAD_AUTHORIZATION_SQL + filter, pss, authorizationRowMapper)
        return if (result.isNotEmpty()) result[0] else null
    }
}