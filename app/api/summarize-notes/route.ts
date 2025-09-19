import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"

const summarySchema = z.object({
  title: z.string().describe("Title for the notes"),
  key_concepts: z
    .array(
      z.object({
        concept: z.string(),
        definition: z.string(),
        importance: z.enum(["high", "medium", "low"]),
      }),
    )
    .describe("Key concepts with definitions and importance levels"),
  summary: z.string().describe("Comprehensive summary of the notes"),
  study_tips: z.array(z.string()).describe("Study tips and recommendations"),
  potential_exam_topics: z.array(z.string()).describe("Topics likely to appear in exams"),
  difficulty_areas: z.array(z.string()).describe("Areas that might be challenging to understand"),
})

export async function POST(req: Request) {
  try {
    const { content, subject } = await req.json()

    const supabase = createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { object: summary } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: summarySchema,
      messages: [
        {
          role: "system",
          content: `You are an expert study assistant. Analyze the provided notes and create a comprehensive summary that helps students understand and retain the material effectively. 

          Focus on:
          - Identifying and explaining key concepts clearly
          - Highlighting the most important information for exam preparation
          - Providing practical study tips
          - Identifying potential challenging areas
          - Creating connections between different concepts`,
        },
        {
          role: "user",
          content: `Analyze and summarize these ${subject} notes:

${content}

Create a comprehensive study guide that will help me understand the material and prepare for exams effectively.`,
        },
      ],
      temperature: 0.3,
    })

    const { data: savedSummary, error: saveError } = await supabase
      .from("note_summaries")
      .insert({
        user_id: user.id,
        subject: subject,
        title: summary.title,
        original_content: content,
        summary: summary.summary,
        key_concepts: summary.key_concepts,
        study_tips: summary.study_tips,
        potential_exam_topics: summary.potential_exam_topics,
        difficulty_areas: summary.difficulty_areas,
      })
      .select()
      .single()

    if (saveError) {
      console.error("Error saving summary:", saveError)
      return Response.json({ error: "Failed to save summary" }, { status: 500 })
    }

    return Response.json({
      success: true,
      summary: summary,
      summary_id: savedSummary.id,
    })
  } catch (error) {
    console.error("Error summarizing notes:", error)
    return Response.json({ error: "Failed to summarize notes" }, { status: 500 })
  }
}
