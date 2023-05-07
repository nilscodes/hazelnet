import axios from 'axios';
import { BaseApi } from './base';
import { Quiz } from '../types/quiz/quiz';
import { QuizPartial } from '../types/quiz/quizPartial';
import { QuizQuestion } from '../types/quiz/quizQuestion';
import { QuizCompletion } from '../types/quiz/quizCompletion';
import { DiscordQuizUpdate } from '../types/quiz/discordQuizUpdate';
import { DiscordRoleAssignment } from '../types/roles/discordRoleAssignment';

export class DiscordQuizApi extends BaseApi {
  async createQuiz(guildId: string, quizObject: Quiz) {
    const newQuizPromise = await axios.post(`${this.apiUrl}/discord/servers/${guildId}/quizzes`, quizObject);
    return newQuizPromise.data;
  }

  async updateQuiz(guildId: string, quizId: number, discordQuizPartial: QuizPartial): Promise<Quiz> {
    const discordQuizPromise = await axios.patch(`${this.apiUrl}/discord/servers/${guildId}/quizzes/${quizId}`, discordQuizPartial);
    return discordQuizPromise.data;
  }

  async getQuizzes(guildId: string): Promise<Quiz[]> {
    const quizzes = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/quizzes`);
    return quizzes.data;
  }

  async getQuiz(guildId: string, quizId: number): Promise<Quiz> {
    const quiz = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/quizzes/${quizId}`);
    return quiz.data;
  }

  async deleteQuiz(guildId: string, quizId: number) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/quizzes/${quizId}`);
  }

  async listQuizQuestions(guildId: string, quizId: number): Promise<QuizQuestion[]> {
    const quizQuestions = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/quizzes/${quizId}/questions`);
    return quizQuestions.data;
  }

  async addQuizQuestion(guildId: string, quizId: number, quizQuestion: QuizQuestion): Promise<QuizQuestion> {
    const newQuizQuestionPromise = await axios.post(`${this.apiUrl}/discord/servers/${guildId}/quizzes/${quizId}/questions`, quizQuestion);
    return newQuizQuestionPromise.data;
  }

  async getQuizQuestion(guildId: string, quizId: number, quizQuestionId: number): Promise<QuizQuestion> {
    const newQuizQuestionPromise = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/quizzes/${quizId}/questions/${quizQuestionId}`);
    return newQuizQuestionPromise.data;
  }

  async deleteQuizQuestion(guildId: string, quizId: number, quizQuestionId: number) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/quizzes/${quizId}/questions/${quizQuestionId}`);
  }

  async listQuizCompletions(guildId: string, quizId: number): Promise<QuizCompletion[]> {
    const quizCompletions = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/quizzes/${quizId}/completions`);
    return quizCompletions.data;
  }

  async addQuizCompletion(guildId: string, quizId: number, quizCompletion: QuizCompletion): Promise<QuizCompletion> {
    const newQuizCompletionPromise = await axios.post(`${this.apiUrl}/discord/servers/${guildId}/quizzes/${quizId}/completions`, quizCompletion);
    return newQuizCompletionPromise.data;
  }

  async getQuizCompletionForExternalAccount(guildId: string, quizId: number, externalAccountId: string): Promise<QuizCompletion | null> {
    try {
      const newQuizCompletionPromise = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/quizzes/${quizId}/completions/${externalAccountId}`);
      return newQuizCompletionPromise.data;
    } catch (e) {
      return null;
    }
  }

  async deleteQuizCompletionForExternalAccount(guildId: string, quizId: number, externalAccountId: string) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/quizzes/${quizId}/completions/${externalAccountId}`);
  }

  async listQuizzesToBeAnnounced(): Promise<DiscordQuizUpdate[]> {
    const quizzesToBeAnnouncedPromise = await axios.get(`${this.apiUrl}/discord/quizzes/announcements`);
    return quizzesToBeAnnouncedPromise.data;
  }

  async getCurrentQuizRoleAssignments(guildId: string): Promise<DiscordRoleAssignment[]> {
    return (await axios.get(`${this.apiUrl}/discord/servers/${guildId}/roleassignments/quizroles`)).data;
  }
}
