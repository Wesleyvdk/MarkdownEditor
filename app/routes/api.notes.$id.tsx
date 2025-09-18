import type { ActionFunctionArgs, LoaderFunctionArgs } from "@react-router/node";
import { notesService } from "../lib/notes-service";
import type { UpdateNoteRequest } from "../lib/notes-service";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const noteId = params.id;
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  
  if (!userId) {
    return new Response(JSON.stringify({ error: "userId parameter is required" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!noteId) {
    return new Response(JSON.stringify({ error: "Note ID is required" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const note = await notesService.getNoteById(userId, noteId);
    
    if (!note) {
      return new Response(JSON.stringify({ error: "Note not found" }), { 
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(note), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching note:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch note" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const method = request.method;
  const noteId = params.id;
  
  if (!noteId) {
    return new Response(JSON.stringify({ error: "Note ID is required" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  if (method === "PUT") {
    try {
      const data: UpdateNoteRequest = await request.json();
      const url = new URL(request.url);
      const userId = url.searchParams.get("userId");
      
      // Validate required fields
      if (!userId) {
        return new Response(JSON.stringify({
          error: "userId parameter is required"
        }), { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Update the note
      const note = await notesService.updateNote(userId, noteId, data);

      return new Response(JSON.stringify(note), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error updating note:", error);
      return new Response(JSON.stringify({ error: "Failed to update note" }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  
  if (method === "DELETE") {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get("userId");
      
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId parameter is required" }), { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      await notesService.deleteNote(userId, noteId);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      return new Response(JSON.stringify({ error: "Failed to delete note" }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  
  return new Response(JSON.stringify({ error: "Method not allowed" }), { 
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
}