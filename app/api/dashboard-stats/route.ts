import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: progressData } = await supabase.from("user_progress").select("*").eq("user_id", user.id)

    const totalQuizzes = progressData?.reduce((sum, p) => sum + (p.quizzes_taken || 0), 0) || 0
    const averageScore = progressData?.length
      ? Math.round(progressData.reduce((sum, p) => sum + (p.average_score || 0), 0) / progressData.length)
      : 0
    const totalPoints = progressData?.reduce((sum, p) => sum + (p.total_points || 0), 0) || 0
    const currentStreak = Math.max(...(progressData?.map((p) => p.current_streak || 0) || [0]))

    const { data: recentQuizzes } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(5)

    const { data: recentQuestions } = await supabase
      .from("questions")
      .select("subject, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3)

    const recentActivity = [
      ...(recentQuizzes?.map((quiz) => ({
        type: "quiz",
        subject: quiz.subject,
        score: quiz.score,
        created_at: quiz.completed_at,
      })) || []),
      ...(recentQuestions?.map((q) => ({
        type: "question_generation",
        subject: q.subject,
        created_at: q.created_at,
      })) || []),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    const upcomingGoals = []

    if (totalQuizzes < 10) {
      upcomingGoals.push({
        title: "Complete 10 Quizzes",
        progress: totalQuizzes,
        target: 10,
      })
    }

    if (currentStreak < 7) {
      upcomingGoals.push({
        title: "7-Day Study Streak",
        progress: currentStreak,
        target: 7,
      })
    }

    if (averageScore < 80) {
      upcomingGoals.push({
        title: "Achieve 80% Average",
        progress: averageScore,
        target: 80,
      })
    }

    return Response.json({
      total_quizzes: totalQuizzes,
      average_score: averageScore,
      total_points: totalPoints,
      current_streak: currentStreak,
      recent_activity: recentActivity,
      upcoming_goals: upcomingGoals,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return Response.json({ error: "Failed to fetch dashboard statistics" }, { status: 500 })
  }
}
