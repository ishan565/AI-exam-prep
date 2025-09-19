"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, FileText, Lightbulb, Target, AlertTriangle, BookOpen, Loader2, Download, Bookmark } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface KeyConcept {
  concept: string
  definition: string
  importance: "high" | "medium" | "low"
}

interface SummaryResult {
  title: string
  key_concepts: KeyConcept[]
  summary: string
  study_tips: string[]
  potential_exam_topics: string[]
  difficulty_areas: string[]
  summary_id: string
}

export function NotesSummarizer() {
  const [content, setContent] = useState("")
  const [subject, setSubject] = useState("")
  const [loading, setLoading] = useState(false)
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null)
  const [activeTab, setActiveTab] = useState("input")
  const { toast } = useToast()

  const handleSummarize = async () => {
    if (!content.trim() || !subject.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both content and subject.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/summarize-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, subject }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to summarize notes")
      }

      setSummaryResult(data.summary)
      setActiveTab("summary")

      toast({
        title: "Notes Summarized!",
        description: "Your comprehensive study guide is ready.",
      })
    } catch (error) {
      toast({
        title: "Summarization Failed",
        description: error instanceof Error ? error.message : "Failed to summarize notes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const exportSummary = () => {
    if (!summaryResult) return

    const exportData = {
      title: summaryResult.title,
      subject: subject,
      summary: summaryResult.summary,
      key_concepts: summaryResult.key_concepts,
      study_tips: summaryResult.study_tips,
      potential_exam_topics: summaryResult.potential_exam_topics,
      difficulty_areas: summaryResult.difficulty_areas,
      generated_at: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${summaryResult.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_summary.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Summary Exported",
      description: "Your study guide has been downloaded.",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Notes Summarizer
          </CardTitle>
          <CardDescription>
            Transform your study materials into comprehensive, AI-powered summaries with key concept highlighting
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Input Notes
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2" disabled={!summaryResult}>
            <BookOpen className="w-4 h-4" />
            Study Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Biology, Chemistry, History"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleSummarize}
                    disabled={loading || !content.trim() || !subject.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Notes...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Summarize Notes
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Study Notes</Label>
                <Textarea
                  id="content"
                  placeholder="Paste your lecture notes, textbook content, or any study material here. The AI will analyze and create a comprehensive summary with key concepts highlighted..."
                  className="min-h-64 mt-2"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Tip: Include definitions, examples, and important details for better summarization
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          {summaryResult && (
            <>
              {/* Summary Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{summaryResult.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{subject}</Badge>
                        <span>•</span>
                        <span>{summaryResult.key_concepts.length} key concepts identified</span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={exportSummary}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm">
                        <Bookmark className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Main Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">{summaryResult.summary}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Key Concepts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Key Concepts
                  </CardTitle>
                  <CardDescription>Important concepts ranked by significance for exam preparation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {summaryResult.key_concepts.map((concept, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{concept.concept}</h4>
                          <Badge className={getImportanceColor(concept.importance)}>{concept.importance}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{concept.definition}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Study Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      Study Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {summaryResult.study_tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <span className="text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Potential Exam Topics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Likely Exam Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {summaryResult.potential_exam_topics.map((topic, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-700">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Difficulty Areas */}
              {summaryResult.difficulty_areas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Areas Requiring Extra Attention
                    </CardTitle>
                    <CardDescription>Topics that may need additional study time and practice</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {summaryResult.difficulty_areas.map((area, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                        >
                          <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                          <span className="text-orange-800">{area}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        // Navigate to question generator with this content
                        setActiveTab("input")
                      }}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Generate Questions from Summary
                    </Button>
                    <Button variant="outline" className="flex-1 bg-transparent">
                      <Target className="w-4 h-4 mr-2" />
                      Create Practice Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
