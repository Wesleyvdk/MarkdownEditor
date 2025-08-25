"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Switch } from "~/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Textarea } from "~/components/ui/textarea"
import { Badge } from "~/components/ui/badge"
import { ScrollArea } from "~/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Settings, Brain, Download, Server, Database, FileText, Trash2, Check, X, AlertCircle } from "lucide-react"

interface AISettingsProps {
  onClose: () => void
}

export function AISettings({ onClose }: AISettingsProps) {
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434")
  const [apiKey, setApiKey] = useState("")
  const [enableRAG, setEnableRAG] = useState(true)
  const [selectedModel, setSelectedModel] = useState("llama3.2")
  const [ragTemplate, setRagTemplate] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [availableModels, setAvailableModels] = useState([
    { name: "llama3.2", size: "3.2GB", status: "downloaded" },
    { name: "codellama", size: "3.8GB", status: "available" },
    { name: "mistral", size: "4.1GB", status: "downloading", progress: 65 },
  ])

  const handleTestConnection = async () => {
    // Simulate connection test
    setIsConnected(true)
  }

  const handleDownloadModel = (modelName: string) => {
    setAvailableModels((prev) =>
      prev.map((model) => (model.name === modelName ? { ...model, status: "downloading", progress: 0 } : model)),
    )
  }

  const handleDeleteModel = (modelName: string) => {
    setAvailableModels((prev) =>
      prev.map((model) => (model.name === modelName ? { ...model, status: "available" } : model)),
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">AI Settings</h2>
              <p className="text-sm text-muted-foreground">Configure AI models and document generation</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="general" className="h-full flex">
            {/* Sidebar */}
            <div className="w-64 border-r border-border bg-sidebar">
              <TabsList className="flex flex-col h-auto w-full bg-transparent p-2 space-y-1">
                <TabsTrigger value="general" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger value="models" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Models
                </TabsTrigger>
                <TabsTrigger value="rag" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  RAG System
                </TabsTrigger>
                <TabsTrigger value="templates" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="connections" className="w-full justify-start">
                  <Server className="h-4 w-4 mr-2" />
                  Connections
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <TabsContent value="general" className="mt-0">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            AI Configuration
                          </CardTitle>
                          <CardDescription>Configure your AI model preferences and behavior</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="model-select">Default Model</Label>
                              <Select value={selectedModel} onValueChange={setSelectedModel}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableModels
                                    .filter((model) => model.status === "downloaded")
                                    .map((model) => (
                                      <SelectItem key={model.name} value={model.name}>
                                        {model.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="api-key">API Key (Optional)</Label>
                              <Input
                                id="api-key"
                                type="password"
                                placeholder="Enter API key for cloud models"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Enable RAG System</Label>
                              <p className="text-sm text-muted-foreground">
                                Use your notes as context for AI responses
                              </p>
                            </div>
                            <Switch checked={enableRAG} onCheckedChange={setEnableRAG} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="models" className="mt-0">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            Model Management
                          </CardTitle>
                          <CardDescription>Download and manage AI models for local inference</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {availableModels.map((model) => (
                              <div
                                key={model.name}
                                className="flex items-center justify-between p-4 border border-border rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Brain className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{model.name}</h4>
                                    <p className="text-sm text-muted-foreground">{model.size}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {model.status === "downloaded" && (
                                    <>
                                      <Badge
                                        variant="default"
                                        className="bg-green-500/10 text-green-500 border-green-500/20"
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        Downloaded
                                      </Badge>
                                      <Button variant="ghost" size="sm" onClick={() => handleDeleteModel(model.name)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}

                                  {model.status === "available" && (
                                    <Button variant="outline" size="sm" onClick={() => handleDownloadModel(model.name)}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </Button>
                                  )}

                                  {model.status === "downloading" && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-primary transition-all duration-300"
                                          style={{ width: `${model.progress}%` }}
                                        />
                                      </div>
                                      <span className="text-sm text-muted-foreground">{model.progress}%</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="rag" className="mt-0">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            RAG Configuration
                          </CardTitle>
                          <CardDescription>Configure Retrieval Augmented Generation settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="rag-template">RAG Prompt Template</Label>
                            <Textarea
                              id="rag-template"
                              placeholder="Use the following context to answer the question: {context}&#10;&#10;Question: {question}&#10;&#10;Answer:"
                              value={ragTemplate}
                              onChange={(e) => setRagTemplate(e.target.value)}
                              rows={6}
                            />
                            <p className="text-sm text-muted-foreground">
                              Use {"{context}"} and {"{question}"} placeholders in your template
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Chunk Size</Label>
                              <Input type="number" defaultValue="1000" />
                            </div>
                            <div className="space-y-2">
                              <Label>Max Results</Label>
                              <Input type="number" defaultValue="5" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="templates" className="mt-0">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Document Templates
                          </CardTitle>
                          <CardDescription>Pre-configured templates for AI document generation</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {[
                              { name: "Meeting Notes", description: "Generate structured meeting notes" },
                              { name: "Research Summary", description: "Summarize research findings" },
                              { name: "Project Plan", description: "Create detailed project plans" },
                              { name: "Technical Documentation", description: "Generate technical docs" },
                            ].map((template) => (
                              <div
                                key={template.name}
                                className="flex items-center justify-between p-4 border border-border rounded-lg"
                              >
                                <div>
                                  <h4 className="font-medium">{template.name}</h4>
                                  <p className="text-sm text-muted-foreground">{template.description}</p>
                                </div>
                                <Button variant="outline" size="sm">
                                  Configure
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="connections" className="mt-0">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5" />
                            Ollama Connection
                          </CardTitle>
                          <CardDescription>Configure connection to your Ollama instance</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="ollama-url">Ollama URL</Label>
                            <div className="flex gap-2">
                              <Input
                                id="ollama-url"
                                placeholder="http://localhost:11434"
                                value={ollamaUrl}
                                onChange={(e) => setOllamaUrl(e.target.value)}
                              />
                              <Button onClick={handleTestConnection}>Test Connection</Button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                            {isConnected ? (
                              <>
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-green-500">Connected to Ollama</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm text-muted-foreground">Not connected</span>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button>Save Settings</Button>
        </div>
      </div>
    </div>
  )
}
