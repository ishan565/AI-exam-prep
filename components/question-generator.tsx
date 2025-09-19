"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, FileText, Brain, CheckCircle, Mic } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { VoiceInput } from "./voice-input"
import { NotesSummarizer } from "./notes-summarizer"

interface Question {
  question: string
  type: string
  difficulty: string
  options?: string[]
  correct_answer: string
  explanation: string
  topic: string
  keywords: string[]
}

export function QuestionGenerator() {
  const [activeTab, setActiveTab] = useState<"text" | "pdf" | "voice" | "summarizer">("text")
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [formData, setFormData] = useState({
    content: "",
    subject: "",
    difficulty: "medium",
    questionType: "mcq",
    count: 5,
  })
  const { toast } = useToast()

  const handleGenerateFromText = async () => {
    if (!formData.content.trim() || !formData.subject.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both content and subject.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate questions")
      }

      setQuestions(data.questions)
      toast({
        title: "Questions Generated!",
        description: `Successfully created ${data.saved_count} questions.`,
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate questions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!formData.subject.trim()) {
      toast({
        title: "Subject Required",
        description: "Please specify a subject before uploading.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const formDataObj = new FormData()
      formDataObj.append("file", file)
      formDataObj.append("subject", formData.subject)
      formDataObj.append("difficulty", formData.difficulty)
      formDataObj.append("questionCount", formData.count.toString())

      const response = await fetch("/api/generate-from-pdf", {
        method: "POST",
        body: formDataObj,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process PDF")
      }

      setQuestions(data.questions)
      toast({
        title: "PDF Processed!",
        description: `Generated ${data.saved_count} questions from your document.`,
      })
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process PDF",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceTranscript = (text: string) => {
    setFormData((prev) => ({ ...prev, content: text }))
  }

  const handleVoiceCommand = (command: string, params?: any) => {
    switch (command) {
      case "generate_questions":
        if (formData.content.trim() && formData.subject.trim()) {
          handleGenerateFromText()
        } else {
          toast({
            title: "Missing Information",
            description: "Please provide content and subject first.",
            variant: "destructive",
          })
        }
        break
      case "clear_content":
        setFormData((prev) => ({ ...prev, content: "" }))
        break
      default:
        break
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "mcq":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "true_false":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "conceptual":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "application":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("text")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "text" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          From Text
        </button>
        <button
          onClick={() => setActiveTab("pdf")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "pdf" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          From PDF
        </button>
        <button
          onClick={() => setActiveTab("voice")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "voice" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Mic className="w-4 h-4 inline mr-2" />
          Voice Input
        </button>
        <button
          onClick={() => setActiveTab("summarizer")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "summarizer" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Brain className="w-4 h-4 inline mr-2" />
          Summarizer
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI Question Generator
          </CardTitle>
          <CardDescription>Generate intelligent questions from your study materials using AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Biology, Mathematics"
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="count">Question Count</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="20"
                value={formData.count}
                onChange={(e) => setFormData((prev) => ({ ...prev, count: Number.parseInt(e.target.value) || 5 }))}
              />
            </div>
          </div>

          {activeTab === "text" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="questionType">Question Type</Label>
                <Select
                  value={formData.questionType}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, questionType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">Multiple Choice</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                    <SelectItem value="conceptual">Conceptual</SelectItem>
                    <SelectItem value="application">Application</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content">Study Content</Label>
                <Textarea
                  id="content"
                  placeholder="Paste your notes, textbook content, or any study material here..."
                  className="min-h-32"
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                />
              </div>
              <Button onClick={handleGenerateFromText} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Generate Questions
                  </>
                )}
              </Button>
            </div>
          )}

          {activeTab === "pdf" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Upload PDF/Document</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
                <p className="text-sm text-gray-500 mt-1">Supported formats: PDF, DOC, DOCX, TXT</p>
              </div>
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Processing document...</span>
                </div>
              )}
            </div>
          )}

          {activeTab === "voice" && (
            <div className="space-y-4">
              <VoiceInput
                onTranscript={handleVoiceTranscript}
                onCommand={handleVoiceCommand}
                placeholder="Use voice to input your study content..."
              />

              {formData.content && (
                <div>
                  <Label>Voice Input Content</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                    className="min-h-32 mt-2"
                    placeholder="Your voice input will appear here..."
                  />
                </div>
              )}

              <Button
                onClick={handleGenerateFromText}
                disabled={loading || !formData.content.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Generate Questions from Voice Input
                  </>
                )}
              </Button>
            </div>
          )}

          {activeTab === "summarizer" && <NotesSummarizer />}
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Generated Questions ({questions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-lg">Question {index + 1}</h3>
                    <div className="flex gap-2">
                      <Badge className={getDifficultyColor(question.difficulty)}>{question.difficulty}</Badge>
                      <Badge className={getTypeColor(question.type)}>{question.type.replace("_", " ")}</Badge>
                    </div>
                  </div>

                  <p className="text-gray-900">{question.question}</p>

                  {question.options && question.options.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium text-sm text-gray-700">Options:</p>
                      <ul className="space-y-1">
                        {question.options.map((option, optIndex) => (
                          <li key={optIndex} className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span>{option}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="font-medium text-sm text-green-800">Correct Answer:</p>
                    <p className="text-green-700">{question.correct_answer}</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="font-medium text-sm text-blue-800">Explanation:</p>
                    <p className="text-blue-700">{question.explanation}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      Topic: {question.topic}
                    </Badge>
                    {question.keywords.map((keyword, kIndex) => (
                      <Badge key={kIndex} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
