"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Target, Flame, TrendingUp, BookOpen, Award, Users, Medal } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ProgressData {
  overview: {
    total_quizzes: number
    average_score: number
    total_points: number
    current_streak: number
    longest_streak: number
    achievements_count: number
  }
  subject_stats: Array<{
    subject: string
    average_score: number
    total_questions: number
    accuracy: number
    weak_topics: string[]
    strong_topics: string[]
    total_points: number
  }>
  recent_quizzes: Array<{
    date: string
    score: number
    subject: string
    question_count: number
  }>
  achievements: Array<{
    id: string
    name: string
    description: string
    icon: string
    earned_at: string
  }>
}

interface LeaderboardData {
  leaderboard: Array<{
    rank: number
    user_id: string
    display_name: string
    total_points: number
    average_score: number
    accuracy: number
    best_streak: number
    subjects_studied: number
    is_current_user: boolean
  }>
  current_user_rank: number | null
}

export function ProgressDashboard() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState("month")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgressData()
    fetchLeaderboardData()
  }, [selectedTimeframe, selectedSubject])

  const fetchProgressData = async () => {
    try {
      const params = new URLSearchParams({
        timeframe: selectedTimeframe,
        ...(selectedSubject && { subject: selectedSubject }),
      })

      const response = await fetch(`/api/progress?${params}`)
      const data = await response.json()

      if (response.ok) {
        setProgressData(data)
      }
    } catch (error) {
      console.error("Error fetching progress:", error)
    }
  }

  const fetchLeaderboardData = async () => {
    try {
      const params = new URLSearchParams({
        timeframe: selectedTimeframe,
        ...(selectedSubject && { subject: selectedSubject }),
      })

      const response = await fetch(`/api/leaderboard?${params}`)
      const data = await response.json()

      if (response.ok) {
        setLeaderboardData(data)
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-purple-600 bg-purple-100"
    if (streak >= 14) return "text-orange-600 bg-orange-100"
    if (streak >= 7) return "text-yellow-600 bg-yellow-100"
    if (streak >= 3) return "text-green-600 bg-green-100"
    return "text-gray-600 bg-gray-100"
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-600 bg-yellow-100 border-yellow-200"
    if (rank === 2) return "text-gray-600 bg-gray-100 border-gray-200"
    if (rank === 3) return "text-orange-600 bg-orange-100 border-orange-200"
    if (rank <= 10) return "text-blue-600 bg-blue-100 border-blue-200"
    return "text-gray-600 bg-gray-100 border-gray-200"
  }

  const formatChartData = (quizzes: any[]) => {
    return quizzes
      .slice(0, 10)
      .reverse()
      .map((quiz, index) => ({
        quiz: `Quiz ${index + 1}`,
        score: quiz.score,
        date: new Date(quiz.date).toLocaleDateString(),
      }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Progress Dashboard</h2>
        <div className="flex gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {progressData?.subject_stats.map((subject) => (
                <SelectItem key={subject.subject} value={subject.subject}>
                  {subject.subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {progressData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Quizzes</p>
                  <p className="text-2xl font-bold text-blue-600">{progressData.overview.total_quizzes}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-green-600">{progressData.overview.average_score}%</p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Points</p>
                  <p className="text-2xl font-bold text-purple-600">{progressData.overview.total_points}</p>
                </div>
                <Trophy className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Streak</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-orange-600">{progressData.overview.current_streak}</p>
                    <Badge className={getStreakColor(progressData.overview.current_streak)}>
                      <Flame className="w-3 h-3 mr-1" />
                      {progressData.overview.current_streak >= 30
                        ? "Fire!"
                        : progressData.overview.current_streak >= 7
                          ? "Hot!"
                          : "Good!"}
                    </Badge>
                  </div>
                </div>
                <Flame className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {progressData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Recent Performance
                  </CardTitle>
                  <CardDescription>Your quiz scores over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={formatChartData(progressData.recent_quizzes)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quiz" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="w-5 h-5" />
                    Streak Progress
                  </CardTitle>
                  <CardDescription>Keep the momentum going!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Streak</span>
                      <span className="font-medium">{progressData.overview.current_streak} days</span>
                    </div>
                    <Progress
                      value={
                        (progressData.overview.current_streak / Math.max(progressData.overview.longest_streak, 30)) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Longest Streak</span>
                    <Badge variant="outline">{progressData.overview.longest_streak} days</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">7+</div>
                      <div className="text-xs text-green-600">Week Warrior</div>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <div className="text-lg font-bold text-orange-600">14+</div>
                      <div className="text-xs text-orange-600">Study Master</div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">30+</div>
                      <div className="text-xs text-purple-600">Legend</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          {progressData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {progressData.subject_stats.map((subject) => (
                <Card key={subject.subject}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{subject.subject}</span>
                      <Badge variant="outline">{subject.accuracy}% accuracy</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Questions Answered</span>
                        <div className="font-medium">{subject.total_questions}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Points Earned</span>
                        <div className="font-medium">{subject.total_points}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Average Score</span>
                        <span className="font-medium">{subject.average_score}%</span>
                      </div>
                      <Progress value={subject.average_score} className="h-2" />
                    </div>

                    {subject.strong_topics.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-green-600 mb-2">Strong Topics</div>
                        <div className="flex flex-wrap gap-1">
                          {subject.strong_topics.slice(0, 3).map((topic) => (
                            <Badge key={topic} className="bg-green-100 text-green-800 text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {subject.weak_topics.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-red-600 mb-2">Areas to Improve</div>
                        <div className="flex flex-wrap gap-1">
                          {subject.weak_topics.slice(0, 3).map((topic) => (
                            <Badge key={topic} className="bg-red-100 text-red-800 text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          {progressData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {progressData.achievements.map((achievement) => (
                <Card key={achievement.id} className="border-2 border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Award className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-yellow-800">{achievement.name}</h3>
                        <p className="text-sm text-yellow-700 mt-1">{achievement.description}</p>
                        <p className="text-xs text-yellow-600 mt-2">
                          Earned {new Date(achievement.earned_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {progressData.achievements.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Achievements Yet</h3>
                    <p className="text-gray-500">Complete quizzes and maintain streaks to earn achievements!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          {leaderboardData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Leaderboard
                  {leaderboardData.current_user_rank && (
                    <Badge className={getRankColor(leaderboardData.current_user_rank)}>
                      Your Rank: #{leaderboardData.current_user_rank}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Top performers in the community</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboardData.leaderboard.map((entry) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        entry.is_current_user ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {entry.rank <= 3 ? (
                            <Medal
                              className={`w-5 h-5 ${
                                entry.rank === 1
                                  ? "text-yellow-500"
                                  : entry.rank === 2
                                    ? "text-gray-500"
                                    : "text-orange-500"
                              }`}
                            />
                          ) : (
                            <span className="w-5 text-center font-medium text-gray-600">#{entry.rank}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{entry.display_name}</div>
                          <div className="text-sm text-gray-600">
                            {entry.subjects_studied} subjects • {entry.accuracy}% accuracy
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-600">{entry.total_points} pts</div>
                        <div className="text-sm text-gray-600">{entry.average_score}% avg</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
