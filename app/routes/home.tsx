"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { NotesList } from "@/components/notes-list"
import { MarkdownEditor } from "@/components/markdown-editor"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { PanelLeftOpen, PanelLeftClose } from "lucide-react"

const mockNotes = [
  {
    id: "1",
    title: "Getting Started",
    content: `# Getting Started

Welcome to your new **markdown editor**! This is where you can write and organize your thoughts.

## Features

- **Split view** with live preview
- **Bidirectional linking** using [[note-title]] syntax
- **Tag management** for organization
- **Search functionality** across all notes
- **AI-powered document generation** with RAG support

## Writing Tips

Use \`markdown syntax\` to format your text:

- *Italic text* with single asterisks
- **Bold text** with double asterisks
- \`Inline code\` with backticks

> This is a blockquote for important information

### Code Blocks

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

## Links and References

You can link to other notes using [[Project Ideas]] syntax. These will become clickable links once the notes exist.

Try linking to [[Meeting Notes]] or create a new note by typing [[New Note Title]].

Happy writing!`,
    tags: ["tutorial", "basics"],
    lastModified: "2024-01-15",
  },
  {
    id: "2",
    title: "Project Ideas",
    content: `# Project Ideas

## Web Development Projects

### Personal Portfolio Website
- Modern design with dark/light theme
- Responsive layout for all devices
- Interactive animations and transitions
- Blog integration for sharing thoughts
- Contact form with email integration

### Task Management App
- Create, edit, and delete tasks
- Priority levels and due dates
- Categories and tags for organization
- Progress tracking and statistics
- Team collaboration features

### E-commerce Platform
- Product catalog with search and filters
- Shopping cart and checkout process
- User accounts and order history
- Payment integration (Stripe, PayPal)
- Admin dashboard for inventory management

## Mobile App Ideas

### Habit Tracker
- Daily habit logging
- Streak tracking and motivation
- Custom habit categories
- Progress visualization with charts
- Reminder notifications

### Recipe Manager
- Save and organize favorite recipes
- Meal planning calendar
- Shopping list generation
- Nutritional information tracking
- Recipe sharing with friends

## AI/ML Projects

### Document Summarizer
- Extract key points from long documents
- Support for multiple file formats
- Customizable summary length
- Integration with note-taking apps
- Batch processing capabilities

### Smart Note Assistant
- Automatic tagging and categorization
- Content suggestions based on context
- Link recommendations between related notes
- Writing style analysis and improvement tips
- Knowledge graph visualization`,
    tags: ["brainstorm", "projects", "development"],
    lastModified: "2024-01-14",
  },
  {
    id: "3",
    title: "Meeting Notes",
    content: `# Weekly Team Meeting - January 12, 2024

## Attendees
- John Smith (Project Manager)
- Sarah Johnson (Lead Developer)
- Mike Chen (UI/UX Designer)
- Lisa Wang (QA Engineer)

## Agenda
1. Sprint review and retrospective
2. Upcoming feature priorities
3. Technical debt discussion
4. Resource allocation for Q1

## Discussion Points

### Sprint Review
- Successfully completed 8 out of 10 planned user stories
- Two stories moved to next sprint due to complexity
- Overall team velocity improved by 15%
- Customer feedback on new features has been positive

### Feature Priorities
- **High Priority**: User authentication system overhaul
- **Medium Priority**: Mobile app responsive design improvements
- **Low Priority**: Advanced search functionality

### Technical Debt
- Legacy code refactoring needed in user management module
- Database optimization required for better performance
- Unit test coverage should be increased to 80%

## Decisions Made
1. Allocate 20% of next sprint to technical debt reduction
2. Hire additional frontend developer for mobile improvements
3. Implement automated testing pipeline by end of month

## Action Items
- [ ] Sarah: Create technical debt backlog items - Due: Jan 15
- [ ] Mike: Design mockups for mobile improvements - Due: Jan 18
- [ ] Lisa: Set up automated testing framework - Due: Jan 20
- [ ] John: Post job listing for frontend developer - Due: Jan 16

## Next Meeting
- Date: January 19, 2024
- Time: 10:00 AM
- Location: Conference Room B / Zoom`,
    tags: ["work", "meetings", "planning"],
    lastModified: "2024-01-13",
  },
  {
    id: "4",
    title: "Daily Journal",
    content: `# Daily Journal Entries

## January 15, 2024

Today was a productive day working on the new markdown editor project. Made significant progress on the AI integration features and RAG system implementation. The bidirectional linking system is working well, and users should find it intuitive to navigate between related notes.

### Accomplishments
- Completed RAG service implementation
- Added AI document generation with multiple templates
- Improved code syntax highlighting
- Fixed several UI bugs in dark mode

### Challenges
- Integrating the RAG system with the existing note structure required some refactoring
- Performance optimization needed for large document collections
- Need to improve the search algorithm for better relevance scoring

### Tomorrow's Goals
- Finish the admin dashboard implementation
- Add user authentication system
- Write comprehensive documentation
- Conduct user testing sessions

## January 14, 2024

Focused on the core editor functionality today. The line-by-line editing system is working much better now, and the markdown rendering feels more natural and responsive.

### Key Insights
- Users prefer inline editing over split-pane views
- Code blocks need special handling in the line-by-line system
- Tag management is crucial for note organization
- Link visualization helps users understand note relationships

### Learning Notes
- React state management becomes complex with nested editing states
- Performance considerations are important for real-time markdown rendering
- User experience should prioritize simplicity over feature complexity

## January 13, 2024

Started working on the project architecture and component structure. Decided to use a modular approach with separate components for different functionalities.

### Architecture Decisions
- Component-based design for maintainability
- Centralized state management for note data
- Separate services for AI and RAG functionality
- Responsive design with mobile-first approach

### Research Findings
- Obsidian's editing model is highly regarded by users
- RAG systems significantly improve AI-generated content quality
- Real-time collaboration features are increasingly expected
- Privacy and data security are top user concerns`,
    tags: ["personal", "reflection", "development"],
    lastModified: "2024-01-12",
  },
  {
    id: "5",
    title: "Research Notes",
    content: `# Research Notes: AI-Powered Note-Taking Systems

## Overview
This document contains research findings on modern note-taking applications, AI integration patterns, and user experience best practices for knowledge management systems.

## Market Analysis

### Leading Platforms
1. **Obsidian**
   - Graph-based note linking
   - Plugin ecosystem
   - Local file storage
   - Strong community support

2. **Notion**
   - Database integration
   - Team collaboration features
   - Template system
   - Block-based editing

3. **Roam Research**
   - Bidirectional linking pioneer
   - Daily notes concept
   - Block references
   - Graph database approach

### Key Trends
- **AI Integration**: GPT-powered writing assistance, content generation, and smart suggestions
- **Knowledge Graphs**: Visual representation of note relationships and connections
- **Real-time Collaboration**: Multi-user editing and sharing capabilities
- **Cross-platform Sync**: Seamless experience across desktop, web, and mobile
- **Privacy Focus**: Local-first storage and end-to-end encryption

## Technical Implementation Patterns

### RAG (Retrieval Augmented Generation)
- **Purpose**: Enhance AI responses with relevant context from existing notes
- **Components**: Document indexing, similarity search, context injection
- **Benefits**: More accurate and contextually relevant AI-generated content
- **Challenges**: Performance optimization, relevance scoring, context window limits

### Bidirectional Linking
- **Implementation**: Parse [[note-title]] syntax and maintain link relationships
- **Features**: Autocomplete, backlink tracking, orphaned note detection
- **UI Patterns**: Hover previews, graph visualization, link suggestions

### Real-time Editing
- **Approaches**: Operational transforms, conflict-free replicated data types (CRDTs)
- **Considerations**: Network latency, offline support, merge conflict resolution
- **User Experience**: Live cursors, presence indicators, change highlighting

## User Experience Research

### Core User Needs
1. **Quick Capture**: Rapid note creation and editing
2. **Easy Navigation**: Intuitive browsing and search
3. **Flexible Organization**: Tags, folders, and custom structures
4. **Content Discovery**: Finding related and relevant information
5. **Export/Import**: Data portability and backup options

### Interaction Patterns
- **Progressive Disclosure**: Show advanced features only when needed
- **Contextual Actions**: Right-click menus and keyboard shortcuts
- **Visual Feedback**: Loading states, success confirmations, error handling
- **Accessibility**: Screen reader support, keyboard navigation, high contrast modes

## AI Integration Best Practices

### Content Generation
- **Template-based**: Structured prompts for consistent output
- **Context-aware**: Use existing notes to inform new content
- **User Control**: Allow editing and refinement of AI suggestions
- **Transparency**: Clear indication of AI-generated content

### Smart Features
- **Auto-tagging**: Suggest relevant tags based on content analysis
- **Link Suggestions**: Recommend connections to existing notes
- **Content Summarization**: Generate abstracts and key points
- **Writing Assistance**: Grammar, style, and clarity improvements

## Implementation Recommendations

### Architecture
- **Modular Design**: Separate concerns for editing, AI, storage, and sync
- **Plugin System**: Allow third-party extensions and customizations
- **API-first**: Enable integrations with external tools and services
- **Performance**: Optimize for large document collections and real-time updates

### Security & Privacy
- **Local-first**: Store data locally with optional cloud sync
- **Encryption**: Protect sensitive information at rest and in transit
- **User Control**: Granular privacy settings and data management
- **Compliance**: GDPR, CCPA, and other regulatory requirements

### Scalability
- **Efficient Indexing**: Fast search across large note collections
- **Lazy Loading**: Load content on-demand to improve performance
- **Caching Strategies**: Reduce API calls and improve responsiveness
- **Database Optimization**: Proper indexing and query optimization`,
    tags: ["research", "academic", "ai", "ux"],
    lastModified: "2024-01-11",
  },
]

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setSidebarOpen(window.innerWidth >= 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <div className="flex h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed md:relative z-50 md:z-auto w-80 md:w-80 h-full transition-transform duration-300 md:transition-all border-r border-border`}
      >
        <Sidebar onNoteSelect={setSelectedNote} selectedNote={selectedNote} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 md:p-4 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
          <h1 className="text-base md:text-lg font-semibold truncate">Markdown Editor</h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {selectedNote ? <MarkdownEditor noteId={selectedNote} /> : <NotesList onNoteSelect={setSelectedNote} />}
        </div>
      </div>
    </div>
  )
}
