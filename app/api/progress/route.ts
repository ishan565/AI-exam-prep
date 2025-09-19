import { createServerClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const subject = searchParams.get("subject")
    const timeframe = searchParams.get("timeframe") || "week" // week, month, year, all

    const supabase = createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    let progressQuery = supabase.from("user_progress").select("*").eq("user_id", user.id)

    if (subject) {
      progressQuery = progressQuery.eq("subject", subject)
    }

    const { data: progress, error: progressError } = await progressQuery

    if (progressError) {
      console.error("Error fetching progress:", progressError)
      return Response.json({ error: "Failed to fetch progress" }, { status: 500 })
    }

    let timeFilter = ""
    const now = new Date()
    switch (timeframe) {
      case "week":
        timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
      case "month":
        timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        break
      case "year":
        timeFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
        break
      default:
        timeFilter = "1970-01-01T00:00:00.000Z"
    }

    let quizQuery = supabase
      .from("quiz_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("completed_at", timeFilter)
      .order("completed_at", { ascending: false })

    if (subject) {
      quizQuery = quizQuery.eq("subject", subject)
    }

    const { data: quizHistory, error: quizError } = await quizQuery

    if (quizError) {
      console.error("Error fetching quiz history:", quizError)
      return Response.json({ error: "Failed to fetch quiz history" }, { status: 500 })
    }

    const { data: achievements, error: achievementsError } = await supabase
      .from("user_achievements")
      .select(`
        *,
        achievements (*)
      `)
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false })

    if (achievementsError) {
      console.error("Error fetching achievements:", achievementsError)
    }

    const totalQuizzes = quizHistory?.length || 0
    const averageScore =
      totalQuizzes > 0 ? Math.round(quizHistory.reduce((sum, quiz) => sum + (quiz.score || 0), 0) / totalQuizzes) : 0

    const totalPoints = progress?.reduce((sum, p) => sum + (p.total_points || 0), 0) || 0
    const currentStreak = progress?.[0]?.current_streak || 0
    const longestStreak = progress?.reduce((max, p) => Math.max(max, p.longest_streak || 0), 0) || 0

    const subjectStats =
      progress?.map((p) => ({
        subject: p.subject,
        average_score: p.average_score,
        total_questions: p.total_questions_answered,
        correct_answers: p.correct_answers,
        accuracy:
          p.total_questions_answered > 0 ? Math.round((p.correct_answers / p.total_questions_answered) * 100) : 0,
        weak_topics: p.weak_topics || [],
        strong_topics: p.strong_topics || [],
        total_points: p.total_points || 0,
        last_activity: p.last_activity_at,
      })) || []

    const recentQuizzes =
      quizHistory?.slice(0, 10).map((quiz) => ({
        date: quiz.completed_at,
        score: quiz.score,
        subject: quiz.subject,
        question_count: quiz.question_count,
      })) || []

    return Response.json({
      overview: {
        total_quizzes: totalQuizzes,
        average_score: averageScore,
        total_points: totalPoints,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        achievements_count: achievements?.length || 0,
      },
      subject_stats: subjectStats,
      recent_quizzes: recentQuizzes,
      achievements:
        achievements?.map((ua) => ({
          ...ua.achievements,
          earned_at: ua.earned_at,
        })) || [],
      timeframe: timeframe,
    })
  } catch (error) {
    console.error("Error fetching progress:", error)
    return Response.json({ error: "Failed to fetch progress data" }, { status: 500 })
  }
}
