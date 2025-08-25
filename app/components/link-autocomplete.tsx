"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { FileText, Plus } from "lucide-react"

interface LinkAutocompleteProps {
  position: { x: number; y: number }
  query: string
  notes: Array<{ id: string; title: string }>
  onSelect: (noteTitle: string) => void
  onClose: () => void
}

export function LinkAutocomplete({ position, query, notes, onSelect, onClose }: LinkAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Filter notes based on query
  const filteredNotes = notes.filter((note) => note.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5) // Limit to 5 results

  // Add option to create new note if query doesn't match exactly
  const exactMatch = filteredNotes.some((note) => note.title.toLowerCase() === query.toLowerCase())
  const showCreateOption = query.trim().length > 0 && !exactMatch

  const allOptions = [...filteredNotes, ...(showCreateOption ? [{ id: "new", title: query, isNew: true }] : [])]

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, allOptions.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (allOptions[selectedIndex]) {
          onSelect(allOptions[selectedIndex].title)
        }
      } else if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [selectedIndex, onSelect, onClose])

  if (allOptions.length === 0) return null

  return (
    <Card
      className="absolute z-50 w-64 max-h-48 overflow-auto shadow-lg border-accent/20"
      style={{
        left: position.x,
        top: position.y + 20,
        transform: "translateX(-50%)",
      }}
    >
      <CardContent className="p-2">
        {allOptions.map((option, index) => (
          <div
            key={option.id}
            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
              index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted"
            }`}
            onClick={() => onSelect(option.title)}
          >
            {(option as any).isNew ? (
              <Plus className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="flex-1 text-sm">{option.title}</span>
            {(option as any).isNew && (
              <Badge variant="outline" className="text-xs">
                New
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
