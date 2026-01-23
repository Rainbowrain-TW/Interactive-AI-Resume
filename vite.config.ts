import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const resolveBase = () => {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) {
    return "/";
  }
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    return "/";
  }
  if (name.toLowerCase() === `${owner.toLowerCase()}.github.io`) {
    return "/";
  }
  return `/${name}/`;
};

export default defineConfig({
  base: resolveBase(),
  plugins: [react()],
});
