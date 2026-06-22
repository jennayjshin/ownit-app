export type Category =
  | 'Work & Office'
  | 'Daily Life'
  | 'Idioms & Patterns'
  | 'Social'
  | 'Meetings'
  | 'Emotions & Opinions'
  | 'Email & Phone';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Sentence {
  id: number;
  english_expression: string;
  key_expression: string;
  korean_translation: string;
  category: Category;
  source: string;
  difficulty: Difficulty;
}

export interface User {
  id: string;
  toss_user_id: string;
  email?: string;
  study_reason: string;
  daily_goal: number;
  preferred_categories: Category[];
  preferred_difficulties: Difficulty[];
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  sentence_id: number;
  first_studied_at: string;
  interval_days: number;
  next_review_date: string;
  is_favorite: boolean;
  updated_at: string;
}

export interface UserProgressWithSentence extends UserProgress {
  sentences: Sentence;
}
