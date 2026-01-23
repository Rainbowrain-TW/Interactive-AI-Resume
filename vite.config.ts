import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const resolveBase = () => {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) {
    return "/";
  }
  const [, repoName] = repo.split("/");
  if (!repoName) {
    return "/";
  }
  if (repoName.endsWith(".github.io")) {
    return "/";
  }
  return `/${repoName}/`;
};

export default defineConfig({
  base: resolveBase(),
  plugins: [react()],
});
