"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import { ScrollArea } from "~/components/ui/scroll-area"
import { TagManager } from "~/components/tag-manager"
import { AISettings } from "~/components/ai-settings"
import { AdminDashboard } from "~/components/admin-dashboard"
import { Search, FileText, Tag, Plus, Hash, Link2, Settings, ArrowRight, Filter, X, Brain, Shield } from "lucide-react"

interface SidebarProps {
  onNoteSelect: (noteId: string) => void
  selectedNote: string | null
}

// Mock data - will be replaced with real data later
const mockNotes = [
  { id: "1", title: "Getting Started", tags: ["tutorial", "basics"], lastModified: "2024-01-15" },
  { id: "2", title: "Project Ideas", tags: ["brainstorm", "projects"], lastModified: "2024-01-14" },
  { id: "3", title: "Meeting Notes", tags: ["work", "meetings"], lastModified: "2024-01-13" },
  { id: "4", title: "Daily Journal", tags: ["personal", "reflection"], lastModified: "2024-01-12" },
  { id: "5", title: "Research Notes", tags: ["research", "academic", "tutorial"], lastModified: "2024-01-11" },
]

const mockTags = [
  "tutorial",
  "basics",
  "brainstorm",
  "projects",
  "work",
  "meetings",
  "personal",
  "reflection",
  "research",
  "academic",
]

const mockLinkedNotes = [
  { from: "Getting Started", to: "Project Ideas", type: "outgoing" },
  { from: "Getting Started", to: "Meeting Notes", type: "outgoing" },
  { from: "Project Ideas", to: "Getting Started", type: "incoming" },
  { from: "Meeting Notes", to: "Getting Started", type: "incoming" },
]

export function Sidebar({ onNoteSelect, selectedNote }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"notes" | "tags" | "links">("notes")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showTagManager, setShowTagManager] = useState(false)
  const [showAISettings, setShowAISettings] = useState(false)
  const [showAdminDashboard, setShowAdminDashboard] = useState(false)

  const filteredNotes = mockNotes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesTags =
      selectedTags.length === 0 || selectedTags.every((selectedTag) => note.tags.includes(selectedTag))

    return matchesSearch && matchesTags
  })

  const filteredLinks = mockLinkedNotes.filter(
    (link) =>
      link.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.to.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const clearTagFilters = () => {
    setSelectedTags([])
  }

  const getTagStats = (tag: string) => {
    return mockNotes.filter((note) => note.tags.includes(tag)).length
  }

  const filteredTags = mockTags.filter((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes and tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 search-input"
          />
        </div>

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <Filter className="h-3 w-3 text-muted-foreground" />
            {selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="default"
                className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => toggleTagFilter(tag)}
              >
                {tag} <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearTagFilters} className="h-5 px-2 text-xs">
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-sidebar-border">
        <Button
          variant={activeTab === "notes" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("notes")}
          className="flex-1 rounded-none"
        >
          <FileText className="h-4 w-4 mr-2" />
          Notes
          {selectedTags.length > 0 && (
            <Badge variant="outline" className="ml-2 text-xs">
              {filteredNotes.length}
            </Badge>
          )}
        </Button>
        <Button
          variant={activeTab === "tags" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("tags")}
          className="flex-1 rounded-none"
        >
          <Tag className="h-4 w-4 mr-2" />
          Tags
        </Button>
        <Button
          variant={activeTab === "links" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("links")}
          className="flex-1 rounded-none"
        >
          <Link2 className="h-4 w-4 mr-2" />
          Links
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {activeTab === "notes" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-sidebar-foreground">
                  Notes {selectedTags.length > 0 && `(${filteredNotes.length})`}
                </h3>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => onNoteSelect(note.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedNote === note.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-primary"
                  }`}
                >
                  <div className="font-medium text-sm mb-1">{note.title}</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {note.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "secondary"}
                        className="text-xs cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTagFilter(tag)
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">{note.lastModified}</div>
                </div>
              ))}
              {filteredNotes.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  {selectedTags.length > 0 ? "No notes match the selected tags" : "No notes found"}
                </div>
              )}
            </div>
          )}

          {activeTab === "tags" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-sidebar-foreground">Tags</h3>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowTagManager(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {filteredTags.map((tag) => {
                const noteCount = getTagStats(tag)
                const isSelected = selectedTags.includes(tag)

                return (
                  <div
                    key={tag}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-accent text-accent-foreground" : "hover:bg-sidebar-primary"
                    }`}
                    onClick={() => toggleTagFilter(tag)}
                  >
                    <Hash className={`h-4 w-4 ${isSelected ? "text-accent-foreground" : "text-accent"}`} />
                    <span className="text-sm flex-1">{tag}</span>
                    <Badge variant="outline" className="text-xs">
                      {noteCount}
                    </Badge>
                  </div>
                )
              })}

              {filteredTags.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">No tags found</div>
              )}

              <div className="mt-6 p-3 bg-muted/50 rounded-lg">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Statistics</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Total tags:</span>
                    <span className="font-medium">{mockTags.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active filters:</span>
                    <span className="font-medium">{selectedTags.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Filtered notes:</span>
                    <span className="font-medium">{filteredNotes.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "links" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-sidebar-foreground">Linked Notes</h3>
                <Badge variant="outline" className="text-xs">
                  {filteredLinks.length}
                </Badge>
              </div>
              {filteredLinks.length > 0 ? (
                filteredLinks.map((link, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-lg hover:bg-sidebar-primary cursor-pointer"
                    onClick={() => {
                      const targetNote = mockNotes.find((note) => note.title === link.to)
                      if (targetNote) onNoteSelect(targetNote.id)
                    }}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-foreground">{link.from}</span>
                      <ArrowRight className="h-3 w-3 text-accent" />
                      <span className="text-accent font-medium">{link.to}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No linked notes yet. Create links using [[note-title]] syntax in your notes.
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Settings */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setShowAISettings(true)}>
          <Brain className="h-4 w-4 mr-2" />
          AI Settings
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setShowAdminDashboard(true)}>
          <Shield className="h-4 w-4 mr-2" />
          Admin Dashboard
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {showTagManager && <TagManager tags={mockTags} notes={mockNotes} onClose={() => setShowTagManager(false)} />}
      {showAISettings && <AISettings onClose={() => setShowAISettings(false)} />}
      {showAdminDashboard && <AdminDashboard onClose={() => setShowAdminDashboard(false)} />}
    </div>
  )
}
