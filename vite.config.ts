import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const resolveBase = () => {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) {
    return '/';
  }

  const [owner, repo] = repository.split('/');
  if (!owner || !repo) {
    return '/';
  }

  if (repo === `${owner}.github.io`) {
    return '/';
  }

  return `/${repo}/`;
};

export default defineConfig(() => ({
  base: resolveBase(),
  plugins: [react()]
}));
