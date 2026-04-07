export type Profile = {
  id: string;
  full_name: string | null;
  created_at: string;
};

export type ParentSettings = {
  parent_id: string;
  parent_pin: string;
  created_at: string;
  updated_at: string;
};

export type Child = {
  id: string;
  parent_id: string;
  name: string;
  age: number | null;
  avatar: string;
  weekly_goal_pages: number;
  bonus_minutes: number;
  created_at: string;
};

export type Book = {
  id: string;
  child_id: string;
  title: string;
  author: string | null;
  category: string | null;
  total_pages: number;
  current_page: number;
  status: 'nao_iniciado' | 'em_andamento' | 'concluido';
  created_at: string;
};

export type MinuteTransaction = {
  id: string;
  child_id: string;
  kind: 'reading' | 'usage' | 'bonus' | 'adjustment';
  minutes_delta: number;
  note: string | null;
  created_at: string;
};

export type ReadingLog = {
  id: string;
  child_id: string;
  book_id: string;
  previous_page: number;
  current_page: number;
  pages_read: number;
  minutes_earned: number;
  created_at: string;
};
