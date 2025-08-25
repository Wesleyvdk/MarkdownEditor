"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { ScrollArea } from "~/components/ui/scroll-area"
import { Database, Search, FileText, TrendingUp, RefreshCw } from "lucide-react"
import { ragService, searchRelevantContent, getRAGStats, type RAGResult } from "~/lib/rag-service"

interface RAGPanelProps {
  currentNoteId?: string
  onContextSelect?: (context: string) => void
}

export function RAGPanel({ currentNoteId, onContextSelect }: RAGPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<RAGResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [stats, setStats] = useState(getRAGStats())
  const [selectedChunks, setSelectedChunks] = useState<string[]>([])

  useEffect(() => {
    setStats(getRAGStats())
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const excludeIds = currentNoteId ? [currentNoteId] : []
      const results = await searchRelevantContent(searchQuery, excludeIds)
      setSearchResults(results)
    } catch (error) {
      console.error("RAG search failed:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const toggleChunkSelection = (chunkId: string) => {
    setSelectedChunks((prev) => (prev.includes(chunkId) ? prev.filter((id) => id !== chunkId) : [...prev, chunkId]))
  }

  const generateSelectedContext = () => {
    const selectedResults = searchResults.filter((result) => selectedChunks.includes(result.chunk.id))
    const context = ragService.generateContext(selectedResults)
    onContextSelect?.(context)
  }

  const formatRelevanceScore = (score: number) => {
    return Math.round(score * 100)
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-500"
    if (score >= 0.6) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">RAG System</h3>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for relevant content..."
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-border">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              RAG Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Total Chunks</Label>
                <div className="font-medium">{stats.totalChunks}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Avg Chunk Size</Label>
                <div className="font-medium">{stats.averageChunkSize} chars</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Chunk Size</Label>
                <div className="font-medium">{stats.config.chunkSize}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Max Results</Label>
                <div className="font-medium">{stats.config.maxResults}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Results */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {searchResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Search Results ({searchResults.length})</h4>
                {selectedChunks.length > 0 && (
                  <Button size="sm" onClick={generateSelectedContext}>
                    Use Selected ({selectedChunks.length})
                  </Button>
                )}
              </div>

              {searchResults.map((result, index) => (
                <Card
                  key={result.chunk.id}
                  className={`cursor-pointer transition-colors ${
                    selectedChunks.includes(result.chunk.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                  onClick={() => toggleChunkSelection(result.chunk.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {result.chunk.noteTitle}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Rank #{index + 1}
                        </Badge>
                        <Badge variant="secondary" className={`text-xs ${getScoreColor(result.relevanceScore)}`}>
                          {formatRelevanceScore(result.relevanceScore)}%
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-muted-foreground mb-2">
                      Similarity: {formatRelevanceScore(result.similarity)}% • Length: {result.chunk.content.length}{" "}
                      chars
                    </div>
                    <div className="text-sm line-clamp-4">
                      {result.chunk.content.substring(0, 300)}
                      {result.chunk.content.length > 300 && "..."}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No relevant content found for "{searchQuery}"</p>
              <p className="text-sm mt-2">Try different keywords or check your search terms</p>
            </div>
          )}

          {!searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Search your knowledge base</p>
              <p className="text-sm mt-2">Enter keywords to find relevant content from your notes</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {selectedChunks.length > 0 && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {selectedChunks.length} chunk{selectedChunks.length !== 1 ? "s" : ""} selected
            </span>
            <Button size="sm" variant="outline" onClick={() => setSelectedChunks([])}>
              Clear Selection
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
