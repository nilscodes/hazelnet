package io.hazelnet.community.services

import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.quizzes.*
import io.hazelnet.community.persistence.DiscordQuizRepository
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*

@Service
class DiscordQuizService(
    private val discordQuizRepository: DiscordQuizRepository,
    private val discordServerService: DiscordServerService,
    private val roleAssignmentService: RoleAssignmentService,
) {
    fun listQuizzes(guildId: Long): List<DiscordQuiz> {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return discordQuizRepository.findByDiscordServerId(discordServer.id!!)
    }

    fun addQuiz(guildId: Long, discordQuiz: DiscordQuiz): DiscordQuiz {
        val discordServer = discordServerService.getDiscordServer(guildId)
        discordQuiz.discordServer = discordServer
        discordQuiz.createTime = Date.from(ZonedDateTime.now().toInstant())
        return discordQuizRepository.save(discordQuiz)
    }

    fun updateQuiz(guildId: Long, quizId: Int, discordQuizPartial: DiscordQuizPartial): DiscordQuiz {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val quiz = getQuiz(discordServer, quizId)
        if (discordQuizPartial.channelId != null) {
            quiz.channelId = discordQuizPartial.channelId
        }
        if (discordQuizPartial.messageId != null) {
            quiz.messageId = discordQuizPartial.messageId
        }
        if (discordQuizPartial.displayName != null) {
            quiz.displayName = discordQuizPartial.displayName
        }
        if (discordQuizPartial.description != null) {
            quiz.description = discordQuizPartial.description
        }
        if (discordQuizPartial.openAfter != null) {
            quiz.openAfter = discordQuizPartial.openAfter
        }
        if (discordQuizPartial.openUntil != null) {
            quiz.openUntil = discordQuizPartial.openUntil
        }
        if (discordQuizPartial.archived != null) {
            quiz.archived = discordQuizPartial.archived
        }
        if (discordQuizPartial.requiredRoles != null) {
            quiz.requiredRoles = discordQuizPartial.requiredRoles
        }
        if (discordQuizPartial.winnerCount != null) {
            quiz.winnerCount = discordQuizPartial.winnerCount
        }
        if (discordQuizPartial.attemptsPerQuestion != null) {
            quiz.attemptsPerQuestion = discordQuizPartial.attemptsPerQuestion
        }
        if (discordQuizPartial.correctAnswersRequired != null) {
            quiz.correctAnswersRequired = if (discordQuizPartial.correctAnswersRequired > 0) discordQuizPartial.correctAnswersRequired else 0
        }
        if (discordQuizPartial.logoUrl != null) {
            quiz.logoUrl = discordQuizPartial.logoUrl.ifBlank { null }
        }
        if (discordQuizPartial.awardedRole != null) {
            quiz.awardedRole = if (discordQuizPartial.awardedRole > 0) discordQuizPartial.awardedRole else null
        }
        discordQuizRepository.save(quiz)
        return quiz
    }

    fun deleteQuiz(guildId: Long, quizId: Int) {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val quiz = getQuiz(discordServer, quizId)
        discordQuizRepository.delete(quiz)
    }

    fun getQuiz(guildId: Long, quizId: Int): DiscordQuiz {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return getQuiz(discordServer, quizId)
    }

    private fun getQuiz(discordServer: DiscordServer, quizId: Int): DiscordQuiz {
        val quiz = discordQuizRepository.findByDiscordServerId(discordServer.id!!).find { quizId == it.id }
        if (quiz != null) {
            return quiz
        }
        throw NoSuchElementException("No quiz with ID $quizId found on Discord server with guild ID ${discordServer.guildId}")
    }

    fun listQuizzesToBeAnnounced(): List<DiscordQuizUpdate> {
        return discordQuizRepository.findQuizzesToBeAnnounced(Date()).map {
            DiscordQuizUpdate(
                guildId = it.getGuildId(),
                quizId = it.getQuizId(),
                channelId = it.getChannelId(),
                messageId = it.getMessageId(),
            )
        }
    }

    fun listQuizQuestions(guildId: Long, quizId: Int): Set<DiscordQuizQuestion> {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val quiz = getQuiz(discordServer, quizId)
        return quiz.questions
    }

    fun addQuizQuestion(guildId: Long, quizId: Int, discordQuizQuestion: DiscordQuizQuestion): DiscordQuizQuestion {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val quiz = getQuiz(discordServer, quizId)
        quiz.questions.add(discordQuizQuestion)
        discordQuizRepository.save(quiz)
        return discordQuizQuestion // TODO: It is known that this currently does not contain the proper question ID
    }

    fun getQuizQuestion(guildId: Long, quizId: Int, quizQuestionId: Int): DiscordQuizQuestion {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val quiz = getQuiz(discordServer, quizId)
        val question = quiz.questions.find { it.id == quizQuestionId }
        if (question != null) {
            return question
        }
        throw NoSuchElementException("No question with ID $quizQuestionId found for quiz $quizId on Discord server with guild ID ${discordServer.guildId}")
    }

    fun deleteQuizQuestion(guildId: Long, quizId: Int, quizQuestionId: Int) {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val quiz = getQuiz(discordServer, quizId)
        quiz.questions.removeIf { it.id == quizQuestionId }
        discordQuizRepository.save(quiz)
    }

    fun listQuizCompletions(guildId: Long, quizId: Int): Set<DiscordQuizCompletion> {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val quiz = getQuiz(discordServer, quizId)
        return quiz.completions
    }

    fun addQuizCompletion(guildId: Long, quizId: Int, discordQuizCompletion: DiscordQuizCompletion): DiscordQuizCompletion {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val quiz = getQuiz(discordServer, quizId)
        quiz.completions.removeIf { it.externalAccountId == discordQuizCompletion.externalAccountId }
        discordQuizCompletion.time = Date.from(ZonedDateTime.now().toInstant())
        val added = quiz.completions.add(discordQuizCompletion)
        discordQuizRepository.save(quiz)
        if (added && quiz.awardedRole != null) {
            roleAssignmentService.publishQuizRoleAssignmentsForGuildMember(discordServer.guildId, discordQuizCompletion.externalAccountId)
        }
        return discordQuizCompletion
    }

    fun getQuizCompletionForExternalAccount(guildId: Long, quizId: Int, externalAccountId: Long): DiscordQuizCompletion {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val quiz = getQuiz(discordServer, quizId)
        val completion = quiz.completions.find { it.externalAccountId == externalAccountId }
        if (completion != null) {
            return completion
        }
        throw NoSuchElementException("No completion for external account with ID $externalAccountId found for quiz $quizId on Discord server with guild ID ${discordServer.guildId}")
    }

    fun deleteQuizCompletionForExternalAccount(guildId: Long, quizId: Int, externalAccountId: Long) {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val quiz = getQuiz(discordServer, quizId)
        val removed = quiz.completions.removeIf { it.externalAccountId == externalAccountId }
        if (removed) {
            discordQuizRepository.save(quiz)
            if (quiz.awardedRole != null) {
                roleAssignmentService.publishQuizRoleAssignmentsForGuildMember(discordServer.guildId, externalAccountId)
            }
        } else {
            throw NoSuchElementException("No completion for external account with ID $externalAccountId found for quiz $quizId on Discord server with guild ID ${discordServer.guildId}")
        }
    }
}