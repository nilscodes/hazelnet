import NodeCache from 'node-cache';
import {
  ActionRowBuilder, APIEmbedField, ButtonBuilder, GuildMember, MessageActionRowComponentBuilder, SlashCommandBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder,
} from 'discord.js';
import i18n from 'i18n';
import {
  DiscordServer, Giveaway, ParticipationData, Quiz, QuizAnswer, QuizParticipation, QuizQuestion, TokenMetadata, cardanoaddress,
} from '@vibrantnet/core';
import { AugmentedButtonInteraction } from '../utility/hazelnetclient';
import { BotCommand } from '../utility/commandtypes';
import giveawayutil from '../utility/giveaway';
import quizutil from '../utility/quiz';
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';
import embedBuilder from '../utility/embedbuilder';
import discordstring from '../utility/discordstring';
import wallet from '../utility/wallet';

type FieldsAndComponents = {
  detailFields: APIEmbedField[]
  components: ActionRowBuilder<MessageActionRowComponentBuilder>[]
};

type QuestionEmbedParts = {
  questionEmbed: EmbedBuilder
  questionComponents: ActionRowBuilder<MessageActionRowComponentBuilder>[]
};

type QuizFinalizeContent = {
  titlePhrase: string
  mainText: string
};

interface JoinCommand extends BotCommand {
  cache: NodeCache
  getGiveawayDetails(giveaway: Giveaway, interaction: AugmentedButtonInteraction, discordServer: any, member: GuildMember, participationOfUser: ParticipationData): Promise<FieldsAndComponents>
  getUserParticipationText(discordServer: DiscordServer, giveaway: Giveaway, totalVotingPower: number, tokenMetadata: TokenMetadata | null): string
  startQuiz(interaction: AugmentedButtonInteraction, discordServer: DiscordServer, quiz: Quiz): void
  getQuizParticipation(userId: string, quizId: number): QuizParticipation
  getQuestionEmbed(discordServer: DiscordServer, quiz: Quiz, question: QuizQuestion, questionNumber: number, wrongAnswersGiven: number[], infoPhrase: string, followUpTitle?: string, answerDetails?: string): QuestionEmbedParts
  answerQuizQuestion(interaction: AugmentedButtonInteraction, discordServer: DiscordServer, quiz: Quiz, questionId: number, answerIndex: number): Promise<void>
  finalizeQuiz(interaction: AugmentedButtonInteraction, discordServer: DiscordServer, quiz: Quiz, allAnsweredQuestions: QuizAnswer[], questions: QuizQuestion[], lastAnsweredQuestion?: QuizQuestion): Promise<void>
  determineMainContentBasedOnLastAnsweredQuestion(locale: string, allAnsweredQuestions: QuizAnswer[], lastAnsweredQuestion?: QuizQuestion): QuizFinalizeContent
}

const QUIZ_CACHE_DURATION = 900;

export default <JoinCommand> {
  cache: new NodeCache({ stdTTL: QUIZ_CACHE_DURATION }),
  getCommandData(locale) {
    const ci18n = new CommandTranslations('join', locale);
    const builder = new SlashCommandBuilder();
    builder.setName('join')
      .setDescription(ci18n.description());
    return builder;
  },
  commandTags: ['join'],
  augmentPermissions: commandbase.augmentPermissionsUser,
  async execute(_) {
    // empty since command currently cannot be called directly and only contains widget logic
  },
  async executeButton(interaction) {
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
    const locale = discordServer.getBotLanguage();
    const joinInfo = interaction.customId.split('/');
    const oldJoinInfo = joinInfo.length === 3; // TODO can be removed once all existing giveaways have ended (end of March 2023)
    if (oldJoinInfo || joinInfo[2] === 'giveaway') {
      const giveawayId = +(joinInfo[oldJoinInfo ? 2 : 3]);
      const giveaways = await interaction.client.services.discordserver.getGiveaways(interaction.guild!.id);
      const giveaway = giveaways.find((giveawayForDetails) => giveawayForDetails.id === giveawayId);
      if (giveaway) {
        const member = await interaction.guild!.members.fetch(interaction.user.id);
        if (giveawayutil.userCanSeeGiveaway(member, giveaway)) {
          const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
          if (interaction.customId.indexOf('join/widgetjoin') === 0) {
            const participationOfUser = await interaction.client.services.discordserver.getParticipationOfUser(interaction.guild!.id, giveaway.id, externalAccount.id);
            let phrase = 'join.giveawayInfoTitle';
            if (participationOfUser.participants === 0 && participationOfUser.totalEntries > 0) {
              await interaction.client.services.discordserver.participateAsUser(interaction.guild!.id, giveaway.id, externalAccount.id);
              participationOfUser.participants = 1;
              phrase = 'join.success';
            }
            const { detailFields, components } = await this.getGiveawayDetails(giveaway, interaction, discordServer, member, participationOfUser);
            const embed = embedBuilder.buildForUser(discordServer, giveaway.displayName, i18n.__({ phrase, locale }), 'join', detailFields);
            await interaction.reply({ embeds: [embed], components, ephemeral: true });
          } else if (interaction.customId.indexOf('join/removeentry') === 0) {
            await interaction.client.services.discordserver.removeParticipationAsUser(interaction.guild!.id, giveaway.id, externalAccount.id);
            const participationOfUser = await interaction.client.services.discordserver.getParticipationOfUser(interaction.guild!.id, giveaway.id, externalAccount.id);
            const { detailFields, components } = await this.getGiveawayDetails(giveaway, interaction, discordServer, member, participationOfUser);
            const embed = embedBuilder.buildForUser(discordServer, giveaway.displayName, i18n.__({ phrase: 'join.successRemoval', locale }), 'join', detailFields);
            await interaction.update({ embeds: [embed], components });
          } else if (interaction.customId.indexOf('join/addentry') === 0) {
            await interaction.client.services.discordserver.participateAsUser(interaction.guild!.id, giveaway.id, externalAccount.id);
            const participationOfUser = await interaction.client.services.discordserver.getParticipationOfUser(interaction.guild!.id, giveaway.id, externalAccount.id);
            const { detailFields, components } = await this.getGiveawayDetails(giveaway, interaction, discordServer, member, participationOfUser);
            const embed = embedBuilder.buildForUser(discordServer, giveaway.displayName, i18n.__({ phrase: 'join.success', locale }), 'join', detailFields);
            await interaction.update({ embeds: [embed], components });
          }
        } else {
          const embed = embedBuilder.buildForUser(discordServer, giveaway.displayName, i18n.__({ phrase: 'join.errorNotEligible', locale }), 'join');
          await interaction.reply({ embeds: [embed], ephemeral: true });
        }
      }
    } else if (joinInfo[2] === 'quiz') {
      const quizId = +(joinInfo[3]);
      const quiz = await quizutil.getQuizById(interaction.client.services.discordquiz, interaction.guild!.id, quizId);
      if (quiz) {
        const member = await interaction.guild!.members.fetch(interaction.user.id);
        if (joinInfo[1] === 'widgetjoin') {
          if (quizutil.userCanParticipateInQuiz(member, quiz)) {
            await this.startQuiz(interaction, discordServer, quiz);
          } else {
            const embed = embedBuilder.buildForUser(discordServer, quiz.displayName, i18n.__({ phrase: 'join.errorNotEligible', locale }), 'join');
            await interaction.reply({ embeds: [embed], ephemeral: true });
          }
        } else if (joinInfo[1] === 'start') {
          const questions = await quizutil.getOrderedQuestions(interaction.client, discordServer.guildId, quiz.id);
          const userParticipation = this.getQuizParticipation(member.user.id, quiz.id);
          const answeredQuestions = userParticipation.answers.map(answer => answer.questionId);
          const firstUnansweredQuestion = questions.find(question => !answeredQuestions.includes(question.id));
          if (firstUnansweredQuestion) {
            const { questionEmbed, questionComponents } = this.getQuestionEmbed(discordServer, quiz, firstUnansweredQuestion, answeredQuestions.length + 1, [], 'join.firstQuestion');
            await interaction.update({ embeds: [questionEmbed], components: questionComponents });
          } else {
            await this.finalizeQuiz(interaction, discordServer, quiz, userParticipation.answers, questions);
          }
        } else if (joinInfo[1] === 'answer') {
          const questionId = +(joinInfo[4]);
          const answerIndex = +(joinInfo[5]);
          await this.answerQuizQuestion(interaction, discordServer, quiz, questionId, answerIndex);
        }
      }
    }
  },
  async executeSelectMenu(interaction) {
    await interaction.deferUpdate();
    if (interaction.customId.startsWith('join/completequiz/')) {
      const quizId = +(interaction.customId.split('/')[2]);
      const quiz = await quizutil.getQuizById(interaction.client.services.discordquiz, interaction.guild!.id, quizId);
      if (quiz) {
        const correct = this.cache.get(`${interaction.user.id}-${quiz.id}`) as number;
        if (correct !== undefined) {
          const [_, verificationId] = interaction.values[0].split('-');
          const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
          const existingVerifications = await interaction.client.services.externalaccounts.getActiveVerificationsForExternalAccount(externalAccount.id);
          const verificationToUse = existingVerifications.find((verification) => verification.confirmed && !verification.obsolete && verification.id === +verificationId);
          if (verificationToUse) {
            const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
            const locale = discordServer.getBotLanguage();
            quizutil.saveQuizCompletion(interaction.client.services.discordquiz, discordServer.guildId, quiz.id, correct, true, externalAccount.id, verificationToUse.address);
            this.cache.del(`${interaction.user.id}-quiz-${quiz.id}-answers`);
            const finishEmbed = embedBuilder.buildForUser(discordServer, quiz.displayName, i18n.__({ phrase: 'join.quizAddressSubmitted', locale }, { quiz, address: cardanoaddress.shorten(verificationToUse.address) } as any), 'join');
            await interaction.editReply({ embeds: [finishEmbed], components: [] });
          }
        } else {
          // Took to long message
        }
      }
    }
  },
  async getGiveawayDetails(giveaway, interaction, discordServer, member, participationOfUser) {
    const locale = discordServer.getBotLanguage();
    const tokenMetadata = await giveawayutil.getTokenMetadataFromRegistry(interaction.guild!.id, giveaway, interaction.client);
    const participation = await interaction.client.services.discordserver.getParticipationForGiveaway(interaction.guild!.id, giveaway.id);
    const detailFields = [
      {
        name: i18n.__({ phrase: 'configure.giveaway.list.detailsDescription', locale }),
        value: giveaway.description.trim().length ? giveaway.description.trim() : i18n.__({ phrase: 'configure.giveaway.list.detailsDescriptionEmpty', locale }),
      },
    ];

    giveawayutil.augmentGiveawayDates(giveaway, detailFields, locale);
    giveawayutil.augmentGiveawayOptions(giveaway, detailFields, locale);
    giveawayutil.augmentGiveawayGroup(giveaway, detailFields, locale);
    giveawayutil.augmentRequiredRoles(giveaway, detailFields, locale);
    giveawayutil.augmentCurrentParticipation(giveaway, detailFields, discordServer, participation, tokenMetadata);

    const totalEntriesForUser = participationOfUser.totalEntries;
    detailFields.push({
      name: i18n.__({ phrase: 'join.yourEntryWeight', locale }),
      value: this.getUserParticipationText(discordServer, giveaway, totalEntriesForUser, tokenMetadata),
    });
    const components = [];
    if (giveawayutil.userCanParticipateInGiveaway(member, giveaway, totalEntriesForUser)) {
      const hasEntered = participationOfUser.participants > 0;
      if (hasEntered) {
        const decimals = (giveaway.weighted && tokenMetadata?.decimals?.value) || 0;
        const formattedTotalEntriesForUser = discordServer.formatNumber(giveawayutil.calculateParticipationCountNumber(totalEntriesForUser, decimals));
        detailFields.push({
          name: i18n.__({ phrase: 'join.yourEntry', locale }),
          value: i18n.__({ phrase: 'join.yourEntryDetails', locale }, { entries: formattedTotalEntriesForUser }),
        });
        components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`join/removeentry/${giveaway.id}`)
            .setLabel(i18n.__({ phrase: 'join.removeEntry', locale }))
            .setStyle(ButtonStyle.Danger),
        ));
      } else {
        detailFields.push({
          name: i18n.__({ phrase: 'join.yourEntry', locale }),
          value: i18n.__({ phrase: 'join.yourEntryMissing', locale }),
        });
        components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`join/addentry/${giveaway.id}`)
            .setLabel(i18n.__({ phrase: 'join.addEntry', locale }))
            .setStyle(ButtonStyle.Primary),
        ));
      }
    }
    return { detailFields, components };
  },
  getUserParticipationText(discordServer, giveaway, totalEntries, tokenMetadata) {
    const locale = discordServer.getBotLanguage();
    if (giveaway.snapshotIds.length) {
      const decimals = (giveaway.weighted && tokenMetadata?.decimals?.value) || 0;
      const unit = giveaway.weighted && tokenMetadata?.ticker?.value ? ` ${tokenMetadata.ticker.value}` : '';
      if (totalEntries > 0) {
        const formattedTotalEntries = discordServer.formatNumber(giveawayutil.calculateParticipationCountNumber(totalEntries, decimals));
        return `${totalEntries > 1 ? i18n.__({ phrase: 'join.totalEntriesMultiple', locale }, { totalEntries: formattedTotalEntries, unit }) : i18n.__({ phrase: 'join.totalEntriesSingleToken', locale })}\n\n${i18n.__({ phrase: 'join.totalEntriesTokenInfo', locale })}`;
      }
      return `${i18n.__({ phrase: 'join.totalEntriesNone', locale })}\n\n${i18n.__({ phrase: 'join.totalEntriesTokenInfo', locale })}`;
    }
    return i18n.__({ phrase: 'join.totalEntriesSingleNoToken', locale });
  },
  async startQuiz(interaction, discordServer, quiz) {
    const locale = discordServer.getBotLanguage();
    const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
    const existingVerifications = await interaction.client.services.externalaccounts.getActiveVerificationsForExternalAccount(externalAccount.id);
    const existingConfirmedVerifications = existingVerifications.filter((verification) => verification.confirmed && !verification.obsolete);
    if (existingConfirmedVerifications.length) {
      const completionForUser = await interaction.client.services.discordquiz.getQuizCompletionForExternalAccount(discordServer.guildId, quiz.id, externalAccount.id)
      const questions = await quizutil.getOrderedQuestions(interaction.client, discordServer.guildId, quiz.id);
      const outcomes = [];
      if (quiz.awardedRole) {
        outcomes.push(i18n.__({ phrase: 'join.quizAwardedRole', locale }, { quiz } as any));
      }
      outcomes.push(i18n.__({ phrase: 'join.quizAddressWhitelist', locale }, { quiz } as any));
      const quizFields = [
        quizutil.getQuizDescriptionField(quiz, locale),
        {
          name: i18n.__({ phrase: 'join.quizOutcomes', locale }),
          value: outcomes.join('\n'),
        }
      ];

      if (completionForUser) {
        const completionTime = Math.floor(new Date(completionForUser.time).getTime() / 1000);
        const completionPhrase = completionForUser.qualifies ? 'join.alreadyCompleted' : 'join.alreadyCompletedNotQualified';
        const address = completionForUser.address ? cardanoaddress.shorten(completionForUser.address) : '';
        const embed = embedBuilder.buildForUser(discordServer, quiz.displayName, i18n.__({ phrase: completionPhrase, locale }, { quiz, address, completionTime } as any), 'join');
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        const minimumCorrect = quiz.correctAnswersRequired > 0 ? Math.min(quiz.correctAnswersRequired, questions.length) : questions.length;
        const attemptsText = i18n.__({ phrase: (quiz.attemptsPerQuestion > 0 ? 'join.startQuizAttemptCount' : 'join.startQuizUnlimitedAttempts'), locale }, { attemptsPerQuestion: `${quiz.attemptsPerQuestion}` });
        const embed = embedBuilder.buildForUser(discordServer, quiz.displayName, i18n.__({ phrase: 'join.startQuizText', locale }, { quiz, questionCount: questions.length, minimumCorrect, attemptsText, cacheDuration: QUIZ_CACHE_DURATION / 60 } as any), 'join', quizFields);
        const components = [
          new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents([
            new ButtonBuilder()
              .setCustomId(`join/start/quiz/${quiz.id}`)
              .setLabel(i18n.__({ phrase: 'join.quizStartButton', locale }))
              .setStyle(ButtonStyle.Primary)
          ]),
        ];
        await interaction.reply({ embeds: [embed], components, ephemeral: true });
      }
      
    } else {
      const embed = embedBuilder.buildForUser(discordServer, quiz.displayName, i18n.__({ phrase: 'join.quizNoVerifiedAddresses', locale }), 'join');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
  getQuizParticipation(userId, quizId) {
    const quizParticipation = this.cache.get(`${userId}-quiz-${quizId}-answers`) as QuizParticipation
    if (!quizParticipation) {
      const newParticipation = { answers: [] };
      this.cache.set(`${userId}-quiz-${quizId}-answers`, newParticipation);
      return newParticipation;
    }
    return quizParticipation;
  },
  getQuestionEmbed(discordServer, quiz, question, questionNumber, wrongAnswersGiven, questionTitle, followUpTitle = '', answerDetails = '') {
    const locale = discordServer.getBotLanguage();
    const mainText = answerDetails === '' ? question.text : answerDetails;
    const questionFields = [];
    if (answerDetails)
    {
      questionFields.push({
        name: i18n.__({ phrase: followUpTitle, locale }, { questionNumber: `${questionNumber}` }),
        value: question.text,
      });
    }
    const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: questionTitle, locale }, { questionNumber: `${questionNumber}` }), mainText, 'join', questionFields);
    const components = [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents([
        new ButtonBuilder()
          .setCustomId(`join/answer/quiz/${quiz.id}/${question.id}/0`)
          .setLabel(discordstring.ensureLength(question.answer0, 100))
          .setStyle(wrongAnswersGiven.includes(0) ? ButtonStyle.Danger : ButtonStyle.Primary)
      ]),
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents([
        new ButtonBuilder()
          .setCustomId(`join/answer/quiz/${quiz.id}/${question.id}/1`)
          .setLabel(discordstring.ensureLength(question.answer1, 100))
          .setStyle(wrongAnswersGiven.includes(1) ? ButtonStyle.Danger : ButtonStyle.Primary)
      ])
    ];
    if (question.answer2) {
      components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents([
        new ButtonBuilder()
          .setCustomId(`join/answer/quiz/${quiz.id}/${question.id}/2`)
          .setLabel(discordstring.ensureLength(question.answer2, 100))
          .setStyle(wrongAnswersGiven.includes(2) ? ButtonStyle.Danger : ButtonStyle.Primary)
      ]));
    }
    if (question.answer3) {
      components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents([
        new ButtonBuilder()
          .setCustomId(`join/answer/quiz/${quiz.id}/${question.id}/3`)
          .setLabel(discordstring.ensureLength(question.answer3, 100))
          .setStyle(wrongAnswersGiven.includes(3) ? ButtonStyle.Danger : ButtonStyle.Primary)
      ]));
    }

    if (question.shuffleAnswers) {
      quizutil.fisherYatesShuffle(components);
    }
    return {
      questionEmbed: embed,
      questionComponents: components,
    };
  },
  async answerQuizQuestion(interaction, discordServer, quiz, questionId, answerIndex) {
    const userParticipation = this.getQuizParticipation(interaction.user.id, quiz.id);
    const questionAnswerData = userParticipation.answers.find(answer => answer.questionId === questionId) ?? {
      questionId,
      correct: false,
      attempts: 0,
      wrongAnswers: [],
    };
    const questions = await quizutil.getOrderedQuestions(interaction.client, discordServer.guildId, quiz.id);
    const answeredQuestion = questions.find((question) => question.id === questionId)!;
    const allAnsweredQuestions = userParticipation.answers.filter(answer => answer.questionId !== questionId);
    questionAnswerData.correct = answerIndex === answeredQuestion.correctAnswer;
    questionAnswerData.attempts++;
    if (!questionAnswerData.correct) {
      questionAnswerData.wrongAnswers.push(answerIndex);
    }
    allAnsweredQuestions.push(questionAnswerData);
    this.cache.set(`${interaction.user.id}-quiz-${quiz.id}-answers`, { answers: allAnsweredQuestions });
    if (questionAnswerData.correct || (quiz.attemptsPerQuestion > 0 && questionAnswerData.attempts >= quiz.attemptsPerQuestion)) {
      if (allAnsweredQuestions.length === questions.length) {
        await this.finalizeQuiz(interaction, discordServer, quiz, allAnsweredQuestions, questions, answeredQuestion);
      } else {
        const answeredQuestions = allAnsweredQuestions.map(answer => answer.questionId);
        const firstUnansweredQuestion = questions.find(question => !answeredQuestions.includes(question.id))!;
        const answerPhrase = questionAnswerData.correct ? 'join.correctAnswer' : 'join.attemptsReached';
        const answerDetails = answeredQuestion.correctAnswerDetails ?? '';
        const { questionEmbed, questionComponents } = this.getQuestionEmbed(discordServer, quiz, firstUnansweredQuestion, answeredQuestions.length + 1, [], answerPhrase, `${answerPhrase}NextQuestionTitle`, answerDetails);
        await interaction.update({ embeds: [questionEmbed], components: questionComponents });
      }
    } else {
      const retryQuestion = questions.find(question => question.id === questionId)!;
      const { questionEmbed, questionComponents } = this.getQuestionEmbed(discordServer, quiz, retryQuestion, allAnsweredQuestions.length, questionAnswerData.wrongAnswers, 'join.retryQuestion');
      await interaction.update({ embeds: [questionEmbed], components: questionComponents });
    }
  },
  async finalizeQuiz(interaction, discordServer, quiz, allAnsweredQuestions, questions, lastAnsweredQuestion) {
    const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
    const correct = allAnsweredQuestions.filter((answer) => answer.correct).length;
    const minimumCorrect = quiz.correctAnswersRequired > 0 ? quiz.correctAnswersRequired : questions.length;
    const locale = discordServer.getBotLanguage();
    const { titlePhrase, mainText } = this.determineMainContentBasedOnLastAnsweredQuestion(locale, allAnsweredQuestions, lastAnsweredQuestion);
    if (correct >= minimumCorrect) {
      const existingVerifications = await interaction.client.services.externalaccounts.getActiveVerificationsForExternalAccount(externalAccount.id);
      const existingConfirmedVerifications = existingVerifications.filter((verification) => verification.confirmed && !verification.obsolete);
      if (existingConfirmedVerifications.length) {
        const registerOptions = await wallet.getWalletRegisterOptions(interaction.client.services.cardanoinfo, existingConfirmedVerifications, `${externalAccount.id}`);

        const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`join/completequiz/${quiz.id}`)
              .setPlaceholder(i18n.__({ phrase: 'join.chooseAddressForQuizPrize', locale }))
              .addOptions(registerOptions)
          )];
        this.cache.set(`${interaction.user.id}-${quiz.id}`, correct);
        const completionPhrase = quiz.awardedRole ? 'join.quizCompleteWithRole' : 'join.quizCompleteWithoutRole';
        const finishEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: titlePhrase, locale }), mainText, 'join', [{
          name: quiz.displayName,
          value: i18n.__({ phrase: completionPhrase, locale }, { quiz, correct, total: questions.length } as any),
        }]);
        await interaction.update({ embeds: [finishEmbed], components });
      } else {
        // Should not get here if verification was present before
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: titlePhrase, locale }), mainText, 'join', [{
          name: quiz.displayName,
          value: i18n.__({ phrase: 'join.quizNoVerifiedAddresses', locale }),
        }]);
        await interaction.update({ embeds: [embed], components: [] });
      }
    } else {
      quizutil.saveQuizCompletion(interaction.client.services.discordquiz, discordServer.guildId, quiz.id, correct, false, externalAccount.id);
      this.cache.del(`${interaction.user.id}-quiz-${quiz.id}-answers`);
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: titlePhrase, locale }), mainText, 'join', [{
        name: quiz.displayName,
        value: i18n.__({ phrase: 'join.quizNotEnoughCorrectAnswers', locale }, { correct, total: questions.length, minimumCorrect } as any)
      }]);
      await interaction.update({ embeds: [embed], components: [] });
    }
  },
  determineMainContentBasedOnLastAnsweredQuestion(locale, allAnsweredQuestions, lastAnsweredQuestion) {
    let titlePhrase = 'join.quizComplete';
    let mainText = i18n.__({ phrase: 'join.genericCompletionText', locale });
    if (lastAnsweredQuestion) {
      const answeredQuestion = allAnsweredQuestions.find((question) => question.questionId === lastAnsweredQuestion.id);
      if (answeredQuestion) {
        if (answeredQuestion.correct) {
          titlePhrase = 'join.correctAnswer';
        } else {
          titlePhrase = 'join.attemptsReached';
        }
        if (lastAnsweredQuestion.correctAnswerDetails) {
          mainText = lastAnsweredQuestion.correctAnswerDetails;
        }
      }
    }
    return { titlePhrase, mainText };
  }
};
