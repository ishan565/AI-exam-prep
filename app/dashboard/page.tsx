"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuestionGenerator } from "@/components/question-generator"
import { QuizInterface } from "@/components/quiz-interface"
import { ProgressDashboard } from "@/components/progress-dashboard"
import { NotesSummarizer } from "@/components/notes-summarizer"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import {
  Brain,
  BookOpen,
  Trophy,
  Target,
  FileText,
  Zap,
  TrendingUp,
  Calendar,
  Play,
  Plus,
  BarChart3,
  Mic,
} from "lucide-react"

interface DashboardStats {
  total_quizzes: number
  average_score: number
  total_points: number
  current_streak: number
  recent_activity: Array<{
    type: string
    subject: string
    score?: number
    created_at: string
  }>
  upcoming_goals: Array<{
    title: string
    progress: number
    target: number
  }>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardStats()
    }
  }, [user])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard-stats")
      const data = await response.json()

      if (response.ok) {
        setDashboardStats(data)
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const quickActions = [
    {
      title: "Take Quiz",
      description: "Start an adaptive quiz",
      icon: Play,
      color: "bg-blue-500 hover:bg-blue-600",
      action: () => setActiveTab("quiz"),
    },
    {
      title: "Generate Questions",
      description: "Create questions from content",
      icon: Brain,
      color: "bg-purple-500 hover:bg-purple-600",
      action: () => setActiveTab("generate"),
    },
    {
      title: "Summarize Notes",
      description: "AI-powered note analysis",
      icon: FileText,
      color: "bg-green-500 hover:bg-green-600",
      action: () => setActiveTab("summarizer"),
    },
    {
      title: "Voice Assistant",
      description: "Use voice commands",
      icon: Mic,
      color: "bg-orange-500 hover:bg-orange-600",
      action: () => setActiveTab("generate"),
    },
  ]

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {getGreeting()}, {user?.email?.split("@")[0] || "Student"}!
                </h1>
                <p className="text-gray-600 mt-1">Ready to boost your learning today?</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  <Trophy className="w-3 h-3 mr-1" />
                  {dashboardStats?.total_points || 0} Points
                </Badge>
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <Zap className="w-3 h-3 mr-1" />
                  {dashboardStats?.current_streak || 0} Day Streak
                </Badge>
              </div>
            </div>

            {/* Quick Stats */}
            {dashboardStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total Quizzes</p>
                        <p className="text-2xl font-bold">{dashboardStats.total_quizzes}</p>
                      </div>
                      <BookOpen className="w-8 h-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Average Score</p>
                        <p className="text-2xl font-bold">{dashboardStats.average_score}%</p>
                      </div>
                      <Target className="w-8 h-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Total Points</p>
                        <p className="text-2xl font-bold">{dashboardStats.total_points}</p>
                      </div>
                      <Trophy className="w-8 h-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">Current Streak</p>
                        <p className="text-2xl font-bold">{dashboardStats.current_streak}</p>
                      </div>
                      <Zap className="w-8 h-8 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                  onClick={action.action}
                >
                  <CardContent className="p-4 text-center">
                    <div
                      className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mx-auto mb-3`}
                    >
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="quiz" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Take Quiz
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="summarizer" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Summarizer
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Progress
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Your latest learning activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboardStats?.recent_activity?.length ? (
                      <div className="space-y-3">
                        {dashboardStats.recent_activity.slice(0, 5).map((activity, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                {activity.type === "quiz" ? (
                                  <Play className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Brain className="w-4 h-4 text-purple-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {activity.type === "quiz" ? "Completed Quiz" : "Generated Questions"}
                                </p>
                                <p className="text-sm text-gray-600">{activity.subject}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {activity.score && <Badge variant="outline">{activity.score}%</Badge>}
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(activity.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No recent activity</p>
                        <p className="text-sm text-gray-500">
                          Start a quiz or generate questions to see your activity here
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Learning Goals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Learning Goals
                    </CardTitle>
                    <CardDescription>Track your progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboardStats?.upcoming_goals?.length ? (
                      <div className="space-y-4">
                        {dashboardStats.upcoming_goals.map((goal, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{goal.title}</span>
                              <span className="text-gray-600">
                                {goal.progress}/{goal.target}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min((goal.progress / goal.target) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Set learning goals to track your progress</p>
                        <Button size="sm" className="mt-2">
                          <Plus className="w-4 h-4 mr-1" />
                          Add Goal
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Study Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Study Recommendations
                  </CardTitle>
                  <CardDescription>Personalized suggestions based on your performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Focus Areas</h4>
                      <p className="text-sm text-blue-700">
                        Review topics where you scored below 70% to strengthen your foundation.
                      </p>
                      <Button size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700">
                        Review Weak Topics
                      </Button>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Practice More</h4>
                      <p className="text-sm text-green-700">
                        Take more quizzes in subjects you're performing well to maintain momentum.
                      </p>
                      <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700">
                        Practice Strong Topics
                      </Button>
                    </div>
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">New Challenges</h4>
                      <p className="text-sm text-purple-700">
                        Try harder difficulty levels to push your understanding further.
                      </p>
                      <Button size="sm" className="mt-2 bg-purple-600 hover:bg-purple-700">
                        Take Hard Quiz
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quiz">
              <QuizInterface />
            </TabsContent>

            <TabsContent value="generate">
              <QuestionGenerator />
            </TabsContent>

            <TabsContent value="summarizer">
              <NotesSummarizer />
            </TabsContent>

            <TabsContent value="progress">
              <ProgressDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}
