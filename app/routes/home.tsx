"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { NotesList } from "@/components/notes-list"
import { MarkdownEditor } from "@/components/markdown-editor"
import { Button } from "@/components/ui/button"
import { PanelLeftOpen, PanelLeftClose } from "lucide-react"

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 overflow-hidden border-r border-border`}
      >
        <Sidebar onNoteSelect={setSelectedNote} selectedNote={selectedNote} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
          <h1 className="text-lg font-semibold">Markdown Editor</h1>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {selectedNote ? <MarkdownEditor noteId={selectedNote} /> : <NotesList onNoteSelect={setSelectedNote} />}
        </div>
      </div>
    </div>
  )
}
