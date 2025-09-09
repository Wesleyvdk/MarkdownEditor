"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Users,
  Database,
  Activity,
  Shield,
  Server,
  Brain,
  FileText,
  CheckCircle,
  Clock,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
  X,
  Eye,
  EyeOff,
} from "lucide-react"

interface AdminDashboardProps {
  onClose: () => void
}

// Mock data for the admin dashboard
const mockStats = {
  totalUsers: 1247,
  activeUsers: 892,
  totalNotes: 15634,
  aiGenerations: 3421,
  ragQueries: 8765,
  storageUsed: "2.3 GB",
  uptime: "99.9%",
}

const mockUsers = [
  { id: "1", name: "John Doe", email: "john@example.com", role: "Admin", status: "Active", lastSeen: "2 min ago" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", role: "User", status: "Active", lastSeen: "1 hour ago" },
  { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "User", status: "Inactive", lastSeen: "2 days ago" },
  {
    id: "4",
    name: "Alice Brown",
    email: "alice@example.com",
    role: "Moderator",
    status: "Active",
    lastSeen: "5 min ago",
  },
]

const mockLogs = [
  {
    id: "1",
    timestamp: "2024-01-15 14:30:22",
    level: "INFO",
    message: "User john@example.com logged in",
    category: "Auth",
  },
  {
    id: "2",
    timestamp: "2024-01-15 14:28:15",
    level: "ERROR",
    message: "AI generation failed for user jane@example.com",
    category: "AI",
  },
  {
    id: "3",
    timestamp: "2024-01-15 14:25:10",
    level: "INFO",
    message: "RAG system indexed 50 new documents",
    category: "RAG",
  },
  {
    id: "4",
    timestamp: "2024-01-15 14:20:05",
    level: "WARN",
    message: "High memory usage detected on server",
    category: "System",
  },
  {
    id: "5",
    timestamp: "2024-01-15 14:15:30",
    level: "INFO",
    message: "Database backup completed successfully",
    category: "Database",
  },
]

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserRole, setNewUserRole] = useState("User")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-500"
      case "Inactive":
        return "text-red-500"
      default:
        return "text-yellow-500"
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "text-red-500"
      case "WARN":
        return "text-yellow-500"
      case "INFO":
        return "text-blue-500"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Admin Dashboard</h2>
              <p className="text-sm text-muted-foreground">Enterprise management and configuration</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex">
            {/* Sidebar */}
            <div className="w-64 border-r border-border bg-sidebar">
              <TabsList className="flex flex-col h-auto w-full bg-transparent p-2 space-y-1">
                <TabsTrigger value="overview" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="users" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="ai-config" className="w-full justify-start">
                  <Brain className="h-4 w-4 mr-2" />
                  AI Configuration
                </TabsTrigger>
                <TabsTrigger value="rag-system" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  RAG System
                </TabsTrigger>
                <TabsTrigger value="integrations" className="w-full justify-start">
                  <Server className="h-4 w-4 mr-2" />
                  Integrations
                </TabsTrigger>
                <TabsTrigger value="logs" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  System Logs
                </TabsTrigger>
                <TabsTrigger value="settings" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <TabsContent value="overview" className="mt-0">
                    <div className="space-y-6">
                      {/* Stats Cards */}
                      <div className="grid grid-cols-4 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Total Users
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{mockStats.totalUsers.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">{mockStats.activeUsers} active</p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Total Notes
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{mockStats.totalNotes.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">+234 this week</p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <Brain className="h-4 w-4" />
                              AI Generations
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{mockStats.aiGenerations.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">+89 today</p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              RAG Queries
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{mockStats.ragQueries.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">+156 today</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* System Status */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            System Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">System Health</Label>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">All systems operational</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Uptime</Label>
                              <div className="text-lg font-semibold text-green-500">{mockStats.uptime}</div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Storage Used</Label>
                              <div className="text-lg font-semibold">{mockStats.storageUsed}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recent Activity */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Recent Activity
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {mockLogs.slice(0, 5).map((log) => (
                              <div key={log.id} className="flex items-center gap-3 text-sm">
                                <Badge variant="outline" className="text-xs">
                                  {log.category}
                                </Badge>
                                <span className="text-muted-foreground">{log.timestamp}</span>
                                <span className={getLogLevelColor(log.level)}>{log.level}</span>
                                <span className="flex-1">{log.message}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="users" className="mt-0">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">User Management</h3>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add User
                        </Button>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Users</CardTitle>
                          <CardDescription>Manage user accounts and permissions</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {mockUsers.map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center justify-between p-4 border border-border rounded-lg"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{user.name}</h4>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  <Badge variant="outline">{user.role}</Badge>
                                  <span className={`text-sm ${getStatusColor(user.status)}`}>{user.status}</span>
                                  <span className="text-sm text-muted-foreground">{user.lastSeen}</span>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai-config" className="mt-0">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">AI Configuration</h3>

                      <Card>
                        <CardHeader>
                          <CardTitle>Global AI Settings</CardTitle>
                          <CardDescription>Configure AI behavior across the platform</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Default AI Model</Label>
                              <Select defaultValue="gpt-4">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                                  <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                                  <SelectItem value="claude">Claude</SelectItem>
                                  <SelectItem value="llama">Llama 2</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Max Tokens per Request</Label>
                              <Input type="number" defaultValue="4000" />
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Enable AI Features for All Users</Label>
                              <p className="text-sm text-muted-foreground">
                                Allow all users to access AI document generation
                              </p>
                            </div>
                            <Switch defaultChecked />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Rate Limiting</Label>
                              <p className="text-sm text-muted-foreground">Limit AI requests per user per hour</p>
                            </div>
                            <Switch defaultChecked />
                          </div>

                          <div className="space-y-2">
                            <Label>Rate Limit (requests/hour)</Label>
                            <Input type="number" defaultValue="50" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="rag-system" className="mt-0">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">RAG System Management</h3>

                      <Card>
                        <CardHeader>
                          <CardTitle>RAG Configuration</CardTitle>
                          <CardDescription>Configure retrieval augmented generation settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Chunk Size</Label>
                              <Input type="number" defaultValue="1000" />
                            </div>
                            <div className="space-y-2">
                              <Label>Chunk Overlap</Label>
                              <Input type="number" defaultValue="200" />
                            </div>
                            <div className="space-y-2">
                              <Label>Max Results</Label>
                              <Input type="number" defaultValue="5" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Similarity Threshold</Label>
                            <Input type="number" step="0.1" min="0" max="1" defaultValue="0.3" />
                          </div>

                          <Separator />

                          <div className="space-y-4">
                            <h4 className="font-medium">Index Management</h4>
                            <div className="flex items-center gap-4">
                              <Button variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Rebuild Index
                              </Button>
                              <Button variant="outline">
                                <Upload className="h-4 w-4 mr-2" />
                                Export Index
                              </Button>
                              <Button variant="outline">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear Index
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>RAG Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold">15,634</div>
                              <p className="text-sm text-muted-foreground">Indexed Documents</p>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">45,892</div>
                              <p className="text-sm text-muted-foreground">Total Chunks</p>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">8,765</div>
                              <p className="text-sm text-muted-foreground">Queries Today</p>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">0.23s</div>
                              <p className="text-sm text-muted-foreground">Avg Query Time</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="integrations" className="mt-0">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Integrations & API Keys</h3>

                      <Card>
                        <CardHeader>
                          <CardTitle>API Keys</CardTitle>
                          <CardDescription>Manage external service API keys</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {[
                            { name: "OpenAI API Key", service: "OpenAI", status: "Active" },
                            { name: "Anthropic API Key", service: "Claude", status: "Active" },
                            { name: "Ollama Endpoint", service: "Ollama", status: "Connected" },
                            { name: "Supabase Key", service: "Database", status: "Active" },
                          ].map((key, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 border border-border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Server className="h-5 w-5 text-primary" />
                                <div>
                                  <h4 className="font-medium">{key.name}</h4>
                                  <p className="text-sm text-muted-foreground">{key.service}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    key.status === "Active" || key.status === "Connected" ? "default" : "secondary"
                                  }
                                >
                                  {key.status}
                                </Badge>
                                <Button variant="ghost" size="sm" onClick={() => setShowApiKeys(!showApiKeys)}>
                                  {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="logs" className="mt-0">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">System Logs</h3>
                        <div className="flex items-center gap-2">
                          <Select defaultValue="all">
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Levels</SelectItem>
                              <SelectItem value="error">Errors</SelectItem>
                              <SelectItem value="warn">Warnings</SelectItem>
                              <SelectItem value="info">Info</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </div>

                      <Card>
                        <CardContent className="p-0">
                          <div className="space-y-0">
                            {mockLogs.map((log, index) => (
                              <div
                                key={log.id}
                                className={`p-4 border-b border-border last:border-b-0 ${log.level === "ERROR" ? "bg-red-500/5" : log.level === "WARN" ? "bg-yellow-500/5" : ""
                                  }`}
                              >
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground font-mono">{log.timestamp}</span>
                                  <Badge variant="outline" className={`text-xs ${getLogLevelColor(log.level)}`}>
                                    {log.level}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {log.category}
                                  </Badge>
                                  <span className="flex-1">{log.message}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="mt-0">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">System Settings</h3>

                      <Card>
                        <CardHeader>
                          <CardTitle>General Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Application Name</Label>
                            <Input defaultValue="Markdown Editor" />
                          </div>

                          <div className="space-y-2">
                            <Label>Default Theme</Label>
                            <Select defaultValue="dark">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Enable User Registration</Label>
                              <p className="text-sm text-muted-foreground">Allow new users to create accounts</p>
                            </div>
                            <Switch defaultChecked />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Require Email Verification</Label>
                              <p className="text-sm text-muted-foreground">
                                Users must verify their email before accessing the app
                              </p>
                            </div>
                            <Switch defaultChecked />
                          </div>

                          <div className="space-y-2">
                            <Label>Session Timeout (minutes)</Label>
                            <Input type="number" defaultValue="60" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Backup & Maintenance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Automatic Backups</Label>
                              <p className="text-sm text-muted-foreground">Automatically backup data daily</p>
                            </div>
                            <Switch defaultChecked />
                          </div>

                          <div className="space-y-2">
                            <Label>Backup Retention (days)</Label>
                            <Input type="number" defaultValue="30" />
                          </div>

                          <div className="flex items-center gap-2">
                            <Button variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Create Backup
                            </Button>
                            <Button variant="outline">
                              <Upload className="h-4 w-4 mr-2" />
                              Restore Backup
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
            Close
          </Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}
