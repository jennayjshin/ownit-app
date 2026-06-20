import { supabase } from './supabase';
import type { Category, Sentence, User, UserProgress, UserProgressWithSentence } from '../types/database';

// Sentences
export async function getRandomSentences(userId: string, categories: Category[], limit: number): Promise<Sentence[]> {
  const { data, error } = await supabase.rpc('get_random_sentences', {
    p_user_id: userId,
    p_categories: categories,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as Sentence[];
}

// Users
export async function getUserByTossId(tossUserId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('toss_user_id', tossUserId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
  const { data, error } = await supabase.from('users').insert(user).select().single();
  if (error) throw error;
  return data;
}

export async function upsertUser(user: Omit<User, 'created_at'>): Promise<void> {
  const { error } = await supabase.from('users').upsert(user, { onConflict: 'id' });
  if (error) throw error;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  const { error } = await supabase.from('users').update(updates).eq('id', id);
  if (error) throw error;
}

export async function getAllStudiedSentences(userId: string, limit = 30, offset = 0): Promise<UserProgressWithSentence[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*, sentences(*)')
    .eq('user_id', userId)
    .order('is_favorite', { ascending: false })
    .order('interval_days', { ascending: true })
    .order('next_review_date', { ascending: true })
    .order('sentence_id', { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) return [];
  return (data ?? []) as UserProgressWithSentence[];
}

export async function getRecentlyStudiedSentences(userId: string, limit = 5, offset = 0): Promise<UserProgressWithSentence[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*, sentences(*)')
    .eq('user_id', userId)
    .order('is_favorite', { ascending: false })
    .order('first_studied_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return [];
  return (data ?? []) as UserProgressWithSentence[];
}

export async function getFavoriteSentences(userId: string): Promise<UserProgressWithSentence[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*, sentences(*)')
    .eq('user_id', userId)
    .eq('is_favorite', true)
    .order('updated_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as UserProgressWithSentence[];
}

export async function getTodayStudiedCount(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const { count, error } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('first_studied_at', today + 'T00:00:00.000Z')
    .lte('first_studied_at', today + 'T23:59:59.999Z');
  if (error) return 0;
  return count ?? 0;
}

// User Progress
export async function getTodayReviewSentences(userId: string): Promise<UserProgressWithSentence[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('user_progress')
    .select('*, sentences(*)')
    .eq('user_id', userId)
    .lte('next_review_date', today)
    .order('is_favorite', { ascending: false })
    .order('interval_days', { ascending: true })
    .order('next_review_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as UserProgressWithSentence[];
}

export async function upsertProgress(progress: Omit<UserProgress, 'id' | 'updated_at'>): Promise<void> {
  const { error } = await supabase.from('user_progress').upsert({
    ...progress,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,sentence_id', ignoreDuplicates: true });
  if (error) console.error('upsertProgress error:', error);
}

export async function updateProgressAfterReview(
  userId: string,
  sentenceId: number,
  isEasy: boolean,
  currentInterval: number
): Promise<void> {
  const today = new Date();
  const newInterval = isEasy ? Math.floor(currentInterval * 2.5) || 1 : 1;
  const nextReview = new Date(today);
  nextReview.setDate(today.getDate() + newInterval);

  const { error } = await supabase
    .from('user_progress')
    .update({
      interval_days: newInterval,
      next_review_date: nextReview.toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('sentence_id', sentenceId);
  if (error) throw error;
}

export async function toggleFavorite(userId: string, sentenceId: number, isFavorite: boolean): Promise<void> {
  const { error } = await supabase
    .from('user_progress')
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('sentence_id', sentenceId);
  if (error) throw error;
}
