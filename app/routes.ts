import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/notes", "routes/api.notes.tsx"),
  route("api/notes/:id", "routes/api.notes.$id.tsx"),
] satisfies RouteConfig;
