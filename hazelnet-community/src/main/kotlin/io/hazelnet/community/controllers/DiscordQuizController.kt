package io.hazelnet.community.controllers

import io.hazelnet.community.data.discord.quizzes.DiscordQuiz
import io.hazelnet.community.data.discord.quizzes.DiscordQuizCompletion
import io.hazelnet.community.data.discord.quizzes.DiscordQuizPartial
import io.hazelnet.community.data.discord.quizzes.DiscordQuizQuestion
import io.hazelnet.community.services.DiscordQuizService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping(("/discord"))
class DiscordQuizController(
    private val discordQuizService: DiscordQuizService
) {

    @GetMapping("/servers/{guildId}/quizzes")
    @ResponseStatus(HttpStatus.OK)
    fun listQuizzes(@PathVariable guildId: Long) = discordQuizService.listQuizzes(guildId)

    @PostMapping("/servers/{guildId}/quizzes")
    @ResponseStatus(HttpStatus.CREATED)
    fun addQuiz(@PathVariable guildId: Long, @RequestBody @Valid discordQuiz: DiscordQuiz): ResponseEntity<DiscordQuiz> {
        val newQuiz = discordQuizService.addQuiz(guildId, discordQuiz)
        return ResponseEntity
            .created(
                ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{quizId}")
                .buildAndExpand(newQuiz.id)
                .toUri())
            .body(newQuiz)
    }

    @GetMapping("/servers/{guildId}/quizzes/{quizId}")
    @ResponseStatus(HttpStatus.OK)
    fun getQuiz(@PathVariable guildId: Long, @PathVariable quizId: Int) = discordQuizService.getQuiz(guildId, quizId)

    @PatchMapping("/servers/{guildId}/quizzes/{quizId}")
    @ResponseStatus(HttpStatus.OK)
    fun updateQuiz(@PathVariable guildId: Long, @PathVariable quizId: Int, @RequestBody @Valid discordQuizPartial: DiscordQuizPartial) = discordQuizService.updateQuiz(guildId, quizId, discordQuizPartial)

    @DeleteMapping("/servers/{guildId}/quizzes/{quizId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteQuiz(@PathVariable guildId: Long, @PathVariable quizId: Int) = discordQuizService.deleteQuiz(guildId, quizId)

    @GetMapping("/servers/{guildId}/quizzes/{quizId}/questions")
    @ResponseStatus(HttpStatus.OK)
    fun listQuizQuestions(@PathVariable guildId: Long, @PathVariable quizId: Int) = discordQuizService.listQuizQuestions(guildId, quizId)

    @PostMapping("/servers/{guildId}/quizzes/{quizId}/questions")
    @ResponseStatus(HttpStatus.CREATED)
    fun addQuizQuestion(@PathVariable guildId: Long, @PathVariable quizId: Int, @RequestBody @Valid discordQuizQuestion: DiscordQuizQuestion): ResponseEntity<DiscordQuizQuestion> {
        val newQuizQuestion = discordQuizService.addQuizQuestion(guildId, quizId, discordQuizQuestion)
        return ResponseEntity
            .created(
                ServletUriComponentsBuilder.fromCurrentRequest()
                    .path("/{quizQuestionId}")
                    .buildAndExpand(newQuizQuestion.id) // TODO This is currently always null
                    .toUri())
            .body(newQuizQuestion)
    }

    @GetMapping("/servers/{guildId}/quizzes/{quizId}/questions/{quizQuestionId}")
    @ResponseStatus(HttpStatus.OK)
    fun getQuizQuestion(@PathVariable guildId: Long, @PathVariable quizId: Int, @PathVariable quizQuestionId: Int) = discordQuizService.getQuizQuestion(guildId, quizId, quizQuestionId)

    @DeleteMapping("/servers/{guildId}/quizzes/{quizId}/questions/{quizQuestionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteQuizQuestion(@PathVariable guildId: Long, @PathVariable quizId: Int, @PathVariable quizQuestionId: Int) = discordQuizService.deleteQuizQuestion(guildId, quizId, quizQuestionId)

    @GetMapping("/servers/{guildId}/quizzes/{quizId}/completions")
    @ResponseStatus(HttpStatus.OK)
    fun listQuizCompletions(@PathVariable guildId: Long, @PathVariable quizId: Int) = discordQuizService.listQuizCompletions(guildId, quizId)

    @PostMapping("/servers/{guildId}/quizzes/{quizId}/completions")
    @ResponseStatus(HttpStatus.CREATED)
    fun addQuizCompletion(@PathVariable guildId: Long, @PathVariable quizId: Int, @RequestBody @Valid discordQuizCompletion: DiscordQuizCompletion): ResponseEntity<DiscordQuizCompletion> {
        val newQuizCompletion: DiscordQuizCompletion = discordQuizService.addQuizCompletion(guildId, quizId, discordQuizCompletion)
        return ResponseEntity
            .created(
                ServletUriComponentsBuilder.fromCurrentRequest()
                    .path("/{externalAccountId}")
                    .buildAndExpand(newQuizCompletion.externalAccountId)
                    .toUri())
            .body(newQuizCompletion)
    }

    @GetMapping("/servers/{guildId}/quizzes/{quizId}/completions/{externalAccountId}")
    @ResponseStatus(HttpStatus.OK)
    fun getQuizCompletionForExternalAccount(@PathVariable guildId: Long, @PathVariable quizId: Int, @PathVariable externalAccountId: Long) = discordQuizService.getQuizCompletionForExternalAccount(guildId, quizId, externalAccountId)

    @DeleteMapping("/servers/{guildId}/quizzes/{quizId}/completions/{externalAccountId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteQuizCompletionForExternalAccount(@PathVariable guildId: Long, @PathVariable quizId: Int, @PathVariable externalAccountId: Long) = discordQuizService.deleteQuizCompletionForExternalAccount(guildId, quizId, externalAccountId)

    @GetMapping("/quizzes/announcements")
    @ResponseStatus(HttpStatus.OK)
    fun listQuizzesToBeAnnounced() = discordQuizService.listQuizzesToBeAnnounced()

}