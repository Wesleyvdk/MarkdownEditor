"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Palette,
  Type,
  Keyboard,
  Download,
  Upload,
  Shield,
  Monitor,
  Moon,
  Sun,
  X,
  Save,
  RotateCcw,
  Database,
  Send as Sync,
} from "lucide-react"

interface GeneralSettingsProps {
  onClose: () => void
}

export function GeneralSettings({ onClose }: GeneralSettingsProps) {
  const [theme, setTheme] = useState("dark")
  const [fontSize, setFontSize] = useState("14")
  const [fontFamily, setFontFamily] = useState("inter")
  const [lineHeight, setLineHeight] = useState("1.6")
  const [showLineNumbers, setShowLineNumbers] = useState(false)
  const [wordWrap, setWordWrap] = useState(true)
  const [autoSave, setAutoSave] = useState(true)
  const [autoSaveInterval, setAutoSaveInterval] = useState("30")
  const [spellCheck, setSpellCheck] = useState(true)
  const [enableSync, setEnableSync] = useState(false)
  const [syncProvider, setSyncProvider] = useState("none")
  const [language, setLanguage] = useState("en")
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD")
  const [timeFormat, setTimeFormat] = useState("24h")
  const [enableAnalytics, setEnableAnalytics] = useState(false)
  const [enableCrashReports, setEnableCrashReports] = useState(true)

  const handleReset = () => {
    setTheme("dark")
    setFontSize("14")
    setFontFamily("inter")
    setLineHeight("1.6")
    setShowLineNumbers(false)
    setWordWrap(true)
    setAutoSave(true)
    setAutoSaveInterval("30")
    setSpellCheck(true)
    setEnableSync(false)
    setSyncProvider("none")
    setLanguage("en")
    setDateFormat("YYYY-MM-DD")
    setTimeFormat("24h")
    setEnableAnalytics(false)
    setEnableCrashReports(true)
  }

  const handleExportSettings = () => {
    const settings = {
      theme,
      fontSize,
      fontFamily,
      lineHeight,
      showLineNumbers,
      wordWrap,
      autoSave,
      autoSaveInterval,
      spellCheck,
      enableSync,
      syncProvider,
      language,
      dateFormat,
      timeFormat,
      enableAnalytics,
      enableCrashReports,
    }

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "markdown-editor-settings.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string)
        setTheme(settings.theme || "dark")
        setFontSize(settings.fontSize || "14")
        setFontFamily(settings.fontFamily || "inter")
        setLineHeight(settings.lineHeight || "1.6")
        setShowLineNumbers(settings.showLineNumbers || false)
        setWordWrap(settings.wordWrap !== false)
        setAutoSave(settings.autoSave !== false)
        setAutoSaveInterval(settings.autoSaveInterval || "30")
        setSpellCheck(settings.spellCheck !== false)
        setEnableSync(settings.enableSync || false)
        setSyncProvider(settings.syncProvider || "none")
        setLanguage(settings.language || "en")
        setDateFormat(settings.dateFormat || "YYYY-MM-DD")
        setTimeFormat(settings.timeFormat || "24h")
        setEnableAnalytics(settings.enableAnalytics || false)
        setEnableCrashReports(settings.enableCrashReports !== false)
      } catch (error) {
        console.error("Failed to import settings:", error)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Settings</h2>
              <p className="text-sm text-muted-foreground">Customize your markdown editor experience</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="appearance" className="h-full flex">
            {/* Sidebar */}
            <div className="w-64 border-r border-border bg-sidebar">
              <TabsList className="flex flex-col h-auto w-full bg-transparent p-2 space-y-1">
                <TabsTrigger value="appearance" className="w-full justify-start">
                  <Palette className="h-4 w-4 mr-2" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="editor" className="w-full justify-start">
                  <Type className="h-4 w-4 mr-2" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="sync" className="w-full justify-start">
                  <Sync className="h-4 w-4 mr-2" />
                  Sync & Backup
                </TabsTrigger>
                <TabsTrigger value="shortcuts" className="w-full justify-start">
                  <Keyboard className="h-4 w-4 mr-2" />
                  Shortcuts
                </TabsTrigger>
                <TabsTrigger value="privacy" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Privacy
                </TabsTrigger>
                <TabsTrigger value="advanced" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <TabsContent value="appearance" className="mt-0">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            Theme & Colors
                          </CardTitle>
                          <CardDescription>Customize the visual appearance of your editor</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Theme</Label>
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { value: "light", label: "Light", icon: Sun },
                                { value: "dark", label: "Dark", icon: Moon },
                                { value: "system", label: "System", icon: Monitor },
                              ].map(({ value, label, icon: Icon }) => (
                                <div
                                  key={value}
                                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                    theme === value
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/50"
                                  }`}
                                  onClick={() => setTheme(value)}
                                >
                                  <div className="flex flex-col items-center gap-2">
                                    <Icon className="h-5 w-5" />
                                    <span className="text-sm font-medium">{label}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="font-family">Font Family</Label>
                              <Select value={fontFamily} onValueChange={setFontFamily}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="inter">Inter</SelectItem>
                                  <SelectItem value="system">System Default</SelectItem>
                                  <SelectItem value="roboto">Roboto</SelectItem>
                                  <SelectItem value="opensans">Open Sans</SelectItem>
                                  <SelectItem value="jetbrains">JetBrains Mono</SelectItem>
                                  <SelectItem value="firacode">Fira Code</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="font-size">Font Size</Label>
                              <Select value={fontSize} onValueChange={setFontSize}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="12">12px</SelectItem>
                                  <SelectItem value="13">13px</SelectItem>
                                  <SelectItem value="14">14px</SelectItem>
                                  <SelectItem value="15">15px</SelectItem>
                                  <SelectItem value="16">16px</SelectItem>
                                  <SelectItem value="18">18px</SelectItem>
                                  <SelectItem value="20">20px</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="editor" className="mt-0">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Type className="h-5 w-5" />
                            Editor Preferences
                          </CardTitle>
                          <CardDescription>Configure how the editor behaves and looks</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="line-height">Line Height</Label>
                              <Select value={lineHeight} onValueChange={setLineHeight}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1.2">1.2</SelectItem>
                                  <SelectItem value="1.4">1.4</SelectItem>
                                  <SelectItem value="1.6">1.6</SelectItem>
                                  <SelectItem value="1.8">1.8</SelectItem>
                                  <SelectItem value="2.0">2.0</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="auto-save-interval">Auto-save Interval (seconds)</Label>
                              <Input
                                id="auto-save-interval"
                                type="number"
                                min="5"
                                max="300"
                                value={autoSaveInterval}
                                onChange={(e) => setAutoSaveInterval(e.target.value)}
                              />
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label>Show Line Numbers</Label>
                                <p className="text-sm text-muted-foreground">Display line numbers in the editor</p>
                              </div>
                              <Switch checked={showLineNumbers} onCheckedChange={setShowLineNumbers} />
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label>Word Wrap</Label>
                                <p className="text-sm text-muted-foreground">Wrap long lines to fit the editor width</p>
                              </div>
                              <Switch checked={wordWrap} onCheckedChange={setWordWrap} />
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label>Auto-save</Label>
                                <p className="text-sm text-muted-foreground">Automatically save changes</p>
                              </div>
                              <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label>Spell Check</Label>
                                <p className="text-sm text-muted-foreground">Enable spell checking while typing</p>
                              </div>
                              <Switch checked={spellCheck} onCheckedChange={setSpellCheck} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="sync" className="mt-0">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Sync className="h-5 w-5" />
                            Sync & Backup
                          </CardTitle>
                          <CardDescription>Configure cloud sync and backup options</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Enable Cloud Sync</Label>
                              <p className="text-sm text-muted-foreground">Sync your notes across devices</p>
                            </div>
                            <Switch checked={enableSync} onCheckedChange={setEnableSync} />
                          </div>

                          {enableSync && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Sync Provider</Label>
                                <Select value={syncProvider} onValueChange={setSyncProvider}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose a sync provider" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="github">GitHub</SelectItem>
                                    <SelectItem value="dropbox">Dropbox</SelectItem>
                                    <SelectItem value="googledrive">Google Drive</SelectItem>
                                    <SelectItem value="onedrive">OneDrive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="p-4 bg-muted/50 rounded-lg">
                                <h4 className="text-sm font-medium mb-2">Sync Status</h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Database className="h-4 w-4" />
                                  <span>Last sync: Never</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <Separator />

                          <div className="space-y-4">
                            <h4 className="text-sm font-medium">Backup & Export</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <Button variant="outline" onClick={handleExportSettings}>
                                <Download className="h-4 w-4 mr-2" />
                                Export Settings
                              </Button>
                              <div>
                                <input
                                  type="file"
                                  accept=".json"
                                  onChange={handleImportSettings}
                                  className="hidden"
                                  id="import-settings"
                                />
                                <Button variant="outline" asChild className="w-full bg-transparent">
                                  <label htmlFor="import-settings" className="cursor-pointer">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import Settings
                                  </label>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="shortcuts" className="mt-0">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Keyboard className="h-5 w-5" />
                            Keyboard Shortcuts
                          </CardTitle>
                          <CardDescription>Customize keyboard shortcuts for faster editing</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {[
                              { action: "Save Note", shortcut: "Ctrl+S", category: "File" },
                              { action: "New Note", shortcut: "Ctrl+N", category: "File" },
                              { action: "Search Notes", shortcut: "Ctrl+F", category: "Navigation" },
                              { action: "Bold Text", shortcut: "Ctrl+B", category: "Formatting" },
                              { action: "Italic Text", shortcut: "Ctrl+I", category: "Formatting" },
                              { action: "Insert Link", shortcut: "Ctrl+K", category: "Formatting" },
                              { action: "Toggle Preview", shortcut: "Ctrl+P", category: "View" },
                              { action: "AI Generate", shortcut: "Ctrl+G", category: "AI" },
                            ].map((shortcut, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 border border-border rounded-lg"
                              >
                                <div>
                                  <h4 className="font-medium text-sm">{shortcut.action}</h4>
                                  <p className="text-xs text-muted-foreground">{shortcut.category}</p>
                                </div>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {shortcut.shortcut}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="privacy" className="mt-0">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Privacy & Security
                          </CardTitle>
                          <CardDescription>Control your data and privacy settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Analytics</Label>
                              <p className="text-sm text-muted-foreground">
                                Help improve the app by sharing usage data
                              </p>
                            </div>
                            <Switch checked={enableAnalytics} onCheckedChange={setEnableAnalytics} />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Crash Reports</Label>
                              <p className="text-sm text-muted-foreground">Automatically send crash reports</p>
                            </div>
                            <Switch checked={enableCrashReports} onCheckedChange={setEnableCrashReports} />
                          </div>

                          <Separator />

                          <div className="space-y-4">
                            <h4 className="text-sm font-medium">Data Management</h4>
                            <div className="grid grid-cols-1 gap-3">
                              <Button variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Export All Data
                              </Button>
                              <Button variant="destructive">
                                <X className="h-4 w-4 mr-2" />
                                Delete All Data
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="mt-0">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Advanced Settings
                          </CardTitle>
                          <CardDescription>Advanced configuration options</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="language">Language</Label>
                              <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="en">English</SelectItem>
                                  <SelectItem value="es">Español</SelectItem>
                                  <SelectItem value="fr">Français</SelectItem>
                                  <SelectItem value="de">Deutsch</SelectItem>
                                  <SelectItem value="ja">日本語</SelectItem>
                                  <SelectItem value="zh">中文</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="date-format">Date Format</Label>
                              <Select value={dateFormat} onValueChange={setDateFormat}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                  <SelectItem value="DD.MM.YYYY">DD.MM.YYYY</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="time-format">Time Format</Label>
                            <Select value={timeFormat} onValueChange={setTimeFormat}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="24h">24 Hour</SelectItem>
                                <SelectItem value="12h">12 Hour</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Separator />

                          <div className="space-y-4">
                            <h4 className="text-sm font-medium">Reset Settings</h4>
                            <Button variant="outline" onClick={handleReset}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reset to Defaults
                            </Button>
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
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
