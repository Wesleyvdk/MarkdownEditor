"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RAGPanel } from "@/components/rag-panel"
import { Brain, Sparkles, FileText, X, Loader2, Wand2, RefreshCw, Database } from "lucide-react"
import { searchRelevantContent, generateRAGContext } from "@/lib/rag-service"

interface AIDocumentGeneratorProps {
  onGenerate: (content: string, title: string) => void
  onClose: () => void
  currentContent?: string
  currentTitle?: string
  relatedNotes?: Array<{ id: string; title: string; content: string }>
}

const documentTemplates = [
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    description: "Structured meeting notes with agenda, discussion points, and action items",
    prompt:
      "Generate comprehensive meeting notes with the following structure: Meeting title, Date/Time, Attendees, Agenda items, Discussion points, Decisions made, Action items with owners and deadlines, and Next steps.",
  },
  {
    id: "research-summary",
    name: "Research Summary",
    description: "Academic-style research summary with key findings",
    prompt:
      "Create a detailed research summary including: Executive summary, Background/Context, Methodology, Key findings with supporting evidence, Analysis and insights, Conclusions, and Recommendations for further research.",
  },
  {
    id: "project-plan",
    name: "Project Plan",
    description: "Comprehensive project planning document",
    prompt:
      "Develop a complete project plan with: Project overview and objectives, Scope and deliverables, Timeline with milestones, Resource requirements, Risk assessment, Success metrics, and Implementation strategy.",
  },
  {
    id: "technical-doc",
    name: "Technical Documentation",
    description: "Technical documentation with code examples and explanations",
    prompt:
      "Write technical documentation including: Overview and purpose, Prerequisites and requirements, Step-by-step implementation guide, Code examples with explanations, Configuration details, Troubleshooting section, and Best practices.",
  },
  {
    id: "brainstorm",
    name: "Brainstorming Session",
    description: "Creative brainstorming document with ideas and concepts",
    prompt:
      "Create a brainstorming document with: Problem statement, Initial ideas and concepts, Categorized solutions, Pros and cons analysis, Creative alternatives, Implementation feasibility, and Next steps for evaluation.",
  },
  {
    id: "custom",
    name: "Custom Prompt",
    description: "Use your own custom prompt for document generation",
    prompt: "",
  },
]

export function AIDocumentGenerator({
  onGenerate,
  onClose,
  currentContent = "",
  currentTitle = "",
  relatedNotes = [],
}: AIDocumentGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [documentTitle, setDocumentTitle] = useState(currentTitle)
  const [additionalContext, setAdditionalContext] = useState("")
  const [ragContext, setRAGContext] = useState("")
  const [useRAG, setUseRAG] = useState(true)
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationMode, setGenerationMode] = useState<"new" | "continue" | "improve">(
    currentContent ? "continue" : "new",
  )

  const handleGenerate = async () => {
    setIsGenerating(true)

    try {
      // Simulate AI generation - replace with actual AI API call
      const template = documentTemplates.find((t) => t.id === selectedTemplate)
      const prompt = selectedTemplate === "custom" ? customPrompt : template?.prompt || ""

      let contextText = ""

      // Add RAG context if available
      if (useRAG && ragContext.trim()) {
        contextText += `\n\nRelevant context from your knowledge base:\n${ragContext}`
      }

      // Add manually selected notes context
      if (useRAG && selectedNotes.length > 0) {
        const noteContents = relatedNotes
          .filter((note) => selectedNotes.includes(note.id))
          .map((note) => `## ${note.title}\n${note.content}`)
          .join("\n\n")
        contextText += `\n\nContext from selected notes:\n${noteContents}`
      }

      if (additionalContext.trim()) {
        contextText += `\n\nAdditional context: ${additionalContext}`
      }

      let finalPrompt = ""
      if (generationMode === "new") {
        finalPrompt = `${prompt}\n\nTopic: ${documentTitle}${contextText}`
      } else if (generationMode === "continue") {
        finalPrompt = `Continue writing this document naturally, maintaining the same tone and style:\n\n${currentContent}\n\n${contextText}`
      } else if (generationMode === "improve") {
        finalPrompt = `Improve and enhance this document while maintaining its core message:\n\n${currentContent}\n\nFocus on: Better structure, clearer explanations, more engaging content${contextText}`
      }

      // Auto-retrieve relevant context if RAG is enabled and no manual context provided
      if (useRAG && !ragContext.trim() && documentTitle.trim()) {
        try {
          const ragResults = await searchRelevantContent(
            documentTitle,
            currentContent ? [relatedNotes.find((n) => n.content === currentContent)?.id].filter(Boolean) : [],
          )
          if (ragResults.length > 0) {
            const autoContext = generateRAGContext(ragResults.slice(0, 3)) // Use top 3 results
            contextText += `\n\nAuto-retrieved context:\n${autoContext}`
          }
        } catch (error) {
          console.error("Auto RAG retrieval failed:", error)
        }
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock generated content based on template
      let generatedContent = ""
      if (selectedTemplate === "meeting-notes") {
        generatedContent = `# ${documentTitle || "Meeting Notes"}

## Meeting Details
- **Date:** ${new Date().toLocaleDateString()}
- **Time:** TBD
- **Attendees:** [List attendees]

## Agenda
1. Review previous action items
2. Main discussion topics
3. Decision points
4. Next steps

## Discussion Points
- Key topic 1: [Discussion summary]
- Key topic 2: [Discussion summary]
- Key topic 3: [Discussion summary]

## Decisions Made
- Decision 1: [Details and rationale]
- Decision 2: [Details and rationale]

## Action Items
- [ ] Action item 1 - **Owner:** [Name] - **Due:** [Date]
- [ ] Action item 2 - **Owner:** [Name] - **Due:** [Date]
- [ ] Action item 3 - **Owner:** [Name] - **Due:** [Date]

## Next Steps
- Schedule follow-up meeting
- Review progress on action items
- Prepare for next phase

---
*Generated with AI assistance using RAG context*`
      } else if (selectedTemplate === "research-summary") {
        generatedContent = `# ${documentTitle || "Research Summary"}

## Executive Summary
[Brief overview of the research findings and key insights]

## Background & Context
[Relevant background information and context for the research]

## Methodology
[Description of research methods and approach used]

## Key Findings
### Finding 1
[Detailed explanation with supporting evidence]

### Finding 2
[Detailed explanation with supporting evidence]

### Finding 3
[Detailed explanation with supporting evidence]

## Analysis & Insights
[Deep analysis of the findings and their implications]

## Conclusions
[Summary of conclusions drawn from the research]

## Recommendations
1. [Recommendation 1 with rationale]
2. [Recommendation 2 with rationale]
3. [Recommendation 3 with rationale]

## Further Research
[Suggestions for additional research areas]

---
*Generated with AI assistance using RAG context*`
      } else {
        generatedContent = `# ${documentTitle || "AI Generated Document"}

This document was generated based on your prompt: "${prompt}"

${ragContext ? `\n## Context Integration\nThis document incorporates relevant information from your existing notes to provide comprehensive coverage of the topic.\n` : ""}

## Introduction
[AI-generated introduction based on your requirements and available context]

## Main Content
[AI-generated main content sections enhanced with insights from your knowledge base]

## Key Points
- Point 1: [AI-generated content with contextual relevance]
- Point 2: [AI-generated content with contextual relevance]
- Point 3: [AI-generated content with contextual relevance]

## Conclusion
[AI-generated conclusion that ties together the prompt and contextual information]

---
*Generated with AI assistance using RAG context from ${ragContext ? "your knowledge base" : "available information"}*`
      }

      if (generationMode === "continue") {
        generatedContent = currentContent + "\n\n" + generatedContent
      }

      onGenerate(generatedContent, documentTitle || "AI Generated Document")
    } catch (error) {
      console.error("Generation failed:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes((prev) => (prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]))
  }

  const handleRAGContextSelect = (context: string) => {
    setRAGContext(context)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">AI Document Generator</h2>
              <p className="text-sm text-muted-foreground">Generate or enhance documents with AI assistance and RAG</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="generate" className="h-full flex">
            {/* Sidebar */}
            <div className="w-64 border-r border-border bg-sidebar">
              <TabsList className="flex flex-col h-auto w-full bg-transparent p-2 space-y-1">
                <TabsTrigger value="generate" className="w-full justify-start">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </TabsTrigger>
                <TabsTrigger value="rag" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  RAG Search
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <TabsContent value="generate" className="mt-0 h-full">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-6">
                    {/* Generation Mode */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wand2 className="h-5 w-5" />
                          Generation Mode
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <Button
                            variant={generationMode === "new" ? "default" : "outline"}
                            onClick={() => setGenerationMode("new")}
                            className="h-auto p-4 flex flex-col items-center gap-2"
                          >
                            <Sparkles className="h-5 w-5" />
                            <div className="text-center">
                              <div className="font-medium">New Document</div>
                              <div className="text-xs text-muted-foreground">Create from scratch</div>
                            </div>
                          </Button>
                          <Button
                            variant={generationMode === "continue" ? "default" : "outline"}
                            onClick={() => setGenerationMode("continue")}
                            className="h-auto p-4 flex flex-col items-center gap-2"
                            disabled={!currentContent}
                          >
                            <FileText className="h-5 w-5" />
                            <div className="text-center">
                              <div className="font-medium">Continue Writing</div>
                              <div className="text-xs text-muted-foreground">Extend current content</div>
                            </div>
                          </Button>
                          <Button
                            variant={generationMode === "improve" ? "default" : "outline"}
                            onClick={() => setGenerationMode("improve")}
                            className="h-auto p-4 flex flex-col items-center gap-2"
                            disabled={!currentContent}
                          >
                            <RefreshCw className="h-5 w-5" />
                            <div className="text-center">
                              <div className="font-medium">Improve Content</div>
                              <div className="text-xs text-muted-foreground">Enhance existing text</div>
                            </div>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Document Title */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Document Title</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Input
                          value={documentTitle}
                          onChange={(e) => setDocumentTitle(e.target.value)}
                          placeholder="Enter document title..."
                        />
                      </CardContent>
                    </Card>

                    {/* Template Selection */}
                    {generationMode === "new" && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Document Template</CardTitle>
                          <CardDescription>Choose a template or use a custom prompt</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template..." />
                            </SelectTrigger>
                            <SelectContent>
                              {documentTemplates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {selectedTemplate && (
                            <div className="p-4 bg-muted/50 rounded-lg">
                              <h4 className="font-medium mb-2">
                                {documentTemplates.find((t) => t.id === selectedTemplate)?.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {documentTemplates.find((t) => t.id === selectedTemplate)?.description}
                              </p>
                            </div>
                          )}

                          {selectedTemplate === "custom" && (
                            <div className="space-y-2">
                              <Label htmlFor="custom-prompt">Custom Prompt</Label>
                              <Textarea
                                id="custom-prompt"
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="Describe what kind of document you want to generate..."
                                rows={4}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* RAG Context Display */}
                    {ragContext && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            RAG Context Selected
                          </CardTitle>
                          <CardDescription>Context from your knowledge base will be used</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="p-3 bg-muted/50 rounded-lg max-h-40 overflow-y-auto">
                            <pre className="text-sm whitespace-pre-wrap">{ragContext.substring(0, 500)}...</pre>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 bg-transparent"
                            onClick={() => setRAGContext("")}
                          >
                            Clear RAG Context
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Additional Context */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Additional Context</CardTitle>
                        <CardDescription>Provide extra information to guide the AI generation</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={additionalContext}
                          onChange={(e) => setAdditionalContext(e.target.value)}
                          placeholder="Add any specific requirements, constraints, or additional information..."
                          rows={3}
                        />
                      </CardContent>
                    </Card>

                    {/* Manual Note Selection */}
                    {relatedNotes.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Manual Note Selection
                          </CardTitle>
                          <CardDescription>Manually select specific notes to include as context</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Select notes to include:</Label>
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                              {relatedNotes.map((note) => (
                                <div
                                  key={note.id}
                                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                    selectedNotes.includes(note.id)
                                      ? "border-primary bg-primary/10"
                                      : "border-border hover:bg-muted/50"
                                  }`}
                                  onClick={() => toggleNoteSelection(note.id)}
                                >
                                  <div className="font-medium text-sm">{note.title}</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {note.content.substring(0, 100)}...
                                  </div>
                                </div>
                              ))}
                            </div>
                            {selectedNotes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {selectedNotes.map((noteId) => {
                                  const note = relatedNotes.find((n) => n.id === noteId)
                                  return (
                                    <Badge key={noteId} variant="secondary" className="text-xs">
                                      {note?.title}
                                    </Badge>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="rag" className="mt-0 h-full">
                <RAGPanel
                  currentNoteId={relatedNotes.find((n) => n.content === currentContent)?.id}
                  onContextSelect={handleRAGContextSelect}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {generationMode === "new" && selectedTemplate && "Template selected"}
            {generationMode === "continue" && "Will continue from current content"}
            {generationMode === "improve" && "Will enhance current content"}
            {ragContext && " • RAG context ready"}
            {selectedNotes.length > 0 && ` • ${selectedNotes.length} notes selected`}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isGenerating}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                (generationMode === "new" && !selectedTemplate) ||
                (selectedTemplate === "custom" && !customPrompt.trim())
              }
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Document
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
