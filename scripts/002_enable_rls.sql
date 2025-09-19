-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Subjects policies (public read, admin write)
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);

-- Question banks policies
CREATE POLICY "Users can view their own question banks" ON public.question_banks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public question banks" ON public.question_banks FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert their own question banks" ON public.question_banks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own question banks" ON public.question_banks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own question banks" ON public.question_banks FOR DELETE USING (auth.uid() = user_id);

-- Questions policies
CREATE POLICY "Users can view questions from accessible question banks" ON public.questions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.question_banks qb 
    WHERE qb.id = question_bank_id 
    AND (qb.user_id = auth.uid() OR qb.is_public = true)
  )
);
CREATE POLICY "Users can insert questions to their own question banks" ON public.questions FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.question_banks qb 
    WHERE qb.id = question_bank_id AND qb.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update questions in their own question banks" ON public.questions FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.question_banks qb 
    WHERE qb.id = question_bank_id AND qb.user_id = auth.uid()
  )
);
CREATE POLICY "Users can delete questions from their own question banks" ON public.questions FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.question_banks qb 
    WHERE qb.id = question_bank_id AND qb.user_id = auth.uid()
  )
);

-- Quiz sessions policies
CREATE POLICY "Users can view their own quiz sessions" ON public.quiz_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quiz sessions" ON public.quiz_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quiz sessions" ON public.quiz_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quiz sessions" ON public.quiz_sessions FOR DELETE USING (auth.uid() = user_id);

-- Quiz answers policies
CREATE POLICY "Users can view their own quiz answers" ON public.quiz_answers FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_sessions qs 
    WHERE qs.id = quiz_session_id AND qs.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert their own quiz answers" ON public.quiz_answers FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quiz_sessions qs 
    WHERE qs.id = quiz_session_id AND qs.user_id = auth.uid()
  )
);

-- Notes policies
CREATE POLICY "Users can view their own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- User progress policies
CREATE POLICY "Users can view their own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- Achievements policies (public read)
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT TO authenticated USING (true);

-- User achievements policies
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
