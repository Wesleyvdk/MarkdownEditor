"use client"

import { Card, CardContent } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { ScrollArea } from "~/components/ui/scroll-area"
import { FileText, ArrowRight, ArrowLeft, Plus, ExternalLink } from "lucide-react"

interface LinkedNote {
  title: string
  exists: boolean
  id?: string
}

interface LinkVisualizationProps {
  currentNote: { id: string; title: string }
  linkedNotes: LinkedNote[]
  allNotes: Array<{ id: string; title: string }>
}

export function LinkVisualization({ currentNote, linkedNotes, allNotes }: LinkVisualizationProps) {
  // Find notes that link back to current note (backlinks)
  const backlinks = allNotes
    .filter((note) => {
      // In a real app, this would check the actual content of each note
      // For now, we'll simulate some backlinks
      return note.id !== currentNote.id && Math.random() > 0.7
    })
    .slice(0, 3)

  const handleNoteClick = (noteId?: string) => {
    if (noteId) {
      console.log("Navigate to note:", noteId)
    }
  }

  const handleCreateNote = (title: string) => {
    console.log("Create new note:", title)
  }

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">Link Graph</h3>
        <p className="text-xs text-muted-foreground mt-1">{currentNote.title}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Outgoing Links */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="h-4 w-4 text-accent" />
              <h4 className="text-sm font-medium">Outgoing Links</h4>
              <Badge variant="outline" className="text-xs">
                {linkedNotes.length}
              </Badge>
            </div>

            {linkedNotes.length > 0 ? (
              <div className="space-y-2">
                {linkedNotes.map((link, index) => (
                  <Card
                    key={index}
                    className={`cursor-pointer transition-colors ${
                      link.exists ? "hover:bg-accent/10 border-accent/20" : "hover:bg-muted border-dashed"
                    }`}
                    onClick={() => (link.exists ? handleNoteClick(link.id) : handleCreateNote(link.title))}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        {link.exists ? (
                          <FileText className="h-4 w-4 text-accent" />
                        ) : (
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={`text-sm flex-1 ${link.exists ? "text-foreground" : "text-muted-foreground"}`}>
                          {link.title}
                        </span>
                        {!link.exists && (
                          <Badge variant="outline" className="text-xs">
                            Create
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No outgoing links. Use [[note-title]] to create links.
              </p>
            )}
          </div>

          {/* Backlinks */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowLeft className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-medium">Backlinks</h4>
              <Badge variant="outline" className="text-xs">
                {backlinks.length}
              </Badge>
            </div>

            {backlinks.length > 0 ? (
              <div className="space-y-2">
                {backlinks.map((note) => (
                  <Card
                    key={note.id}
                    className="cursor-pointer hover:bg-primary/10 border-primary/20 transition-colors"
                    onClick={() => handleNoteClick(note.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm flex-1">{note.title}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No notes link to this one yet.</p>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <Plus className="h-4 w-4 mr-2" />
                Create Linked Note
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <FileText className="h-4 w-4 mr-2" />
                Show All Links
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
