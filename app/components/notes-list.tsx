"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, FileText, Filter, SortAsc, SortDesc, Calendar, Hash, X } from "lucide-react"

interface NotesListProps {
  onNoteSelect: (noteId: string) => void
  onCreateNote?: () => void
}

// Mock data - will be replaced with real data later
const mockNotes = [
  {
    id: "1",
    title: "Getting Started",
    content: "Welcome to your new markdown editor! This is where you can write and organize your thoughts.",
    tags: ["tutorial", "basics"],
    lastModified: "2024-01-15",
    wordCount: 156,
  },
  {
    id: "2",
    title: "Project Ideas",
    content:
      "Here are some interesting project ideas to explore: 1. Build a personal dashboard 2. Create a habit tracker",
    tags: ["brainstorm", "projects"],
    lastModified: "2024-01-14",
    wordCount: 89,
  },
  {
    id: "3",
    title: "Meeting Notes",
    content: "Team meeting discussion points and action items from today's standup.",
    tags: ["work", "meetings"],
    lastModified: "2024-01-13",
    wordCount: 234,
  },
  {
    id: "4",
    title: "Daily Journal",
    content: "Reflections on today's activities and thoughts for tomorrow.",
    tags: ["personal", "reflection"],
    lastModified: "2024-01-12",
    wordCount: 178,
  },
  {
    id: "5",
    title: "Research Notes",
    content: "Important findings from recent academic papers and research materials.",
    tags: ["research", "academic", "tutorial"],
    lastModified: "2024-01-11",
    wordCount: 312,
  },
]

const allTags = [
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

export function NotesList({ onNoteSelect, onCreateNote }: NotesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"title" | "date" | "wordCount">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filteredAndSortedNotes = mockNotes
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTags =
        selectedTags.length === 0 || selectedTags.every((selectedTag) => note.tags.includes(selectedTag))

      return matchesSearch && matchesTags
    })
    .sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        case "date":
          comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime()
          break
        case "wordCount":
          comparison = a.wordCount - b.wordCount
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const clearAllFilters = () => {
    setSelectedTags([])
    setSearchQuery("")
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">All Notes</h1>
            <p className="text-muted-foreground mt-1">
              {filteredAndSortedNotes.length} of {mockNotes.length} notes
              {selectedTags.length > 0 &&
                ` • Filtered by ${selectedTags.length} tag${selectedTags.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={onCreateNote}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>

        <div className="mb-6 space-y-4">
          {/* Search and Sort Controls */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Input
                placeholder="Search notes by title, content, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4"
              />
            </div>

            <Select value={sortBy} onValueChange={(value: "title" | "date" | "wordCount") => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                  </div>
                </SelectItem>
                <SelectItem value="title">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Title
                  </div>
                </SelectItem>
                <SelectItem value="wordCount">Word Count</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
              {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>

          {/* Tag Filters */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filter by tags:
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => {
                const isSelected = selectedTags.includes(tag)
                const noteCount = mockNotes.filter((note) => note.tags.includes(tag)).length

                return (
                  <Badge
                    key={tag}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    onClick={() => toggleTagFilter(tag)}
                  >
                    <Hash className="h-3 w-3 mr-1" />
                    {tag} ({noteCount})
                  </Badge>
                )
              })}
            </div>

            {/* Active Filters */}
            {(selectedTags.length > 0 || searchQuery) && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchQuery("")}>
                    Search: "{searchQuery}" <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => toggleTagFilter(tag)}>
                    {tag} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 px-2 text-xs">
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedNotes.map((note) => (
            <Card
              key={note.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-border hover:border-accent/50"
              onClick={() => onNoteSelect(note.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold text-foreground line-clamp-1">{note.title}</CardTitle>
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{note.content}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
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

                {/* Meta info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{note.lastModified}</span>
                  <span>{note.wordCount} words</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {filteredAndSortedNotes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {mockNotes.length === 0 ? "No notes yet" : "No notes match your filters"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {mockNotes.length === 0
                ? "Create your first note to get started"
                : "Try adjusting your search or tag filters"}
            </p>
            {mockNotes.length === 0 ? (
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={onCreateNote}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Note
              </Button>
            ) : (
              <Button variant="outline" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
