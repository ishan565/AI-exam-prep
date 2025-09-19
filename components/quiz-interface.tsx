"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Brain, CheckCircle, XCircle, Lightbulb, Trophy, Target, Timer, ArrowRight, RotateCcw, Mic } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { VoiceInput } from "./voice-input"

interface Question {
  id: string
  question_number: number
  question: string
  type: string
  difficulty: string
  options?: string[]
  topic: string
}

interface QuizResult {
  is_correct: boolean
  correct_answer: string
  explanation: string
  ai_feedback: string
  learning_tips: string[]
  points_earned: number
}

export function QuizInterface() {
  const [quizState, setQuizState] = useState<"setup" | "active" | "feedback" | "completed">("setup")
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [quizSessionId, setQuizSessionId] = useState<string>("")
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes default
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [currentResult, setCurrentResult] = useState<QuizResult | null>(null)
  const [totalScore, setTotalScore] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showVoiceInput, setShowVoiceInput] = useState(false)
  const [quizSettings, setQuizSettings] = useState({
    subject: "",
    questionCount: 10,
    difficulty: "medium",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (quizState === "active" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else if (timeLeft === 0 && quizState === "active") {
      handleSubmitAnswer() // Auto-submit when time runs out
    }
  }, [quizState, timeLeft])

  const startQuiz = async () => {
    if (!quizSettings.subject.trim()) {
      toast({
        title: "Subject Required",
        description: "Please enter a subject to start the quiz.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/start-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizSettings),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to start quiz")
      }

      setQuestions(data.questions)
      setQuizSessionId(data.quiz_session_id)
      setQuizState("active")
      setCurrentQuestionIndex(0)
      setQuestionStartTime(Date.now())
      setTimeLeft(data.questions.length * 60) // 1 minute per question

      toast({
        title: "Quiz Started!",
        description: `${data.total_questions} questions loaded. Good luck!`,
      })
    } catch (error) {
      toast({
        title: "Failed to Start Quiz",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() && questions[currentQuestionIndex].type !== "true_false") {
      toast({
        title: "Answer Required",
        description: "Please provide an answer before continuing.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000)

    try {
      const response = await fetch("/api/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_session_id: quizSessionId,
          question_id: questions[currentQuestionIndex].id,
          user_answer: userAnswer,
          time_taken: timeTaken,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit answer")
      }

      setCurrentResult(result)
      setQuizState("feedback")

      if (result.is_correct) {
        setTotalScore((prev) => prev + 1)
        setTotalPoints((prev) => prev + result.points_earned)
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setUserAnswer("")
      setQuizState("active")
      setQuestionStartTime(Date.now())
    } else {
      completeQuiz()
    }
  }

  const completeQuiz = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/complete-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz_session_id: quizSessionId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete quiz")
      }

      setQuizState("completed")
      toast({
        title: "Quiz Completed!",
        description: `Final Score: ${data.score}% | Points Earned: ${data.points_earned}`,
      })
    } catch (error) {
      toast({
        title: "Completion Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetQuiz = () => {
    setQuizState("setup")
    setQuestions([])
    setCurrentQuestionIndex(0)
    setUserAnswer("")
    setCurrentResult(null)
    setTotalScore(0)
    setTotalPoints(0)
    setTimeLeft(300)
    setShowVoiceInput(false)
  }

  const handleVoiceTranscript = (text: string) => {
    setUserAnswer(text)
  }

  const handleVoiceCommand = (command: string, params?: any) => {
    switch (command) {
      case "submit_answer":
        if (userAnswer.trim()) {
          handleSubmitAnswer()
        }
        break
      case "next_question":
        handleNextQuestion()
        break
      case "voice_answer":
        if (params?.answer) {
          setUserAnswer(params.answer)
        }
        break
      case "repeat_question":
        // Use speech synthesis to read the question
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(questions[currentQuestionIndex].question)
          speechSynthesis.speak(utterance)
        }
        break
      default:
        break
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
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

  if (quizState === "setup") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            Start New Quiz
          </CardTitle>
          <CardDescription>Configure your adaptive quiz settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <input
              id="subject"
              className="w-full p-2 border rounded-md"
              placeholder="e.g., Biology, Mathematics, History"
              value={quizSettings.subject}
              onChange={(e) => setQuizSettings((prev) => ({ ...prev, subject: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="questionCount">Number of Questions</Label>
              <select
                id="questionCount"
                className="w-full p-2 border rounded-md"
                value={quizSettings.questionCount}
                onChange={(e) =>
                  setQuizSettings((prev) => ({ ...prev, questionCount: Number.parseInt(e.target.value) }))
                }
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>
            <div>
              <Label htmlFor="difficulty">Preferred Difficulty</Label>
              <select
                id="difficulty"
                className="w-full p-2 border rounded-md"
                value={quizSettings.difficulty}
                onChange={(e) => setQuizSettings((prev) => ({ ...prev, difficulty: e.target.value }))}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          <Button onClick={startQuiz} disabled={loading} className="w-full" size="lg">
            {loading ? "Starting Quiz..." : "Start Adaptive Quiz"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (quizState === "active" && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex]

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Badge>
                <Badge className={getDifficultyColor(currentQuestion.difficulty)}>{currentQuestion.difficulty}</Badge>
                <Badge variant="secondary">{currentQuestion.type.replace("_", " ")}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVoiceInput(!showVoiceInput)}
                  className="ml-auto"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {showVoiceInput ? "Hide" : "Voice"}
                </Button>
              </div>
              <div className="flex items-center gap-2 text-orange-600">
                <Timer className="w-4 h-4" />
                <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <Progress value={(currentQuestionIndex / questions.length) * 100} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">{currentQuestion.question}</CardTitle>
            <CardDescription>Topic: {currentQuestion.topic}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion.type === "mcq" && currentQuestion.options && (
              <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === "true_false" && (
              <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="True" id="true" />
                  <Label htmlFor="true" className="cursor-pointer">
                    True
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="False" id="false" />
                  <Label htmlFor="false" className="cursor-pointer">
                    False
                  </Label>
                </div>
              </RadioGroup>
            )}

            {(currentQuestion.type === "conceptual" || currentQuestion.type === "application") && (
              <Textarea
                placeholder="Type your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="min-h-24"
              />
            )}

            {showVoiceInput && (
              <VoiceInput onTranscript={handleVoiceTranscript} onCommand={handleVoiceCommand} className="mt-4" />
            )}

            <Button onClick={handleSubmitAnswer} disabled={loading || !userAnswer.trim()} className="w-full" size="lg">
              {loading ? "Submitting..." : "Submit Answer"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (quizState === "feedback" && currentResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentResult.is_correct ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-green-600">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-600" />
                  <span className="text-red-600">Incorrect</span>
                </>
              )}
              <Badge className="ml-auto">+{currentResult.points_earned} points</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Correct Answer:</h4>
              <p className="text-blue-700">{currentResult.correct_answer}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Explanation:</h4>
              <p className="text-gray-700">{currentResult.explanation}</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Feedback:
              </h4>
              <p className="text-purple-700 mb-3">{currentResult.ai_feedback}</p>

              {currentResult.learning_tips.length > 0 && (
                <div>
                  <h5 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Learning Tips:
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-purple-700">
                    {currentResult.learning_tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-600">
                Progress: {currentQuestionIndex + 1} of {questions.length} questions
              </div>
              <Button onClick={handleNextQuestion} size="lg">
                {currentQuestionIndex < questions.length - 1 ? (
                  <>
                    Next Question
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Complete Quiz
                    <Trophy className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (quizState === "completed") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-600" />
            Quiz Completed!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold text-blue-600">{Math.round((totalScore / questions.length) * 100)}%</div>
            <p className="text-gray-600">
              {totalScore} out of {questions.length} questions correct
            </p>
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{totalPoints} points earned</Badge>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={resetQuiz} variant="outline" className="flex-1 bg-transparent">
              <RotateCcw className="w-4 h-4 mr-2" />
              Take Another Quiz
            </Button>
            <Button className="flex-1">
              <Target className="w-4 h-4 mr-2" />
              View Progress
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
