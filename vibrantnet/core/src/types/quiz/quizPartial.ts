import { DiscordRequiredRole } from '../discordRequiredRole';
import { Quiz } from './quiz';

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
