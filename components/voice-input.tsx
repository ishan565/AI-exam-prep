"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Volume2, VolumeX, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VoiceInputProps {
  onTranscript?: (text: string) => void
  onCommand?: (command: string, params?: any) => void
  placeholder?: string
  className?: string
}

export function VoiceInput({
  onTranscript,
  onCommand,
  placeholder = "Click to start voice input...",
  className = "",
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [interimTranscript, setInterimTranscript] = useState("")
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const recognitionRef = useRef<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        recognitionRef.current = new SpeechRecognition()

        // Configure recognition
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "en-US"

        // Event handlers
        recognitionRef.current.onstart = () => {
          setIsListening(true)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ""
          let interimTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              finalTranscript += result[0].transcript
              setConfidence(result[0].confidence)
            } else {
              interimTranscript += result[0].transcript
            }
          }

          if (finalTranscript) {
            const newTranscript = transcript + finalTranscript
            setTranscript(newTranscript)
            setInterimTranscript("")
            onTranscript?.(newTranscript)

            // Check for voice commands
            processVoiceCommand(finalTranscript.toLowerCase().trim())
          } else {
            setInterimTranscript(interimTranscript)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error)
          setIsListening(false)

          if (event.error === "not-allowed") {
            toast({
              title: "Microphone Access Denied",
              description: "Please allow microphone access to use voice input.",
              variant: "destructive",
            })
          } else if (event.error === "no-speech") {
            toast({
              title: "No Speech Detected",
              description: "Please speak clearly into your microphone.",
              variant: "destructive",
            })
          }
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [transcript, onTranscript, toast])

  const processVoiceCommand = (command: string) => {
    // Define voice commands
    const commands = {
      "start quiz": () => onCommand?.("start_quiz"),
      "take quiz": () => onCommand?.("start_quiz"),
      "generate questions": () => onCommand?.("generate_questions"),
      "create questions": () => onCommand?.("generate_questions"),
      "summarize notes": () => onCommand?.("summarize_notes"),
      "show progress": () => onCommand?.("show_progress"),
      "view dashboard": () => onCommand?.("show_dashboard"),
      "clear text": () => {
        setTranscript("")
        onTranscript?.("")
      },
      "stop listening": () => stopListening(),
      "submit answer": () => onCommand?.("submit_answer"),
      "next question": () => onCommand?.("next_question"),
      "repeat question": () => onCommand?.("repeat_question"),
    }

    // Check for exact matches
    if (commands[command as keyof typeof commands]) {
      commands[command as keyof typeof commands]()
      speak(`Executing ${command}`)
      return
    }

    // Check for partial matches
    for (const [cmd, action] of Object.entries(commands)) {
      if (command.includes(cmd)) {
        action()
        speak(`Executing ${cmd}`)
        return
      }
    }

    // Check for answer patterns
    if (command.startsWith("answer is ") || command.startsWith("the answer is ")) {
      const answer = command.replace(/^(the )?answer is /, "")
      onCommand?.("voice_answer", { answer })
      speak("Answer recorded")
    }
  }

  const speak = (text: string) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.8
    utterance.pitch = 1
    utterance.volume = 0.7
    speechSynthesis.speak(utterance)
  }

  const startListening = () => {
    if (!isSupported) {
      toast({
        title: "Voice Input Not Supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      })
      return
    }

    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
        toast({
          title: "Voice Input Started",
          description: "Listening for your voice commands and answers...",
        })
      } catch (error) {
        console.error("Error starting recognition:", error)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      toast({
        title: "Voice Input Stopped",
        description: "Voice recognition has been turned off.",
      })
    }
  }

  const clearTranscript = () => {
    setTranscript("")
    setInterimTranscript("")
    onTranscript?.("")
  }

  const toggleVoiceOutput = () => {
    setVoiceEnabled(!voiceEnabled)
    if (!voiceEnabled) {
      speak("Voice output enabled")
    }
  }

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardContent className="p-4 text-center">
          <MicOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Voice input not supported in this browser</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice Assistant
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleVoiceOutput} className="h-8 w-8 p-0">
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            {isListening && (
              <Badge className="bg-red-100 text-red-800 animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                Listening
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Click to speak your answers or use voice commands like "start quiz", "generate questions"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Controls */}
        <div className="flex gap-2">
          <Button
            onClick={isListening ? stopListening : startListening}
            className={`flex-1 ${isListening ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Start Voice Input
              </>
            )}
          </Button>

          {transcript && (
            <Button variant="outline" onClick={clearTranscript}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Transcript Display */}
        {(transcript || interimTranscript) && (
          <div className="space-y-2">
            <div className="bg-gray-50 border rounded-lg p-3 min-h-20">
              <div className="text-sm text-gray-600 mb-1">Transcript:</div>
              <div className="text-gray-900">
                {transcript}
                {interimTranscript && <span className="text-gray-500 italic">{interimTranscript}</span>}
              </div>
            </div>

            {confidence > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Confidence:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-green-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${confidence * 100}%` }}
                  ></div>
                </div>
                <span>{Math.round(confidence * 100)}%</span>
              </div>
            )}
          </div>
        )}

        {/* Voice Commands Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm font-medium text-blue-800 mb-2">Voice Commands:</div>
          <div className="grid grid-cols-2 gap-1 text-xs text-blue-700">
            <div>"Start quiz"</div>
            <div>"Generate questions"</div>
            <div>"Summarize notes"</div>
            <div>"Show progress"</div>
            <div>"Answer is [your answer]"</div>
            <div>"Clear text"</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for using voice input in components
export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")

  const handleTranscript = (text: string) => {
    setTranscript(text)
  }

  const handleCommand = (command: string, params?: any) => {
    // Handle voice commands
    console.log("Voice command:", command, params)
  }

  return {
    isListening,
    transcript,
    handleTranscript,
    handleCommand,
    clearTranscript: () => setTranscript(""),
  }
}
