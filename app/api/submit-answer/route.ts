import { createServerClient } from "@/lib/supabase/server"
import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
import { z } from "zod"

const feedbackSchema = z.object({
  is_correct: z.boolean(),
  feedback: z.string().describe("Detailed explanation and feedback"),
  learning_tips: z.array(z.string()).describe("Specific tips to improve understanding"),
  difficulty_adjustment: z.enum(["easier", "same", "harder"]).describe("Suggested difficulty for next question"),
  confidence_level: z.enum(["low", "medium", "high"]).describe("User's likely confidence in this topic"),
  related_concepts: z.array(z.string()).describe("Related concepts to review"),
})

export async function POST(req: Request) {
  try {
    const { quiz_session_id, question_id, user_answer, time_taken } = await req.json()

    const supabase = createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("*")
      .eq("id", question_id)
      .single()

    if (questionError || !question) {
      return Response.json({ error: "Question not found" }, { status: 404 })
    }

    const isCorrect = user_answer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim()

    const { object: feedback } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: feedbackSchema,
      messages: [
        {
          role: "system",
          content: `You are an intelligent tutoring system providing personalized feedback to help students learn effectively. 

          Provide:
          - Clear explanation of why the answer is correct/incorrect
          - Specific learning tips to improve understanding
          - Suggestions for difficulty adjustment based on performance
          - Assessment of student's confidence level
          - Related concepts they should review`,
        },
        {
          role: "user",
          content: `Provide feedback for this quiz question:

Question: ${question.question}
Type: ${question.type}
Difficulty: ${question.difficulty}
Topic: ${question.topic}
${question.options ? `Options: ${question.options.join(", ")}` : ""}

Correct Answer: ${question.correct_answer}
User Answer: ${user_answer}
Time Taken: ${time_taken} seconds
Explanation: ${question.explanation}

The user ${isCorrect ? "answered correctly" : "answered incorrectly"}. Provide constructive feedback to help them learn.`,
        },
      ],
      temperature: 0.4,
    })

    const { data: savedAnswer, error: saveError } = await supabase
      .from("quiz_answers")
      .insert({
        quiz_session_id: quiz_session_id,
        question_id: question_id,
        user_answer: user_answer,
        is_correct: isCorrect,
        time_taken: time_taken,
        ai_feedback: feedback.feedback,
        learning_tips: feedback.learning_tips,
        difficulty_adjustment: feedback.difficulty_adjustment,
      })
      .select()
      .single()

    if (saveError) {
      console.error("Error saving answer:", saveError)
      return Response.json({ error: "Failed to save answer" }, { status: 500 })
    }

    const { error: progressError } = await supabase.rpc("update_user_progress", {
      p_user_id: user.id,
      p_subject: question.subject,
      p_topic: question.topic,
      p_is_correct: isCorrect,
      p_difficulty: question.difficulty,
      p_time_taken: time_taken,
    })

    if (progressError) {
      console.error("Error updating progress:", progressError)
    }

    return Response.json({
      is_correct: isCorrect,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      ai_feedback: feedback.feedback,
      learning_tips: feedback.learning_tips,
      difficulty_adjustment: feedback.difficulty_adjustment,
      confidence_level: feedback.confidence_level,
      related_concepts: feedback.related_concepts,
      points_earned: isCorrect ? (question.difficulty === "easy" ? 10 : question.difficulty === "medium" ? 20 : 30) : 0,
    })
  } catch (error) {
    console.error("Error submitting answer:", error)
    return Response.json({ error: "Failed to submit answer" }, { status: 500 })
  }
}
