import type { ActionFunctionArgs, LoaderFunctionArgs } from "@react-router/node";
import { notesService } from "../lib/notes-service";
import type { NewNote } from "../database/schema";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  
  if (!userId) {
    return new Response(JSON.stringify({ error: "userId parameter is required" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const notes = await notesService.getUserNotes(userId);
    return new Response(JSON.stringify(notes), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch notes" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const method = request.method;
  
  if (method === "POST") {
    try {
      const data: NewNote = await request.json();
      
      // Validate required fields
      if (!data.userId || !data.title || data.content === undefined) {
        return new Response(JSON.stringify({
          error: "Missing required fields: userId, title, and content are required"
        }), { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Create the note
      const note = await notesService.createNote(data.userId, {
        title: data.title,
        content: data.content,
        tags: data.tags || [],
      });

      return new Response(JSON.stringify(note), { 
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error creating note:", error);
      return new Response(JSON.stringify({ error: "Failed to create note" }), { 
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