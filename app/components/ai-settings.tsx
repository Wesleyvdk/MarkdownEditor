"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Brain,
  Download,
  Server,
  Database,
  FileText,
  Trash2,
  Check,
  X,
  AlertCircle,
  Cloud,
  Monitor,
} from "lucide-react"
import { aiService, AI_PROVIDERS, type AIConfig } from "@/lib/ai-service"

interface AISettingsProps {
  onClose: () => void
}

export function AISettings({ onClose }: AISettingsProps) {
  const [config, setConfig] = useState<AIConfig>(aiService.getConfig())
  const [enableRAG, setEnableRAG] = useState(true)
  const [ragTemplate, setRagTemplate] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  const [ollamaModels, setOllamaModels] = useState([
    { name: "llama3.2", size: "3.2GB", status: "downloaded" as const },
    { name: "codellama", size: "3.8GB", status: "available" as const },
    { name: "mistral", size: "4.1GB", status: "downloading" as const, progress: 65 },
  ])

  useEffect(() => {
    loadAvailableModels()
  }, [config.provider])

  const loadAvailableModels = async () => {
    try {
      const models = await aiService.getAvailableModels()
      setAvailableModels(models)
    } catch (error) {
      console.error("Failed to load models:", error)
    }
  }

  const handleConfigChange = (key: keyof AIConfig, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    aiService.setConfig(newConfig)
  }

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    try {
      const connected = await aiService.testConnection()
      setIsConnected(connected)
    } catch (error) {
      setIsConnected(false)
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleDownloadModel = (modelName: string) => {
    setOllamaModels((prev) =>
      prev.map((model) => (model.name === modelName ? { ...model, status: "downloading", progress: 0 } : model)),
    )
  }

  const handleDeleteModel = (modelName: string) => {
    setOllamaModels((prev) =>
      prev.map((model) => (model.name === modelName ? { ...model, status: "available" } : model)),
    )
  }

  const currentProvider = AI_PROVIDERS[config.provider]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">AI Settings</h2>
              <p className="text-sm text-muted-foreground">Configure AI providers and document generation</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="providers" className="h-full flex">
            {/* Sidebar */}
            <div className="w-64 border-r border-border bg-sidebar">
              <TabsList className="flex flex-col h-auto w-full bg-transparent p-2 space-y-1">
                <TabsTrigger value="providers" className="w-full justify-start">
                  <Cloud className="h-4 w-4 mr-2" />
                  AI Providers
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
                  <TabsContent value="providers" className="mt-0">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Cloud className="h-5 w-5" />
                            AI Provider Selection
                          </CardTitle>
                          <CardDescription>Choose your preferred AI provider and configure settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Provider Selection */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                              <div
                                key={key}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                  config.provider === key
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => handleConfigChange("provider", key)}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  {provider.type === "local" ? (
                                    <Monitor className="h-5 w-5 text-blue-500" />
                                  ) : (
                                    <Cloud className="h-5 w-5 text-green-500" />
                                  )}
                                  <h3 className="font-medium">{provider.name}</h3>
                                  <Badge
                                    variant={provider.type === "local" ? "secondary" : "default"}
                                    className="text-xs"
                                  >
                                    {provider.type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {provider.models.length} models available
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Provider Configuration */}
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="model-select">Model</Label>
                                <Select
                                  value={config.model}
                                  onValueChange={(value) => handleConfigChange("model", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a model" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {currentProvider?.models.map((model) => (
                                      <SelectItem key={model} value={model}>
                                        {model}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {currentProvider?.requiresApiKey && (
                                <div className="space-y-2">
                                  <Label htmlFor="api-key">API Key</Label>
                                  <Input
                                    id="api-key"
                                    type="password"
                                    placeholder="Enter your API key"
                                    value={config.apiKey || ""}
                                    onChange={(e) => handleConfigChange("apiKey", e.target.value)}
                                  />
                                </div>
                              )}

                              {config.provider === "ollama" && (
                                <div className="space-y-2">
                                  <Label htmlFor="base-url">Base URL</Label>
                                  <Input
                                    id="base-url"
                                    placeholder="http://localhost:11434"
                                    value={config.baseUrl || ""}
                                    onChange={(e) => handleConfigChange("baseUrl", e.target.value)}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Advanced Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="temperature">Temperature</Label>
                                <Input
                                  id="temperature"
                                  type="number"
                                  min="0"
                                  max="2"
                                  step="0.1"
                                  value={config.temperature || 0.7}
                                  onChange={(e) => handleConfigChange("temperature", Number.parseFloat(e.target.value))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="max-tokens">Max Tokens</Label>
                                <Input
                                  id="max-tokens"
                                  type="number"
                                  min="1"
                                  max="8192"
                                  value={config.maxTokens || 2048}
                                  onChange={(e) => handleConfigChange("maxTokens", Number.parseInt(e.target.value))}
                                />
                              </div>
                            </div>

                            {/* Connection Test */}
                            <div className="flex items-center gap-2">
                              <Button onClick={handleTestConnection} disabled={isTestingConnection}>
                                {isTestingConnection ? "Testing..." : "Test Connection"}
                              </Button>
                              {isConnected && (
                                <div className="flex items-center gap-2 text-green-500">
                                  <Check className="h-4 w-4" />
                                  <span className="text-sm">Connected</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="models" className="mt-0">
                    <div className="space-y-6">
                      {config.provider === "ollama" ? (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Download className="h-5 w-5" />
                              Ollama Model Management
                            </CardTitle>
                            <CardDescription>Download and manage local Ollama models</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {ollamaModels.map((model) => (
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
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownloadModel(model.name)}
                                      >
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
                      ) : (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Cloud className="h-5 w-5" />
                              Available Models
                            </CardTitle>
                            <CardDescription>Models available for {currentProvider?.name}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {currentProvider?.models.map((model) => (
                                <div
                                  key={model}
                                  className={`p-4 border rounded-lg ${
                                    config.model === model ? "border-primary bg-primary/5" : "border-border"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Brain className="h-5 w-5 text-primary" />
                                    <div>
                                      <h4 className="font-medium">{model}</h4>
                                      <p className="text-sm text-muted-foreground">Cloud model</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  {/* General Tab */}
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
                              <Select
                                value={config.model}
                                onValueChange={(value) => handleConfigChange("model", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent>
                                  {currentProvider?.models.map((model) => (
                                    <SelectItem key={model} value={model}>
                                      {model}
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
                                value={config.apiKey || ""}
                                onChange={(e) => handleConfigChange("apiKey", e.target.value)}
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

                  {/* RAG Tab */}
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
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Enable RAG System</Label>
                              <p className="text-sm text-muted-foreground">
                                Use your notes as context for AI responses
                              </p>
                            </div>
                            <Switch checked={enableRAG} onCheckedChange={setEnableRAG} />
                          </div>

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

                  {/* Templates Tab */}
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

                  {/* Connections Tab */}
                  <TabsContent value="connections" className="mt-0">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5" />
                            Connection Status
                          </CardTitle>
                          <CardDescription>Current AI provider connection status</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                            {isConnected ? (
                              <>
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-green-500">Connected to {currentProvider?.name}</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm text-muted-foreground">Not connected</span>
                              </>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Current Provider</Label>
                            <div className="p-3 border border-border rounded-lg">
                              <div className="flex items-center gap-3">
                                {currentProvider?.type === "local" ? (
                                  <Monitor className="h-5 w-5 text-blue-500" />
                                ) : (
                                  <Cloud className="h-5 w-5 text-green-500" />
                                )}
                                <div>
                                  <h4 className="font-medium">{currentProvider?.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Model: {config.model} | Type: {currentProvider?.type}
                                  </p>
                                </div>
                              </div>
                            </div>
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
