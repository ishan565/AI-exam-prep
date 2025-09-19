-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;

  -- Initialize user progress for all subjects
  INSERT INTO public.user_progress (user_id, subject_id)
  SELECT NEW.id, s.id
  FROM public.subjects s
  ON CONFLICT (user_id, subject_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update user progress after quiz completion
CREATE OR REPLACE FUNCTION public.update_user_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quiz_subject_id UUID;
  correct_count INTEGER;
  total_count INTEGER;
  time_spent_minutes INTEGER;
  experience_gained INTEGER;
BEGIN
  -- Get subject_id from question bank
  SELECT qb.subject_id INTO quiz_subject_id
  FROM public.question_banks qb
  WHERE qb.id = NEW.question_bank_id;

  -- Get quiz statistics
  SELECT 
    COUNT(*) FILTER (WHERE qa.is_correct = true),
    COUNT(*),
    COALESCE(NEW.time_spent / 60, 0)
  INTO correct_count, total_count, time_spent_minutes
  FROM public.quiz_answers qa
  WHERE qa.quiz_session_id = NEW.id;

  -- Calculate experience points (base 10 per correct answer, bonus for difficulty)
  experience_gained := correct_count * 10;
  IF NEW.difficulty_mode = 'hard' THEN
    experience_gained := experience_gained * 2;
  ELSIF NEW.difficulty_mode = 'medium' THEN
    experience_gained := ROUND(experience_gained * 1.5);
  END IF;

  -- Update user progress
  INSERT INTO public.user_progress (
    user_id, 
    subject_id, 
    total_questions_answered, 
    correct_answers, 
    total_study_time, 
    experience_points,
    last_activity
  )
  VALUES (
    NEW.user_id, 
    quiz_subject_id, 
    total_count, 
    correct_count, 
    time_spent_minutes, 
    experience_gained,
    NOW()
  )
  ON CONFLICT (user_id, subject_id)
  DO UPDATE SET
    total_questions_answered = user_progress.total_questions_answered + total_count,
    correct_answers = user_progress.correct_answers + correct_count,
    total_study_time = user_progress.total_study_time + time_spent_minutes,
    experience_points = user_progress.experience_points + experience_gained,
    level = LEAST(100, GREATEST(1, (user_progress.experience_points + experience_gained) / 100 + 1)),
    last_activity = NOW(),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Create trigger for quiz completion
DROP TRIGGER IF EXISTS on_quiz_completed ON public.quiz_sessions;
CREATE TRIGGER on_quiz_completed
  AFTER UPDATE OF status ON public.quiz_sessions
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.update_user_progress();

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_achievements(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  achievement_record RECORD;
  user_stats RECORD;
BEGIN
  -- Get user statistics
  SELECT 
    COALESCE(SUM(up.total_questions_answered), 0) as total_questions,
    COALESCE(SUM(up.correct_answers), 0) as correct_answers,
    COALESCE(MAX(up.current_streak), 0) as current_streak,
    COALESCE(MAX(up.longest_streak), 0) as longest_streak,
    COALESCE(SUM(up.total_study_time), 0) as total_study_time,
    COALESCE(MAX(up.level), 1) as max_level,
    COALESCE(SUM(up.experience_points), 0) as total_experience
  INTO user_stats
  FROM public.user_progress up
  WHERE up.user_id = user_id_param;

  -- Check each achievement
  FOR achievement_record IN 
    SELECT a.* FROM public.achievements a
    WHERE a.id NOT IN (
      SELECT ua.achievement_id 
      FROM public.user_achievements ua 
      WHERE ua.user_id = user_id_param
    )
  LOOP
    CASE achievement_record.requirement_type
      WHEN 'questions' THEN
        IF user_stats.correct_answers >= achievement_record.requirement_value THEN
          INSERT INTO public.user_achievements (user_id, achievement_id)
          VALUES (user_id_param, achievement_record.id);
        END IF;
      WHEN 'streak' THEN
        IF user_stats.longest_streak >= achievement_record.requirement_value THEN
          INSERT INTO public.user_achievements (user_id, achievement_id)
          VALUES (user_id_param, achievement_record.id);
        END IF;
      WHEN 'time' THEN
        IF user_stats.total_study_time * 60 >= achievement_record.requirement_value THEN
          INSERT INTO public.user_achievements (user_id, achievement_id)
          VALUES (user_id_param, achievement_record.id);
        END IF;
      WHEN 'level' THEN
        IF user_stats.max_level >= achievement_record.requirement_value THEN
          INSERT INTO public.user_achievements (user_id, achievement_id)
          VALUES (user_id_param, achievement_record.id);
        END IF;
    END CASE;
  END LOOP;
END;
$$;
