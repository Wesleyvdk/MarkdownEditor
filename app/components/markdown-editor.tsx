"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LinkAutocomplete } from "@/components/link-autocomplete"
import { LinkVisualization } from "@/components/link-visualization"
import { AIDocumentGenerator } from "@/components/ai-document-generator"
import {
  Save,
  Network,
  Type,
  Bold,
  Italic,
  Link,
  List,
  Quote,
  Code,
  Hash,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface MarkdownEditorProps {
  noteId: string
}

// Mock note data - will be replaced with real data later
const mockNote = {
  id: "1",
  title: "Getting Started",
  content: `# Getting Started

Welcome to your new **markdown editor**! This is where you can write and organize your thoughts.

## Features

- **Split view** with live preview
- **Bidirectional linking** using [[note-title]] syntax
- **Tag management** for organization
- **Search functionality** across all notes

## Writing Tips

Use \`markdown syntax\` to format your text:

- *Italic text* with single asterisks
- **Bold text** with double asterisks
- \`Inline code\` with backticks

> This is a blockquote for important information

### Code Blocks

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

## Links and References

You can link to other notes using [[Project Ideas]] syntax. These will become clickable links once the notes exist.

Try linking to [[Meeting Notes]] or create a new note by typing [[New Note Title]].

Happy writing!`,
  tags: ["tutorial", "basics"],
  lastModified: "2024-01-15",
}

// Mock notes for linking
const mockNotes = [
  { id: "1", title: "Getting Started", content: mockNote.content },
  { id: "2", title: "Project Ideas", content: "# Project Ideas\n\nList of potential projects..." },
  { id: "3", title: "Meeting Notes", content: "# Meeting Notes\n\nNotes from recent meetings..." },
  { id: "4", title: "Daily Journal", content: "# Daily Journal\n\nDaily thoughts and reflections..." },
  { id: "5", title: "Research Notes", content: "# Research Notes\n\nResearch findings and references..." },
]

export function MarkdownEditor({ noteId }: MarkdownEditorProps) {
  const [title, setTitle] = useState(mockNote.title)
  const [content, setContent] = useState(mockNote.content)
  const [tags, setTags] = useState(mockNote.tags)
  const [showLinkViz, setShowLinkViz] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [autocompletePosition, setAutocompletePosition] = useState<{ x: number; y: number } | null>(null)
  const [autocompleteQuery, setAutocompleteQuery] = useState("")
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null)
  const [lines, setLines] = useState<string[]>([])
  const [editingCodeBlock, setEditingCodeBlock] = useState<{ start: number; end: number } | null>(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLines(content.split("\n"))
  }, [content])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setShowLinkViz(false) // Hide link viz on mobile by default
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const getCodeBlockRange = (lineIndex: number): { start: number; end: number } | null => {
    let start = -1
    let end = -1

    // Find the start of the code block (looking backwards)
    for (let i = lineIndex; i >= 0; i--) {
      if (lines[i].trim().startsWith("```")) {
        start = i
        break
      }
    }

    // If we found a start, find the end (looking forwards)
    if (start !== -1) {
      for (let i = start + 1; i < lines.length; i++) {
        if (lines[i].trim().startsWith("```")) {
          end = i
          break
        }
      }
    }

    return start !== -1 && end !== -1 ? { start, end } : null
  }

  const markdownToHtml = (markdown: string) => {
    return markdown
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 text-foreground">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3 text-foreground">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2 text-foreground">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(
        /^> (.*$)/gm,
        '<blockquote class="border-l-4 border-accent pl-4 italic text-muted-foreground my-4">$1</blockquote>',
      )
      .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        const highlightedCode = highlightCode(code.trim(), language || "text")
        return `<div class="code-block my-4">
          <div class="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">${language || "text"}</div>
          <pre class="overflow-x-auto"><code>${highlightedCode}</code></pre>
        </div>`
      })
      .replace(/\[\[(.*?)\]\]/g, (match, linkText) => {
        const noteExists = mockNotes.some((note) => note.title.toLowerCase() === linkText.toLowerCase())
        const className = noteExists
          ? "text-accent hover:text-accent/80 cursor-pointer font-medium underline decoration-dotted"
          : "text-muted-foreground hover:text-accent cursor-pointer font-medium underline decoration-dashed"
        return `<span class="${className}" data-link="${linkText}">${linkText}</span>`
      })
  }

  const highlightCode = (code: string, language: string) => {
    const lines = code.split("\n")

    const highlightLine = (line: string, lang: string) => {
      if (lang === "javascript" || lang === "js" || lang === "typescript" || lang === "ts") {
        return line
          .replace(
            /\b(function|const|let|var|if|else|for|while|return|import|export|class|extends|async|await|try|catch|finally)\b/g,
            '<span class="token keyword">$1</span>',
          )
          .replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="token string">$1$2$1</span>')
          .replace(/\b(\d+\.?\d*)\b/g, '<span class="token number">$1</span>')
          .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, '<span class="token function">$1</span>')
          .replace(/(\/\/.*$)/gm, '<span class="token comment">$1</span>')
          .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token comment">$1</span>')
          .replace(/([+\-*/%=<>!&|?:;,.])/g, '<span class="token operator">$1</span>')
          .replace(/\b(true|false)\b/g, '<span class="token boolean">$1</span>')
          .replace(/\b(null|undefined)\b/g, '<span class="token null">$1</span>')
      } else if (lang === "css") {
        return line
          .replace(/([a-zA-Z-]+)(?=\s*:)/g, '<span class="token property">$1</span>')
          .replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="token string">$1$2$1</span>')
          .replace(/\b(\d+(?:px|em|rem|%|vh|vw|deg)?)\b/g, '<span class="token number">$1</span>')
          .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token comment">$1</span>')
          .replace(/([{}();,:])/g, '<span class="token punctuation">$1</span>')
      } else if (lang === "html" || lang === "xml") {
        return line
          .replace(/(<\/?[a-zA-Z][^>]*>)/g, '<span class="token keyword">$1</span>')
          .replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="token string">$1$2$1</span>')
          .replace(/(<!--[\s\S]*?-->)/g, '<span class="token comment">$1</span>')
      }
      return line
    }

    return lines
      .map((line, index) => {
        const lineNumber = `<span class="line-number">${(index + 1).toString().padStart(2, " ")}</span>`
        const highlightedLine = highlightLine(line, language)
        return `${lineNumber}${highlightedLine}`
      })
      .join("\n")
  }

  const handleLineClick = (lineIndex: number, e: React.MouseEvent) => {
    const target = e.target as HTMLElement

    if (target.hasAttribute("data-link")) {
      const linkText = target.getAttribute("data-link")
      const linkedNote = mockNotes.find((note) => note.title.toLowerCase() === linkText?.toLowerCase())
      if (linkedNote) {
        console.log("Navigate to note:", linkedNote.id)
      } else {
        console.log("Create new note:", linkText)
      }
      return
    }

    const codeBlockRange = getCodeBlockRange(lineIndex)
    if (codeBlockRange) {
      setEditingCodeBlock(codeBlockRange)
      setEditingLineIndex(lineIndex)
    } else {
      setEditingCodeBlock(null)
      setEditingLineIndex(lineIndex)
    }

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }, 0)
  }

  const handleLineChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (editingLineIndex === null) return

    const newLineContent = e.target.value
    const newLines = [...lines]
    newLines[editingLineIndex] = newLineContent
    setLines(newLines)
    setContent(newLines.join("\n"))

    const textarea = e.target
    const cursorPosition = textarea.selectionStart
    const textBeforeCursor = newLineContent.substring(0, cursorPosition)

    const linkMatch = textBeforeCursor.match(/\[\[([^\]]*?)$/)

    if (linkMatch) {
      const query = linkMatch[1]
      setAutocompleteQuery(query)

      const rect = textarea.getBoundingClientRect()
      const textMetrics = getTextMetrics(textBeforeCursor, textarea)
      setAutocompletePosition({
        x: rect.left + textMetrics.width,
        y: rect.top + textMetrics.height,
      })
    } else {
      setAutocompletePosition(null)
      setAutocompleteQuery("")
    }
  }

  const handleLineBlur = () => {
    setTimeout(() => {
      if (!autocompletePosition) {
        setEditingLineIndex(null)
        setEditingCodeBlock(null)
      }
    }, 150)
  }

  const handleLineKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (editingLineIndex === null) return

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const newLines = [...lines]
      newLines.splice(editingLineIndex + 1, 0, "")
      setLines(newLines)
      setContent(newLines.join("\n"))
      setEditingLineIndex(editingLineIndex + 1)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
        }
      }, 0)
    } else if (e.key === "ArrowUp" && editingLineIndex > 0) {
      e.preventDefault()
      setEditingLineIndex(editingLineIndex - 1)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length)
        }
      }, 0)
    } else if (e.key === "ArrowDown" && editingLineIndex < lines.length - 1) {
      e.preventDefault()
      setEditingLineIndex(editingLineIndex + 1)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(0, 0)
        }
      }, 0)
    } else if (e.key === "Escape") {
      setEditingLineIndex(null)
      setAutocompletePosition(null)
      setEditingCodeBlock(null)
    }
  }

  const getTextMetrics = (text: string, textarea: HTMLTextAreaElement) => {
    const lines = text.split("\n")
    const lineHeight = 20 // approximate
    const charWidth = 8 // approximate for monospace
    const lastLine = lines[lines.length - 1]

    return {
      width: Math.min(lastLine.length * charWidth, textarea.clientWidth - 20),
      height: (lines.length - 1) * lineHeight + 20,
    }
  }

  const handleAutocompleteSelect = (noteTitle: string) => {
    if (!textareaRef.current || editingLineIndex === null) return

    const textarea = textareaRef.current
    const cursorPosition = textarea.selectionStart
    const lineContent = lines[editingLineIndex]
    const textBeforeCursor = lineContent.substring(0, cursorPosition)
    const textAfterCursor = lineContent.substring(cursorPosition)

    const linkMatch = textBeforeCursor.match(/^(.*)\[\[([^\]]*?)$/s)
    if (linkMatch) {
      const beforeLink = linkMatch[1]
      const newLineContent = beforeLink + `[[${noteTitle}]]` + textAfterCursor
      const newLines = [...lines]
      newLines[editingLineIndex] = newLineContent
      setLines(newLines)
      setContent(newLines.join("\n"))

      setTimeout(() => {
        const newCursorPos = beforeLink.length + noteTitle.length + 4
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)
    }

    setAutocompletePosition(null)
    setAutocompleteQuery("")
  }

  const getLinkedNotes = () => {
    const linkMatches = content.match(/\[\[(.*?)\]\]/g) || []
    return linkMatches.map((match) => {
      const linkText = match.slice(2, -2)
      const linkedNote = mockNotes.find((note) => note.title.toLowerCase() === linkText.toLowerCase())
      return {
        title: linkText,
        exists: !!linkedNote,
        id: linkedNote?.id,
      }
    })
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const insertMarkdown = (syntax: string) => {
    if (!textareaRef.current || editingLineIndex === null) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const lineContent = lines[editingLineIndex]
    const selectedText = lineContent.substring(start, end)

    let newText = ""
    if (syntax === "[[]]") {
      newText = `[[${selectedText}]]`
    } else if (syntax.includes("**") || syntax.includes("*") || syntax.includes("`")) {
      const marker = syntax.replace(/\w+/g, "")
      newText = `${marker}${selectedText || syntax.replace(/[*`]/g, "")}${marker}`
    } else {
      newText = syntax + selectedText
    }

    const newLineContent = lineContent.substring(0, start) + newText + lineContent.substring(end)
    const newLines = [...lines]
    newLines[editingLineIndex] = newLineContent
    setLines(newLines)
    setContent(newLines.join("\n"))

    setTimeout(() => {
      const newCursorPos = start + newText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }

  const handleAIGenerate = (generatedContent: string, generatedTitle: string) => {
    setContent(generatedContent)
    setTitle(generatedTitle)
    setLines(generatedContent.split("\n"))
    setShowAIGenerator(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-border">
        <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg md:text-xl font-semibold border-none shadow-none p-0 focus-visible:ring-0"
            placeholder="Note title..."
          />
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAIGenerator(true)}
              className="h-8 w-8 md:h-9 md:w-9 p-0"
            >
              <Brain className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 md:h-9 md:w-9 p-0">
              <Save className="h-4 w-4" />
            </Button>
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLinkViz(!showLinkViz)}
                className="h-8 w-8 md:h-9 md:w-9 p-0"
              >
                <Network className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1 md:gap-2 flex-wrap">
          {tags.slice(0, isMobile ? 3 : tags.length).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground text-xs"
              onClick={() => removeTag(tag)}
            >
              {tag} ×
            </Badge>
          ))}
          {isMobile && tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 3}
            </Badge>
          )}
          <div className="flex items-center gap-1 md:gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTag()}
              placeholder="Add tag..."
              className="w-20 md:w-24 h-6 text-xs"
            />
            <Button size="sm" variant="ghost" onClick={addTag} className="h-6 px-2">
              <Hash className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Toolbar Toggle */}
      {isMobile && editingLineIndex !== null && (
        <div className="p-2 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowToolbar(!showToolbar)}
            className="w-full justify-between text-xs"
          >
            <span>Formatting Tools</span>
            {showToolbar ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Toolbar - responsive visibility */}
      {editingLineIndex !== null && (!isMobile || showToolbar) && (
        <div className="p-2 border-b border-border">
          <div className="flex items-center gap-1 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => setShowAIGenerator(true)} className="h-8 px-2">
              <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
              {!isMobile && <span className="ml-1 text-xs">AI</span>}
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("**bold**")} className="h-8 px-2">
              <Bold className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("*italic*")} className="h-8 px-2">
              <Italic className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("`code`")} className="h-8 px-2">
              <Code className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("# ")} className="h-8 px-2">
              <Type className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("- ")} className="h-8 px-2">
              <List className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("> ")} className="h-8 px-2">
              <Quote className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("[[]]")} className="h-8 px-2">
              <Link className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className={`${showLinkViz && !isMobile ? "w-2/3" : "w-full"} relative`}>
          <div className="w-full h-full p-3 md:p-4 overflow-auto" ref={editorRef}>
            {lines.length === 0 && (
              <div
                className="text-muted-foreground italic cursor-text hover:bg-muted/20 transition-colors p-2 rounded text-sm md:text-base"
                onClick={() => {
                  setLines([""])
                  setEditingLineIndex(0)
                }}
              >
                Click here to start writing your note...
              </div>
            )}

            {lines.map((line, index) => (
              <div key={index} className="min-h-[1.5rem] leading-relaxed">
                {editingLineIndex === index ? (
                  <textarea
                    ref={textareaRef}
                    value={line}
                    onChange={handleLineChange}
                    onBlur={handleLineBlur}
                    onKeyDown={handleLineKeyDown}
                    className="w-full resize-none border-none outline-none bg-background text-foreground font-mono text-sm leading-relaxed min-h-[1.5rem] p-0"
                    style={{ height: "auto" }}
                    rows={1}
                    autoFocus
                  />
                ) : (
                  <div
                    className="cursor-text hover:bg-muted/20 transition-colors p-1 -m-1 rounded min-h-[1.5rem] touch-manipulation"
                    onClick={(e) => handleLineClick(index, e)}
                  >
                    {line.trim() === "" ? (
                      <span className="text-muted-foreground/50">&nbsp;</span>
                    ) : editingCodeBlock && index >= editingCodeBlock.start && index <= editingCodeBlock.end ? (
                      <div className="font-mono text-xs md:text-sm text-muted-foreground bg-muted/30 px-2 py-1 rounded overflow-x-auto">
                        {line}
                      </div>
                    ) : (
                      <div
                        className="prose prose-sm max-w-none [&>*]:text-sm md:[&>*]:text-base [&_pre]:overflow-x-auto [&_code]:text-xs md:[&_code]:text-sm"
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(line) }}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {autocompletePosition && (
            <LinkAutocomplete
              position={autocompletePosition}
              query={autocompleteQuery}
              notes={mockNotes}
              onSelect={handleAutocompleteSelect}
              onClose={() => setAutocompletePosition(null)}
            />
          )}
        </div>

        {/* Link Visualization - hidden on mobile */}
        {showLinkViz && !isMobile && (
          <div className="w-1/3 bg-muted/30 border-l border-border">
            <LinkVisualization
              currentNote={{ id: noteId, title }}
              linkedNotes={getLinkedNotes()}
              allNotes={mockNotes}
            />
          </div>
        )}
      </div>

      {/* AI Document Generator modal */}
      {showAIGenerator && (
        <AIDocumentGenerator
          onGenerate={handleAIGenerate}
          onClose={() => setShowAIGenerator(false)}
          currentContent={content}
          currentTitle={title}
          relatedNotes={mockNotes}
        />
      )}
    </div>
  )
}
