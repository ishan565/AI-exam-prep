import { createServerClient } from "@/lib/supabase/server"
import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
import { z } from "zod"

const quizAnalysisSchema = z.object({
  overall_performance: z.string().describe("Overall assessment of performance"),
  strengths: z.array(z.string()).describe("Areas where the user performed well"),
  areas_for_improvement: z.array(z.string()).describe("Areas needing more focus"),
  study_recommendations: z.array(z.string()).describe("Specific study recommendations"),
  next_difficulty_level: z.enum(["easy", "medium", "hard"]).describe("Recommended difficulty for next quiz"),
  mastery_level: z.enum(["beginner", "intermediate", "advanced"]).describe("Current mastery level"),
  time_management_feedback: z.string().describe("Feedback on time management during quiz"),
})

export async function POST(req: Request) {
  try {
    const { quiz_session_id } = await req.json()

    const supabase = createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: quizSession, error: sessionError } = await supabase
      .from("quiz_sessions")
      .select(`
        *,
        quiz_answers (
          *,
          questions (*)
        )
      `)
      .eq("id", quiz_session_id)
      .single()

    if (sessionError || !quizSession) {
      return Response.json({ error: "Quiz session not found" }, { status: 404 })
    }

    const answers = quizSession.quiz_answers || []
    const correctAnswers = answers.filter((a) => a.is_correct).length
    const totalQuestions = answers.length
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    const averageTime = answers.reduce((sum, a) => sum + (a.time_taken || 0), 0) / totalQuestions

    const { object: analysis } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: quizAnalysisSchema,
      messages: [
        {
          role: "system",
          content: `You are an expert educational analyst providing comprehensive quiz performance analysis. 

          Analyze the user's performance and provide:
          - Detailed performance assessment
          - Specific strengths and weaknesses
          - Actionable study recommendations
          - Appropriate difficulty progression
          - Time management insights`,
        },
        {
          role: "user",
          content: `Analyze this quiz performance:

Subject: ${quizSession.subject}
Score: ${score}% (${correctAnswers}/${totalQuestions})
Average Time per Question: ${averageTime.toFixed(1)} seconds

Question Performance:
${answers
  .map(
    (answer, i) => `
${i + 1}. ${answer.questions?.topic || "Unknown Topic"} (${answer.questions?.difficulty || "Unknown"})
   - Correct: ${answer.is_correct ? "Yes" : "No"}
   - Time: ${answer.time_taken}s
   - User Answer: ${answer.user_answer}
   - Correct Answer: ${answer.questions?.correct_answer || "Unknown"}
`,
  )
  .join("")}

Provide comprehensive analysis and recommendations for improvement.`,
        },
      ],
      temperature: 0.3,
    })

    const { error: updateError } = await supabase
      .from("quiz_sessions")
      .update({
        status: "completed",
        score: score,
        completed_at: new Date().toISOString(),
        ai_analysis: analysis.overall_performance,
        recommendations: analysis.study_recommendations,
      })
      .eq("id", quiz_session_id)

    if (updateError) {
      console.error("Error updating quiz session:", updateError)
    }

    const pointsEarned = answers.reduce((sum, answer) => {
      if (!answer.is_correct) return sum
      const difficulty = answer.questions?.difficulty || "easy"
      return sum + (difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30)
    }, 0)

    const { error: pointsError } = await supabase.rpc("add_user_points", {
      p_user_id: user.id,
      p_points: pointsEarned,
      p_source: "quiz_completion",
    })

    if (pointsError) {
      console.error("Error updating points:", pointsError)
    }

    const { data: newAchievements } = await supabase.rpc("check_achievements", {
      p_user_id: user.id,
      p_quiz_score: score,
      p_subject: quizSession.subject,
    })

    return Response.json({
      quiz_completed: true,
      score: score,
      correct_answers: correctAnswers,
      total_questions: totalQuestions,
      points_earned: pointsEarned,
      average_time: averageTime,
      analysis: analysis,
      new_achievements: newAchievements || [],
      detailed_results: answers.map((answer) => ({
        question: answer.questions?.question,
        user_answer: answer.user_answer,
        correct_answer: answer.questions?.correct_answer,
        is_correct: answer.is_correct,
        explanation: answer.questions?.explanation,
        ai_feedback: answer.ai_feedback,
        learning_tips: answer.learning_tips,
        time_taken: answer.time_taken,
        topic: answer.questions?.topic,
        difficulty: answer.questions?.difficulty,
      })),
    })
  } catch (error) {
    console.error("Error completing quiz:", error)
    return Response.json({ error: "Failed to complete quiz" }, { status: 500 })
  }
}
