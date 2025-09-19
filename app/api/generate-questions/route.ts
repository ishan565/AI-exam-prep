import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"

const questionSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe("The generated question"),
      type: z.enum(["mcq", "true_false", "conceptual", "application"]).describe("Type of question"),
      difficulty: z.enum(["easy", "medium", "hard"]).describe("Difficulty level"),
      options: z.array(z.string()).optional().describe("Multiple choice options (only for MCQ)"),
      correct_answer: z.string().describe("The correct answer"),
      explanation: z.string().describe("Explanation of the correct answer"),
      topic: z.string().describe("Main topic or concept covered"),
      keywords: z.array(z.string()).describe("Key terms related to this question"),
    }),
  ),
})

export async function POST(req: Request) {
  try {
    const { content, difficulty, questionType, count = 5, subject } = await req.json()

    const supabase = createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: questionSchema,
      messages: [
        {
          role: "system",
          content: `You are an expert educator creating exam questions. Generate ${count} high-quality questions based on the provided content. 
          
          Guidelines:
          - For MCQ: Provide 4 options with only one correct answer
          - For True/False: Create clear statements that are definitively true or false
          - For Conceptual: Focus on understanding and definitions
          - For Application: Create scenario-based questions requiring practical application
          - Difficulty levels: Easy (basic recall), Medium (understanding/analysis), Hard (synthesis/evaluation)
          - Ensure questions are clear, unambiguous, and educationally valuable
          - Include detailed explanations for learning purposes`,
        },
        {
          role: "user",
          content: `Generate ${count} ${difficulty} difficulty ${questionType} questions for the subject "${subject}" based on this content:

${content}

Make sure the questions test different aspects of the material and are appropriate for the specified difficulty level.`,
        },
      ],
      temperature: 0.7,
    })

    const questionsToInsert = object.questions.map((q) => ({
      user_id: user.id,
      subject: subject,
      question: q.question,
      type: q.type,
      difficulty: q.difficulty,
      options: q.options || [],
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      topic: q.topic,
      keywords: q.keywords,
      source_content: content.substring(0, 1000), // Store first 1000 chars as reference
    }))

    const { data: insertedQuestions, error: insertError } = await supabase
      .from("questions")
      .insert(questionsToInsert)
      .select()

    if (insertError) {
      console.error("Error inserting questions:", insertError)
      return Response.json({ error: "Failed to save questions" }, { status: 500 })
    }

    return Response.json({
      questions: object.questions,
      saved_count: insertedQuestions?.length || 0,
    })
  } catch (error) {
    console.error("Error generating questions:", error)
    return Response.json({ error: "Failed to generate questions" }, { status: 500 })
  }
}
