import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Brain,
  BookOpen,
  Trophy,
  Target,
  Upload,
  Zap,
  Users,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Sparkles,
  FileText,
  Mic,
} from "lucide-react"

export default function HomePage() {
  const features = [
    {
      icon: Brain,
      title: "AI Question Generation",
      description:
        "Generate intelligent questions from any content with multiple difficulty levels and question types.",
      color: "text-purple-600 bg-purple-100",
    },
    {
      icon: Upload,
      title: "Bulk PDF Processing",
      description: "Upload PDFs and documents to automatically create comprehensive question banks.",
      color: "text-green-600 bg-green-100",
    },
    {
      icon: Target,
      title: "Adaptive Difficulty",
      description: "AI adjusts question difficulty based on your performance for optimal learning.",
      color: "text-blue-600 bg-blue-100",
    },
    {
      icon: BarChart3,
      title: "Progress Tracking",
      description: "Detailed analytics and insights to track your learning progress over time.",
      color: "text-orange-600 bg-orange-100",
    },
    {
      icon: Trophy,
      title: "Gamification",
      description: "Earn points, badges, and maintain streaks to stay motivated in your studies.",
      color: "text-yellow-600 bg-yellow-100",
    },
    {
      icon: Users,
      title: "Leaderboards",
      description: "Compete with other students and see how you rank in different subjects.",
      color: "text-red-600 bg-red-100",
    },
    {
      icon: FileText,
      title: "AI Notes Summarizer",
      description: "Get key concepts highlighted and comprehensive summaries of your study materials.",
      color: "text-indigo-600 bg-indigo-100",
    },
    {
      icon: Mic,
      title: "Voice Input",
      description: "Use voice commands to interact with the platform and answer questions hands-free.",
      color: "text-pink-600 bg-pink-100",
    },
  ]

  const benefits = [
    "Personalized learning experience",
    "AI-powered question generation",
    "Comprehensive progress analytics",
    "Gamified learning environment",
    "Multi-format content support",
    "Adaptive difficulty system",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AI Exam Prep</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-200">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered Learning Platform
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">
            Master Your Exams with{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Intelligence
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto text-pretty">
            Transform your study materials into intelligent quizzes, track your progress with detailed analytics, and
            accelerate your learning with adaptive AI technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8"
              >
                Start Learning Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                Sign In to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need to Excel</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform combines AI technology with proven learning methodologies to help you achieve
              your academic goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`w-12 h-12 rounded-full ${feature.color} flex items-center justify-center mx-auto mb-4`}
                  >
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 text-pretty">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Why Choose Our Platform?</h2>
              <p className="text-lg text-gray-600 mb-8">
                Experience the future of exam preparation with our AI-driven approach that adapts to your learning style
                and pace.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-100" />
                  <div className="text-2xl font-bold">10K+</div>
                  <div className="text-blue-100 text-sm">Questions Generated</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-green-100" />
                  <div className="text-2xl font-bold">500+</div>
                  <div className="text-green-100 text-sm">Active Students</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-purple-100" />
                  <div className="text-2xl font-bold">95%</div>
                  <div className="text-purple-100 text-sm">Success Rate</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6 text-center">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-orange-100" />
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-orange-100 text-sm">AI Support</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your Learning?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already using AI to accelerate their exam preparation and achieve better
            results.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8">
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">AI Exam Prep</span>
            </div>
          </div>
          <div className="text-center text-gray-400">
            <p>&copy; 2024 AI Exam Prep Platform. All rights reserved.</p>
            <p className="mt-2">Empowering students with intelligent learning technology.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
