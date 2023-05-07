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
};
