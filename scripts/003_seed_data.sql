-- Insert default subjects
INSERT INTO public.subjects (name, description, color) VALUES
('Mathematics', 'Algebra, Calculus, Geometry, Statistics', '#3B82F6'),
('Science', 'Physics, Chemistry, Biology', '#10B981'),
('Computer Science', 'Programming, Algorithms, Data Structures', '#8B5CF6'),
('History', 'World History, Ancient Civilizations', '#F59E0B'),
('Literature', 'English Literature, Poetry, Writing', '#EF4444'),
('Languages', 'Foreign Languages, Grammar, Vocabulary', '#06B6D4')
ON CONFLICT DO NOTHING;

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, badge_color, requirement_type, requirement_value) VALUES
('First Steps', 'Complete your first quiz', '🎯', '#10B981', 'questions', 1),
('Quick Learner', 'Answer 10 questions correctly', '⚡', '#3B82F6', 'questions', 10),
('Streak Master', 'Maintain a 5-day study streak', '🔥', '#F59E0B', 'streak', 5),
('Century Club', 'Answer 100 questions correctly', '💯', '#8B5CF6', 'questions', 100),
('Speed Demon', 'Complete a quiz in under 5 minutes', '🚀', '#EF4444', 'time', 300),
('Perfectionist', 'Score 100% on a quiz with 10+ questions', '⭐', '#FFD700', 'score', 100),
('Dedicated Student', 'Study for 10 hours total', '📚', '#06B6D4', 'time', 600),
('Level Up', 'Reach level 5', '🏆', '#F59E0B', 'level', 5),
('Knowledge Seeker', 'Answer 500 questions correctly', '🧠', '#8B5CF6', 'questions', 500),
('Consistency King', 'Maintain a 30-day study streak', '👑', '#FFD700', 'streak', 30)
ON CONFLICT DO NOTHING;
