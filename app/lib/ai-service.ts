interface AIProvider {
  name: string
  type: "local" | "cloud"
  models: string[]
  requiresApiKey: boolean
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
    models: ["llama3.2", "codellama", "mistral", "phi3", "gemma2"],
    requiresApiKey: false,
  },
  openai: {
    name: "OpenAI",
    type: "cloud",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    requiresApiKey: true,
  },
  anthropic: {
    name: "Anthropic",
    type: "cloud",
    models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
    requiresApiKey: true,
  },
  groq: {
    name: "Groq",
    type: "cloud",
    models: ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    requiresApiKey: true,
  },
  gemini: {
    name: "Google Gemini",
    type: "cloud",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"],
    requiresApiKey: true,
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

  setConfig(config: Partial<AIConfig>) {
    this.config = { ...this.config, ...config }
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

    const response = await fetch(`${this.config.baseUrl}/api/generate`, {
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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
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

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
      `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
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

  async testConnection(): Promise<boolean> {
    try {
      switch (this.config.provider) {
        case "ollama":
          const response = await fetch(`${this.config.baseUrl}/api/tags`)
          return response.ok
        case "openai":
          const openaiResponse = await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${this.config.apiKey}` },
          })
          return openaiResponse.ok
        case "anthropic":
          // Anthropic doesn't have a simple health check, so we'll try a minimal request
          return !!this.config.apiKey
        case "groq":
          const groqResponse = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { Authorization: `Bearer ${this.config.apiKey}` },
          })
          return groqResponse.ok
        case "gemini":
          return !!this.config.apiKey
        default:
          return false
      }
    } catch {
      return false
    }
  }

  async getAvailableModels(): Promise<string[]> {
    const provider = AI_PROVIDERS[this.config.provider]
    if (!provider) return []

    if (provider.type === "local" && this.config.provider === "ollama") {
      try {
        const response = await fetch(`${this.config.baseUrl}/api/tags`)
        if (response.ok) {
          const data = await response.json()
          return data.models?.map((model: any) => model.name) || []
        }
      } catch {
        // Fall back to default models
      }
    }

    return provider.models
  }
}

export const aiService = new AIService()
export type { AIConfig, GenerateOptions }
