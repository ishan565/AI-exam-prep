import { createServerClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const subject = searchParams.get("subject")
    const timeframe = searchParams.get("timeframe") || "month"
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const supabase = createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
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

    let leaderboardQuery = `
      SELECT 
        up.user_id,
        u.email,
        u.raw_user_meta_data->>'full_name' as full_name,
        SUM(up.total_points) as total_points,
        AVG(up.average_score) as avg_score,
        SUM(up.total_questions_answered) as total_questions,
        SUM(up.correct_answers) as correct_answers,
        MAX(up.current_streak) as best_streak,
        COUNT(DISTINCT up.subject) as subjects_studied
      FROM user_progress up
      JOIN auth.users u ON up.user_id = u.id
      WHERE up.last_activity_at >= '${timeFilter}'
    `

    if (subject) {
      leaderboardQuery += ` AND up.subject = '${subject}'`
    }

    leaderboardQuery += `
      GROUP BY up.user_id, u.email, u.raw_user_meta_data->>'full_name'
      ORDER BY total_points DESC, avg_score DESC
      LIMIT ${limit}
    `

    const { data: leaderboardData, error: leaderboardError } = await supabase.rpc("execute_sql", {
      query: leaderboardQuery,
    })

    if (leaderboardError) {
      console.error("Error fetching leaderboard:", leaderboardError)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("user_progress")
        .select(`
          user_id,
          total_points,
          average_score,
          total_questions_answered,
          correct_answers,
          current_streak,
          subject
        `)
        .gte("last_activity_at", timeFilter)
        .order("total_points", { ascending: false })
        .limit(limit)

      if (fallbackError) {
        return Response.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
      }

      const userStats = new Map()
      fallbackData?.forEach((record) => {
        const userId = record.user_id
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            user_id: userId,
            total_points: 0,
            avg_score: 0,
            total_questions: 0,
            correct_answers: 0,
            best_streak: 0,
            subjects_studied: new Set(),
          })
        }

        const stats = userStats.get(userId)
        stats.total_points += record.total_points || 0
        stats.total_questions += record.total_questions_answered || 0
        stats.correct_answers += record.correct_answers || 0
        stats.best_streak = Math.max(stats.best_streak, record.current_streak || 0)
        stats.subjects_studied.add(record.subject)
      })

      const processedData = Array.from(userStats.values())
        .map((stats) => ({
          ...stats,
          avg_score: stats.total_questions > 0 ? Math.round((stats.correct_answers / stats.total_questions) * 100) : 0,
          subjects_studied: stats.subjects_studied.size,
        }))
        .sort((a, b) => b.total_points - a.total_points)

      return Response.json({
        leaderboard: processedData.map((entry, index) => ({
          rank: index + 1,
          user_id: entry.user_id,
          display_name: `Student ${entry.user_id.substring(0, 8)}`,
          total_points: entry.total_points,
          average_score: entry.avg_score,
          total_questions: entry.total_questions,
          accuracy: entry.total_questions > 0 ? Math.round((entry.correct_answers / entry.total_questions) * 100) : 0,
          best_streak: entry.best_streak,
          subjects_studied: entry.subjects_studied,
          is_current_user: entry.user_id === user.id,
        })),
        current_user_rank: processedData.findIndex((entry) => entry.user_id === user.id) + 1,
        timeframe: timeframe,
        subject: subject,
      })
    }

    const leaderboard =
      leaderboardData?.map((entry: any, index: number) => ({
        rank: index + 1,
        user_id: entry.user_id,
        display_name: entry.full_name || `Student ${entry.user_id.substring(0, 8)}`,
        total_points: entry.total_points || 0,
        average_score: Math.round(entry.avg_score || 0),
        total_questions: entry.total_questions || 0,
        accuracy: entry.total_questions > 0 ? Math.round((entry.correct_answers / entry.total_questions) * 100) : 0,
        best_streak: entry.best_streak || 0,
        subjects_studied: entry.subjects_studied || 0,
        is_current_user: entry.user_id === user.id,
      })) || []

    const currentUserRank = leaderboard.findIndex((entry) => entry.is_current_user) + 1

    return Response.json({
      leaderboard,
      current_user_rank: currentUserRank || null,
      timeframe: timeframe,
      subject: subject,
    })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return Response.json({ error: "Failed to fetch leaderboard data" }, { status: 500 })
  }
}
