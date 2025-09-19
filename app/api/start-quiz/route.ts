import { createServerClient } from "@/lib/supabase/server"
import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
import { z } from "zod"

const adaptiveQuizSchema = z.object({
  selected_questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      type: z.string(),
      difficulty: z.string(),
      options: z.array(z.string()).optional(),
      correct_answer: z.string(),
      explanation: z.string(),
      topic: z.string(),
      reasoning: z.string().describe("Why this question was selected for the user"),
    }),
  ),
})

export async function POST(req: Request) {
  try {
    const { subject, questionCount = 10, preferredDifficulty = "medium" } = await req.json()

    const supabase = createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userStats } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("subject", subject)
      .single()

    const { data: availableQuestions, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("subject", subject)
      .limit(50) // Get more questions than needed for better selection

    if (questionsError || !availableQuestions?.length) {
      return Response.json({ error: "No questions available for this subject" }, { status: 404 })
    }

    const { object: adaptiveSelection } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: adaptiveQuizSchema,
      messages: [
        {
          role: "system",
          content: `You are an adaptive learning system. Select ${questionCount} questions that will optimally challenge the user based on their performance history and learning needs.

          Selection criteria:
          - Balance question types and difficulties
          - Consider user's past performance and weak areas
          - Ensure progressive difficulty if user is performing well
          - Include review questions for concepts they've struggled with
          - Maintain engagement with variety`,
        },
        {
          role: "user",
          content: `Select ${questionCount} optimal questions for a ${subject} quiz.

User Performance History:
- Average Score: ${userStats?.average_score || "No history"}
- Weak Topics: ${userStats?.weak_topics?.join(", ") || "Unknown"}
- Strong Topics: ${userStats?.strong_topics?.join(", ") || "Unknown"}
- Preferred Difficulty: ${preferredDifficulty}

Available Questions:
${availableQuestions.map((q, i) => `${i + 1}. [${q.difficulty}] [${q.type}] ${q.topic}: ${q.question.substring(0, 100)}...`).join("\n")}

Select questions that will help the user learn effectively while maintaining appropriate challenge level.`,
        },
      ],
      temperature: 0.3,
    })

    const { data: quizSession, error: sessionError } = await supabase
      .from("quiz_sessions")
      .insert({
        user_id: user.id,
        subject: subject,
        question_count: questionCount,
        status: "active",
        adaptive_difficulty: preferredDifficulty,
      })
      .select()
      .single()

    if (sessionError) {
      console.error("Error creating quiz session:", sessionError)
      return Response.json({ error: "Failed to create quiz session" }, { status: 500 })
    }

    const selectedQuestions = adaptiveSelection.selected_questions
      .map((selected) => {
        const originalQuestion = availableQuestions.find(
          (q) => q.question.includes(selected.question.substring(0, 50)) || q.topic === selected.topic,
        )
        return originalQuestion || selected
      })
      .slice(0, questionCount)

    return Response.json({
      quiz_session_id: quizSession.id,
      questions: selectedQuestions.map((q, index) => ({
        id: q.id,
        question_number: index + 1,
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        options: q.options,
        topic: q.topic,
        // Don't send correct answer to client
      })),
      total_questions: questionCount,
      adaptive_reasoning: adaptiveSelection.selected_questions.map((q) => q.reasoning),
    })
  } catch (error) {
    console.error("Error starting quiz:", error)
    return Response.json({ error: "Failed to start quiz" }, { status: 500 })
  }
}
