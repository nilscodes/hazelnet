import i18n from 'i18n';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMember, MessageActionRowComponentBuilder } from "discord.js"
import giveaway from "./giveaway"
import { DiscordRequiredRole } from "./polltypes"
import { DiscordServer } from "./sharedtypes"
import HazelnetClient from './hazelnetclient';
import discordquiz from '../services/discord/quiz';

export type Quiz = {
  name: string
  displayName: string,
  id: number
  description: string,
  requiredRoles: DiscordRequiredRole[]
  createTime?: string
  openAfter?: string
  openUntil?: string
  channelId?: string
  messageId?: string
  creator: number
  winnerCount: number
  archived: boolean
  logoUrl?: string
  awardedRole?: string
  attemptsPerQuestion: number
  correctAnswersRequired: number
}

export interface QuizPartial extends Omit<Quiz, 'description' | 'id' | 'createTime' | 'archived' | 'name' | 'winnerCount' | 'displayName' | 'creator' | 'requiredRoles' | 'attemptsPerQuestion' | 'correctAnswersRequired'> {
  name?: string
  displayName?: string,
  description?: string
  requiredRoles?: DiscordRequiredRole[]
  winnerCount?: number
  archived?: boolean
  attemptsPerQuestion?: number
  correctAnswersRequired?: number
}

export type QuizQuestion = {
  id: number
  text: string
  order: number
  answer0: string
  answer1: string
  answer2?: string
  answer3?: string
  correctAnswer: number
  correctAnswerDetails?: string
  shuffleAnswers: boolean
}

export type QuizCompletion = {
  externalAccountId: string
  time: string
  correctAnswers: number
  qualifies: boolean
  address?: string
}

export type DiscordQuizUpdate = {
  guildId: string
  quizId: number
  channelId: string
  messageId: string
}

export type QuizParticipation = {
  answers: QuizAnswer[]
}

export type QuizAnswer = {
  questionId: number
  correct: boolean
  attempts: number
  wrongAnswers: number[]
}

export default {
  fisherYatesShuffle(toShuffle: any[]) {
    for (let i = (toShuffle.length - 1); i > 0; i -= 1) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [toShuffle[i], toShuffle[randomIndex]] = [toShuffle[randomIndex], toShuffle[i]];
    }
    return toShuffle;
  },
  isValidName(quizName: string) {
    const quizNameRegex = /^[A-Za-z][-A-Za-z0-9]{0,29}$/;
    return quizNameRegex.test(quizName);
  },
  hasQuizEnded(quiz: Quiz) {
    if (quiz.openUntil) {
      return new Date(quiz.openUntil) < new Date();
    }
    return false;
  },
  hasQuizStarted(quiz: Quiz) {
    if (quiz.openAfter) {
      return new Date(quiz.openAfter) < new Date();
    }
    return true;
  },
  isQuizArchived(quiz: Quiz) {
    return !!quiz.archived;
  },
  userCanSeeQuiz(member: GuildMember, quiz: Quiz) {
    if (!this.isQuizArchived(quiz)) {
      if (quiz.requiredRoles?.length) {
        const needsAnyOfRoleIds = quiz.requiredRoles.map((role) => role.roleId);
        return needsAnyOfRoleIds.length === 0 || member.roles.cache.some((role) => needsAnyOfRoleIds.includes(role.id));
      }
      return true;
    }
    return false;
  },
  userCanParticipateInQuiz(member: GuildMember, quiz: Quiz) {
    if (!this.isQuizArchived(quiz) && !this.hasQuizEnded(quiz) && this.hasQuizStarted(quiz)) {
      const needsAnyOfRoleIds = quiz.requiredRoles.map((role) => role.roleId);
      return needsAnyOfRoleIds.length === 0 || member.roles.cache.some((role) => needsAnyOfRoleIds.includes(role.id));
    }
    return false;
  },
  getQuizDescriptionField(quiz: Quiz, locale: string) {
    return {
      name: i18n.__({ phrase: 'configure.quiz.list.detailsDescription', locale }),
      value: quiz.description.trim().length ? quiz.description.trim() : i18n.__({ phrase: 'configure.quiz.list.detailsDescriptionEmpty', locale }),
    };
  },
  getQuizAnnouncementParts(discordServer: DiscordServer, quiz: Quiz) {
    const locale = discordServer.getBotLanguage();
    const detailFields = [this.getQuizDescriptionField(quiz, locale)];

    const openTime = giveaway.getTimePhrase(quiz.openAfter, 'configure.quiz.list.quizInfoOpen', locale);
    const closeTime = giveaway.getTimePhrase(quiz.openUntil, 'configure.quiz.list.quizInfoClose', locale);
    if (openTime !== '' || closeTime !== '') {
      detailFields.push({
        name: i18n.__({ phrase: 'configure.quiz.list.detailsDates', locale }),
        value: openTime + closeTime
      });
    }

    const components = [];
    if (!this.hasQuizEnded(quiz)) {
      const buttons = [new ButtonBuilder()
        .setCustomId(`join/widgetjoin/quiz/${quiz.id}`)
        .setLabel(i18n.__({ phrase: 'join.joinQuizButton', locale }))
        .setStyle(ButtonStyle.Primary)
      ];

      if (true /* TODO make this dependent on a setting in the quiz if addresses are collected */) {
        buttons.push(new ButtonBuilder()
          .setCustomId('verify/add/widgetverify')
          .setLabel(i18n.__({ phrase: 'verify.add.verifyButton', locale }))
          .setStyle(ButtonStyle.Secondary));
      }
      components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(buttons));
    }
    return { detailFields, components };
  },
  async getOrderedQuestions(client: HazelnetClient, guildId: string, quizId: number) {
    return (await client.services.discordquiz.listQuizQuestions(guildId, quizId))
        .sort((questionA, questionB) => questionA.order - questionB.order);
  },
  async saveQuizCompletion(service: typeof discordquiz, guildId: string, quizId: number, correct: number, qualifies: boolean, externalAccountId: string, address?: string) {
    service.addQuizCompletion(guildId, quizId, {
      correctAnswers: correct,
      externalAccountId,
      qualifies,
      time: '',
      address,
    });
  },
  async getQuizById(service: typeof discordquiz, guildId: string, quizId: number): Promise<Quiz | undefined> {
    const quizzes = await discordquiz.getQuizzes(guildId);
    const quiz = quizzes.find((quizForDetails) => quizForDetails.id === quizId);
    return quiz;
  }
}