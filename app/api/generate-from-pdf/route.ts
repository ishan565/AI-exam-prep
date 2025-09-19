import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"

const extractedContentSchema = z.object({
  title: z.string().describe("Title or main topic of the document"),
  key_concepts: z.array(z.string()).describe("Main concepts and topics covered"),
  summary: z.string().describe("Brief summary of the content"),
  content: z.string().describe("Cleaned and structured text content"),
})

const questionBankSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      type: z.enum(["mcq", "true_false", "conceptual", "application"]),
      difficulty: z.enum(["easy", "medium", "hard"]),
      options: z.array(z.string()).optional(),
      correct_answer: z.string(),
      explanation: z.string(),
      topic: z.string(),
      keywords: z.array(z.string()),
    }),
  ),
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const subject = formData.get("subject") as string
    const difficulty = (formData.get("difficulty") as string) || "medium"
    const questionCount = Number.parseInt(formData.get("questionCount") as string) || 10

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    const supabase = createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")

    const { object: extractedContent } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: extractedContentSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract and structure the educational content from this document. Focus on key concepts, definitions, and important information that could be used for creating exam questions.",
            },
            {
              type: "file",
              data: base64,
              mediaType: file.type || "application/pdf",
              filename: file.name,
            },
          ],
        },
      ],
    })

    const { object: questionBank } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: questionBankSchema,
      messages: [
        {
          role: "system",
          content: `Create a comprehensive question bank with ${questionCount} questions of varying types and difficulties. 
          
          Distribution:
          - 40% MCQ questions (4 options each)
          - 20% True/False questions
          - 25% Conceptual questions (short answer)
          - 15% Application questions (scenario-based)
          
          Difficulty distribution:
          - Easy: 30% (basic recall and recognition)
          - Medium: 50% (understanding and application)
          - Hard: 20% (analysis and synthesis)
          
          Ensure questions cover different topics and concepts from the material.`,
        },
        {
          role: "user",
          content: `Create ${questionCount} questions for the subject "${subject}" with "${difficulty}" focus based on this content:

Title: ${extractedContent.title}
Key Concepts: ${extractedContent.key_concepts.join(", ")}
Summary: ${extractedContent.summary}

Content:
${extractedContent.content}`,
        },
      ],
      temperature: 0.8,
    })

    const questionsToInsert = questionBank.questions.map((q) => ({
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
      source_content: extractedContent.title,
      source_type: "pdf",
    }))

    const { data: insertedQuestions, error: insertError } = await supabase
      .from("questions")
      .insert(questionsToInsert)
      .select()

    if (insertError) {
      console.error("Error inserting questions:", insertError)
      return Response.json({ error: "Failed to save questions" }, { status: 500 })
    }

    const { data: questionBankRecord, error: bankError } = await supabase
      .from("question_banks")
      .insert({
        user_id: user.id,
        name: extractedContent.title || `Question Bank - ${file.name}`,
        subject: subject,
        description: extractedContent.summary,
        question_count: questionBank.questions.length,
        source_file: file.name,
      })
      .select()
      .single()

    if (bankError) {
      console.error("Error creating question bank:", bankError)
    }

    return Response.json({
      success: true,
      extracted_content: extractedContent,
      questions: questionBank.questions,
      question_bank_id: questionBankRecord?.id,
      saved_count: insertedQuestions?.length || 0,
    })
  } catch (error) {
    console.error("Error processing PDF:", error)
    return Response.json({ error: "Failed to process PDF and generate questions" }, { status: 500 })
  }
}
