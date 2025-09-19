interface AIProvider {
  name: string
  type: "local" | "cloud"
  models: string[]
  requiresApiKey: boolean
  defaultBaseUrl?: string
  modelsFetched?: boolean
  lastModelsFetch?: number
}

interface OllamaModel {
  name: string
  model: string
  modified_at: string
  size: number
  digest: string
  details?: {
    parent_model?: string
    format?: string
    family?: string
    families?: string[]
    parameter_size?: string
    quantization_level?: string
  }
}

interface OllamaModelInfo {
  name: string
  size: string
  status: "downloaded" | "available" | "downloading"
  progress?: number
  digest?: string
  modified_at?: string
}

interface AIConfig {
  provider: string
  model: string
  apiKey?: string
  baseUrl?: string
  temperature?: number
  maxTokens?: number
}

interface GenerateOptions {
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  context?: string[]
}

export const AI_PROVIDERS: Record<string, AIProvider> = {
  ollama: {
    name: "Ollama",
    type: "local",
    models: [],
    requiresApiKey: false,
    defaultBaseUrl: "http://localhost:11434",
  },
  openai: {
    name: "OpenAI",
    type: "cloud",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    requiresApiKey: true,
    defaultBaseUrl: "https://api.openai.com",
  },
  anthropic: {
    name: "Anthropic",
    type: "cloud",
    models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
    requiresApiKey: true,
    defaultBaseUrl: "https://api.anthropic.com",
  },
  groq: {
    name: "Groq",
    type: "cloud",
    models: ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    requiresApiKey: true,
    defaultBaseUrl: "https://api.groq.com",
  },
  gemini: {
    name: "Google Gemini",
    type: "cloud",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"],
    requiresApiKey: true,
    defaultBaseUrl: "https://generativelanguage.googleapis.com",
  },
}

class AIService {
  private config: AIConfig = {
    provider: "ollama",
    model: "llama3.2",
    baseUrl: "http://localhost:11434",
    temperature: 0.7,
    maxTokens: 2048,
  }

  private customBaseUrls: Record<string, string> = {}
  private cachedModels: Record<string, { models: string[]; timestamp: number }> = {}
  private readonly MODEL_CACHE_DURATION = 1000 * 60 * 60 // 1 hour
  private readonly SETTINGS_KEY = 'ai-service-settings'

  constructor() {
    this.loadSettings()
  }

  setConfig(config: Partial<AIConfig>) {
    this.config = { ...this.config, ...config }
    
    // If baseUrl is being set, also store it as custom baseUrl for this provider
    if (config.baseUrl && config.provider) {
      this.customBaseUrls[config.provider] = config.baseUrl
    }
  }

  setCustomBaseUrl(provider: string, baseUrl: string) {
    this.customBaseUrls[provider] = baseUrl
    if (this.config.provider === provider) {
      this.config.baseUrl = baseUrl
    }
    this.saveSettings()
  }

  getCustomBaseUrl(provider: string): string | undefined {
    return this.customBaseUrls[provider]
  }

  getEffectiveBaseUrl(provider?: string): string {
    const targetProvider = provider || this.config.provider
    return this.customBaseUrls[targetProvider] || 
           AI_PROVIDERS[targetProvider]?.defaultBaseUrl || 
           this.config.baseUrl ||
           "http://localhost:11434"
  }

  private loadSettings() {
    if (typeof window === 'undefined') return
    
    try {
      const saved = localStorage.getItem(this.SETTINGS_KEY)
      if (saved) {
        const settings = JSON.parse(saved)
        this.customBaseUrls = settings.customBaseUrls || {}
        this.cachedModels = settings.cachedModels || {}
        
        // Clean up old cache entries
        const now = Date.now()
        Object.keys(this.cachedModels).forEach(key => {
          if (now - this.cachedModels[key].timestamp > this.MODEL_CACHE_DURATION) {
            delete this.cachedModels[key]
          }
        })
      }
    } catch (error) {
      console.error('Failed to load AI service settings:', error)
      this.customBaseUrls = {}
      this.cachedModels = {}
    }
  }

  private saveSettings() {
    if (typeof window === 'undefined') return
    
    try {
      const settings = {
        customBaseUrls: this.customBaseUrls,
        cachedModels: this.cachedModels
      }
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save AI service settings:', error)
    }
  }

  clearCache() {
    this.cachedModels = {}
    this.saveSettings()
  }

  resetCustomUrls() {
    this.customBaseUrls = {}
    this.saveSettings()
  }

  getAllProviders(): Record<string, AIProvider> {
    return AI_PROVIDERS
  }

  getProviderInfo(provider: string): AIProvider | undefined {
    return AI_PROVIDERS[provider]
  }

  isModelCacheValid(provider: string): boolean {
    const cache = this.cachedModels[provider]
    if (!cache) return false
    
    const now = Date.now()
    return (now - cache.timestamp) < this.MODEL_CACHE_DURATION
  }

  getCachedModels(provider: string): string[] | undefined {
    const cache = this.cachedModels[provider]
    if (!cache || !this.isModelCacheValid(provider)) return undefined
    return cache.models
  }

  async refreshModels(provider?: string): Promise<string[]> {
    const targetProvider = provider || this.config.provider
    const originalProvider = this.config.provider
    
    if (targetProvider !== originalProvider) {
      // Temporarily switch provider to fetch models
      this.config.provider = targetProvider
    }
    
    try {
      const models = await this.getAvailableModels(true)
      return models
    } finally {
      if (targetProvider !== originalProvider) {
        this.config.provider = originalProvider
      }
    }
  }

  getConfig(): AIConfig {
    return { ...this.config }
  }

  async generateText(options: GenerateOptions): Promise<string> {
    const { prompt, systemPrompt, temperature, maxTokens, context } = options

    try {
      switch (this.config.provider) {
        case "ollama":
          return await this.generateWithOllama(prompt, systemPrompt, context)
        case "openai":
          return await this.generateWithOpenAI(prompt, systemPrompt, context)
        case "anthropic":
          return await this.generateWithAnthropic(prompt, systemPrompt, context)
        case "groq":
          return await this.generateWithGroq(prompt, systemPrompt, context)
        case "gemini":
          return await this.generateWithGemini(prompt, systemPrompt, context)
        default:
          throw new Error(`Unsupported provider: ${this.config.provider}`)
      }
    } catch (error) {
      console.error("AI generation failed:", error)
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private async generateWithOllama(prompt: string, systemPrompt?: string, context?: string[]): Promise<string> {
    const fullPrompt = this.buildPrompt(prompt, systemPrompt, context)

    const response = await fetch(`${this.getEffectiveBaseUrl()}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.config.model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.response || ""
  }

  private async generateWithOpenAI(prompt: string, systemPrompt?: string, context?: string[]): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error("OpenAI API key is required")
    }

    const messages = []
    if (systemPrompt || context) {
      messages.push({
        role: "system",
        content: this.buildSystemPrompt(systemPrompt, context),
      })
    }
    messages.push({ role: "user", content: prompt })

    const response = await fetch(`${this.getEffectiveBaseUrl("openai")}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ""
  }

  private async generateWithAnthropic(prompt: string, systemPrompt?: string, context?: string[]): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error("Anthropic API key is required")
    }

    const response = await fetch(`${this.getEffectiveBaseUrl("anthropic")}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: this.buildSystemPrompt(systemPrompt, context),
        messages: [{ role: "user", content: prompt }],
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.content?.[0]?.text || ""
  }

  private async generateWithGroq(prompt: string, systemPrompt?: string, context?: string[]): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error("Groq API key is required")
    }

    const messages = []
    if (systemPrompt || context) {
      messages.push({
        role: "system",
        content: this.buildSystemPrompt(systemPrompt, context),
      })
    }
    messages.push({ role: "user", content: prompt })

    const response = await fetch(`${this.getEffectiveBaseUrl("groq")}/openai/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ""
  }

  private async generateWithGemini(prompt: string, systemPrompt?: string, context?: string[]): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error("Google API key is required")
    }

    const fullPrompt = this.buildPrompt(prompt, systemPrompt, context)

    const response = await fetch(
      `${this.getEffectiveBaseUrl("gemini")}/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: this.config.temperature,
            maxOutputTokens: this.config.maxTokens,
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
  }

  private buildPrompt(prompt: string, systemPrompt?: string, context?: string[]): string {
    let fullPrompt = ""

    if (systemPrompt) {
      fullPrompt += `${systemPrompt}\n\n`
    }

    if (context && context.length > 0) {
      fullPrompt += `Context from your notes:\n${context.join("\n\n")}\n\n`
    }

    fullPrompt += prompt
    return fullPrompt
  }

  private buildSystemPrompt(systemPrompt?: string, context?: string[]): string {
    let prompt = systemPrompt || "You are a helpful AI assistant for note-taking and document generation."

    if (context && context.length > 0) {
      prompt += `\n\nContext from the user's notes:\n${context.join("\n\n")}`
    }

    return prompt
  }

  async testConnection(): Promise<{ connected: boolean; version?: string; error?: string }> {
    try {
      switch (this.config.provider) {
        case "ollama":
          return await this.checkOllamaConnection()
        case "openai":
          if (!this.config.apiKey) {
            return { connected: false, error: "API key required" }
          }
          const openaiResponse = await fetch(`${this.getEffectiveBaseUrl("openai")}/v1/models`, {
            headers: { Authorization: `Bearer ${this.config.apiKey}` },
          })
          if (openaiResponse.ok) {
            return { connected: true }
          } else {
            return { connected: false, error: `HTTP ${openaiResponse.status}: ${openaiResponse.statusText}` }
          }
        case "anthropic":
          if (!this.config.apiKey) {
            return { connected: false, error: "API key required" }
          }
          // Anthropic doesn't have a simple health check endpoint
          return { connected: true }
        case "groq":
          if (!this.config.apiKey) {
            return { connected: false, error: "API key required" }
          }
          const groqResponse = await fetch(`${this.getEffectiveBaseUrl("groq")}/openai/v1/models`, {
            headers: { Authorization: `Bearer ${this.config.apiKey}` },
          })
          if (groqResponse.ok) {
            return { connected: true }
          } else {
            return { connected: false, error: `HTTP ${groqResponse.status}: ${groqResponse.statusText}` }
          }
        case "gemini":
          if (!this.config.apiKey) {
            return { connected: false, error: "API key required" }
          }
          return { connected: true }
        default:
          return { connected: false, error: "Unknown provider" }
      }
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : "Connection failed" 
      }
    }
  }

  async getAvailableModels(forceRefresh = false): Promise<string[]> {
    const provider = AI_PROVIDERS[this.config.provider]
    if (!provider) return []

    const cacheKey = this.config.provider
    const now = Date.now()
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && this.cachedModels[cacheKey] && 
        (now - this.cachedModels[cacheKey].timestamp) < this.MODEL_CACHE_DURATION) {
      return this.cachedModels[cacheKey].models
    }

    let models: string[] = []

    try {
      if (provider.type === "local" && this.config.provider === "ollama") {
        const response = await fetch(`${this.getEffectiveBaseUrl()}/api/tags`)
        if (response.ok) {
          const data = await response.json()
          models = data.models?.map((model: OllamaModel) => model.name) || []
        }
      } else if (provider.type === "cloud") {
        models = await this.fetchCloudProviderModels(this.config.provider)
      }
    } catch (error) {
      console.error(`Failed to fetch ${this.config.provider} models:`, error)
      // Fall back to cached models or static list
      if (this.cachedModels[cacheKey]) {
        return this.cachedModels[cacheKey].models
      }
      return provider.models
    }

    // Update cache and provider
    if (models.length > 0) {
      this.cachedModels[cacheKey] = { models, timestamp: now }
      AI_PROVIDERS[this.config.provider].models = models
      AI_PROVIDERS[this.config.provider].modelsFetched = true
      AI_PROVIDERS[this.config.provider].lastModelsFetch = now
      this.saveSettings()
    }

    return models.length > 0 ? models : provider.models
  }

  private async fetchCloudProviderModels(provider: string): Promise<string[]> {
    if (!this.config.apiKey && provider !== "ollama") {
      throw new Error(`API key required for ${provider}`)
    }

    switch (provider) {
      case "openai":
        return await this.fetchOpenAIModels()
      case "anthropic":
        return await this.fetchAnthropicModels()
      case "groq":
        return await this.fetchGroqModels()
      case "gemini":
        return await this.fetchGeminiModels()
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  private async fetchOpenAIModels(): Promise<string[]> {
    const response = await fetch(`${this.getEffectiveBaseUrl("openai")}/v1/models`, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`OpenAI models API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
      ?.filter((model: any) => model.id.startsWith("gpt-"))
      ?.map((model: any) => model.id)
      ?.sort() || []
  }

  private async fetchAnthropicModels(): Promise<string[]> {
    // Anthropic doesn't have a public models endpoint
    // Return known models with potential new ones
    return [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-sonnet-20240620", 
      "claude-3-5-haiku-20241022",
      "claude-3-haiku-20240307",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229"
    ]
  }

  private async fetchGroqModels(): Promise<string[]> {
    const response = await fetch(`${this.getEffectiveBaseUrl("groq")}/openai/v1/models`, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Groq models API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
      ?.map((model: any) => model.id)
      ?.sort() || []
  }

  private async fetchGeminiModels(): Promise<string[]> {
    const response = await fetch(
      `${this.getEffectiveBaseUrl("gemini")}/v1beta/models?key=${this.config.apiKey}`
    )

    if (!response.ok) {
      throw new Error(`Gemini models API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.models
      ?.filter((model: any) => model.supportedGenerationMethods?.includes("generateContent"))
      ?.map((model: any) => model.name.replace("models/", ""))
      ?.sort() || []
  }

  async getOllamaModels(): Promise<OllamaModelInfo[]> {
    try {
      const response = await fetch(`${this.getEffectiveBaseUrl()}/api/tags`)
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.models?.map((model: OllamaModel) => ({
        name: model.name,
        size: this.formatBytes(model.size),
        status: "downloaded" as const,
        digest: model.digest,
        modified_at: model.modified_at
      })) || []
    } catch (error) {
      console.error("Failed to fetch Ollama models:", error)
      return []
    }
  }

  async getOllamaLibraryModels(): Promise<OllamaModelInfo[]> {
    // Popular models available in Ollama library
    const libraryModels = [
      { name: "llama3.2:latest", size: "2.0GB" },
      { name: "llama3.2:3b", size: "2.0GB" },
      { name: "llama3.1:latest", size: "4.7GB" },
      { name: "llama3.1:8b", size: "4.7GB" },
      { name: "llama3.1:70b", size: "40GB" },
      { name: "codellama:latest", size: "3.8GB" },
      { name: "codellama:7b", size: "3.8GB" },
      { name: "codellama:13b", size: "7.3GB" },
      { name: "mistral:latest", size: "4.1GB" },
      { name: "mistral:7b", size: "4.1GB" },
      { name: "phi3:latest", size: "2.3GB" },
      { name: "phi3:mini", size: "2.3GB" },
      { name: "gemma2:latest", size: "5.4GB" },
      { name: "gemma2:9b", size: "5.4GB" },
      { name: "qwen2.5:latest", size: "4.4GB" },
      { name: "deepseek-coder:latest", size: "3.8GB" },
      { name: "nomic-embed-text:latest", size: "274MB" },
    ]

    const downloadedModels = await this.getOllamaModels()
    const downloadedNames = new Set(downloadedModels.map(m => m.name))

    return libraryModels.map(model => ({
      name: model.name,
      size: model.size,
      status: downloadedNames.has(model.name) ? "downloaded" as const : "available" as const
    }))
  }

  async downloadOllamaModel(modelName: string): Promise<ReadableStream<Uint8Array> | null> {
    try {
      const response = await fetch(`${this.getEffectiveBaseUrl()}/api/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: modelName, stream: true })
      })

      if (!response.ok) {
        throw new Error(`Failed to download model: ${response.statusText}`)
      }

      return response.body
    } catch (error) {
      console.error("Failed to download model:", error)
      return null
    }
  }

  async deleteOllamaModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.getEffectiveBaseUrl()}/api/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: modelName })
      })

      return response.ok
    } catch (error) {
      console.error("Failed to delete model:", error)
      return false
    }
  }

  async checkOllamaConnection(): Promise<{ connected: boolean; version?: string; error?: string }> {
    try {
      const response = await fetch(`${this.getEffectiveBaseUrl()}/api/version`)
      if (response.ok) {
        const data = await response.json()
        return { connected: true, version: data.version }
      } else {
        return { connected: false, error: `HTTP ${response.status}: ${response.statusText}` }
      }
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : "Connection failed" 
      }
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }
}

// Initialize the service
let aiServiceInstance: AIService | null = null

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService()
  }
  return aiServiceInstance
}

export const aiService = getAIService()
export type { AIConfig, GenerateOptions, OllamaModelInfo, AIProvider }
