"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Send, 
  X, 
  Bot, 
  User, 
  Sparkles,
  FileText,
  Network,
  Lightbulb,
  Copy,
  Check
} from 'lucide-react'
import { aiService } from '../lib/ai-service'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIChatboxProps {
  isOpen: boolean
  onClose: () => void
  onInsertContent: (content: string) => void
  currentNoteTitle?: string
  currentNoteContent?: string
  relatedNotes?: Array<{ id: string; title: string; content: string }>
}

const PRE_WRITTEN_PROMPTS = [
  {
    id: 'document-about',
    icon: <FileText className="h-4 w-4" />,
    label: 'Write Document About...',
    prompt: 'Write a comprehensive document about [TOPIC]. Include an introduction, main sections with detailed explanations, examples where relevant, and a conclusion. Format it in markdown with proper headings and structure.',
    category: 'Documentation'
  },
  {
    id: 'design-document',
    icon: <Network className="h-4 w-4" />,
    label: 'Design Document',
    prompt: 'Create a detailed design document that connects multiple aspects of a project. Include: 1) Project Overview, 2) Architecture Design, 3) Component Breakdown, 4) Implementation Plan, 5) Testing Strategy, and 6) Deployment Notes. Use proper markdown formatting and create logical connections between different sections.',
    category: 'Design'
  },
  {
    id: 'project-structure',
    icon: <Network className="h-4 w-4" />,
    label: 'Project Structure',
    prompt: 'Generate a main project document that connects and organizes multiple related documents. Create a hierarchical structure showing how different documents relate to each other, include document summaries, and provide navigation links between sections.',
    category: 'Organization'
  },
  {
    id: 'meeting-notes',
    icon: <FileText className="h-4 w-4" />,
    label: 'Meeting Notes Template',
    prompt: 'Create a meeting notes template with sections for: Date & Time, Attendees, Agenda Items, Discussion Points, Action Items, Decisions Made, and Next Steps. Format it professionally in markdown.',
    category: 'Templates'
  },
  {
    id: 'brainstorm',
    icon: <Lightbulb className="h-4 w-4" />,
    label: 'Brainstorm Ideas',
    prompt: 'Help me brainstorm ideas related to the current topic. Provide creative suggestions, different perspectives, and actionable next steps. Organize the ideas in a structured format with categories and priorities.',
    category: 'Creative'
  },
  {
    id: 'expand-content',
    icon: <Sparkles className="h-4 w-4" />,
    label: 'Expand Current Content',
    prompt: 'Expand on the current document content. Add more detail, provide examples, include relevant sections that might be missing, and improve the overall structure while maintaining the original intent.',
    category: 'Enhancement'
  }
]

export function AIChatbox({ 
  isOpen, 
  onClose, 
  onInsertContent,
  currentNoteTitle,
  currentNoteContent,
  relatedNotes = []
}: AIChatboxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const categories = ['all', ...new Set(PRE_WRITTEN_PROMPTS.map(p => p.category))]

  const filteredPrompts = selectedCategory === 'all' 
    ? PRE_WRITTEN_PROMPTS 
    : PRE_WRITTEN_PROMPTS.filter(p => p.category === selectedCategory)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Prepare context for AI
      let contextPrompt = content

      // Add current note context if available
      if (currentNoteTitle && currentNoteContent) {
        contextPrompt += `\n\nCurrent Note Context:\nTitle: ${currentNoteTitle}\nContent: ${currentNoteContent.slice(0, 500)}...`
      }

      // Add related notes context if available
      if (relatedNotes.length > 0) {
        const relatedContext = relatedNotes
          .slice(0, 3) // Limit to 3 related notes to avoid token limits
          .map(note => `- ${note.title}: ${note.content.slice(0, 200)}...`)
          .join('\n')
        contextPrompt += `\n\nRelated Notes:\n${relatedContext}`
      }

      const response = await aiService.generateText({
        prompt: contextPrompt,
        systemPrompt: 'You are a helpful AI assistant specialized in creating and organizing markdown documents. Provide clear, well-structured responses in markdown format when appropriate. Be concise but comprehensive.',
        temperature: 0.7,
        maxTokens: 2048
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI generation failed:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while generating a response. Please check your AI configuration and try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputValue)
    }
  }

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const insertIntoDocument = (content: string) => {
    onInsertContent(content)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl h-[80vh] mx-4 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Assistant
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4">
          {/* Messages Area */}
          <ScrollArea className="flex-1 border rounded-md p-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium mb-2">Ready to help!</p>
                <p className="text-sm">Choose a pre-written prompt below or ask me anything.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      
                      <div className={`rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}>
                        <div className="prose prose-sm max-w-none">
                          {message.role === 'assistant' ? (
                            <div 
                              className="markdown-content"
                              dangerouslySetInnerHTML={{ 
                                __html: message.content.replace(/\n/g, '<br/>') 
                              }} 
                            />
                          ) : (
                            <p className="m-0">{message.content}</p>
                          )}
                        </div>
                        
                        {message.role === 'assistant' && (
                          <div className="flex gap-2 mt-3 pt-2 border-t border-border/20">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => copyToClipboard(message.content, message.id)}
                            >
                              {copiedId === message.id ? (
                                <><Check className="h-3 w-3 mr-1" />Copied</>
                              ) : (
                                <><Copy className="h-3 w-3 mr-1" />Copy</>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => insertIntoDocument(message.content)}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Insert
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="h-4 w-4 animate-pulse" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Pre-written Prompts */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Quick Prompts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredPrompts.map((prompt) => (
                <Button
                  key={prompt.id}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => handlePromptClick(prompt.prompt)}
                >
                  <div className="flex items-start gap-2 w-full">
                    {prompt.icon}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{prompt.label}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {prompt.prompt.slice(0, 80)}...
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything or use a prompt above..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={() => handleSendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}