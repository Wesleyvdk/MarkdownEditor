"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import { ScrollArea } from "~/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
import { Hash, Plus, Trash2, Edit3, BarChart3, FileText, X, Check } from "lucide-react"

interface TagManagerProps {
  tags: string[]
  notes: Array<{ id: string; title: string; tags: string[] }>
  onClose: () => void
}

export function TagManager({ tags, notes, onClose }: TagManagerProps) {
  const [newTagName, setNewTagName] = useState("")
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editTagName, setEditTagName] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Get tag statistics
  const getTagStats = (tag: string) => {
    const noteCount = notes.filter((note) => note.tags.includes(tag)).length
    const lastUsed = notes
      .filter((note) => note.tags.includes(tag))
      .sort(
        (a, b) => new Date(b.lastModified || "").getTime() - new Date(a.lastModified || "").getTime(),
      )[0]?.lastModified

    return { noteCount, lastUsed }
  }

  // Get all tag statistics sorted by usage
  const tagStats = tags
    .map((tag) => ({
      name: tag,
      ...getTagStats(tag),
    }))
    .sort((a, b) => b.noteCount - a.noteCount)

  const handleCreateTag = () => {
    if (newTagName.trim() && !tags.includes(newTagName.trim())) {
      console.log("Create tag:", newTagName.trim())
      setNewTagName("")
    }
  }

  const handleEditTag = (tag: string) => {
    setEditingTag(tag)
    setEditTagName(tag)
  }

  const handleSaveEdit = () => {
    if (editTagName.trim() && editTagName !== editingTag) {
      console.log("Rename tag:", editingTag, "to:", editTagName.trim())
    }
    setEditingTag(null)
    setEditTagName("")
  }

  const handleDeleteTag = (tag: string) => {
    console.log("Delete tag:", tag)
  }

  const getNotesWithTag = (tag: string) => {
    return notes.filter((note) => note.tags.includes(tag))
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-accent" />
            Tag Management
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left Panel - Tag List */}
          <div className="w-1/2 flex flex-col">
            {/* Create New Tag */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Create New Tag</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Tag name..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleCreateTag()}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleCreateTag} disabled={!newTagName.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tag Statistics Overview */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-2xl font-bold text-accent">{tags.length}</div>
                    <div className="text-muted-foreground">Total Tags</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{notes.length}</div>
                    <div className="text-muted-foreground">Total Notes</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tag List */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">All Tags</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {tagStats.map((tag) => (
                      <div
                        key={tag.name}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedTag === tag.name ? "border-accent bg-accent/10" : "border-border hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedTag(tag.name)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          {editingTag === tag.name ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editTagName}
                                onChange={(e) => setEditTagName(e.target.value)}
                                className="h-6 text-sm"
                                onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                              />
                              <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-6 w-6 p-0">
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingTag(null)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <Hash className="h-4 w-4 text-accent" />
                                <span className="font-medium">{tag.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditTag(tag.name)
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteTag(tag.name)
                                  }}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{tag.noteCount} notes</span>
                          {tag.lastUsed && <span>Last used: {tag.lastUsed}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <Separator orientation="vertical" />

          {/* Right Panel - Tag Details */}
          <div className="w-1/2 flex flex-col">
            {selectedTag ? (
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5 text-accent" />
                    {selectedTag}
                    <Badge variant="outline" className="ml-auto">
                      {getTagStats(selectedTag).noteCount} notes
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Tag Statistics */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Statistics</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-2 bg-muted/50 rounded">
                          <div className="font-medium">{getTagStats(selectedTag).noteCount}</div>
                          <div className="text-muted-foreground text-xs">Notes tagged</div>
                        </div>
                        <div className="p-2 bg-muted/50 rounded">
                          <div className="font-medium">
                            {((getTagStats(selectedTag).noteCount / notes.length) * 100).toFixed(1)}%
                          </div>
                          <div className="text-muted-foreground text-xs">Usage rate</div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Notes with this tag */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Notes with this tag</h4>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {getNotesWithTag(selectedTag).map((note) => (
                            <div
                              key={note.id}
                              className="p-2 border border-border rounded-lg hover:bg-muted/50 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{note.title}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {note.tags
                                  .filter((tag) => tag !== selectedTag)
                                  .map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex-1 flex items-center justify-center">
                <CardContent>
                  <div className="text-center text-muted-foreground">
                    <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a tag to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
