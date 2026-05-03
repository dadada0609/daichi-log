import { Issue, WikiPage, GitCommit, FileNode, SearchResult } from '../types';

// 本番: VITE_API_BASE (e.g. https://daichi-log-backend.onrender.com)
// ローカル: Viteプロキシ経由のため空文字で問題なし
const API_BASE = (import.meta.env.VITE_API_BASE ?? '') + '/api/v1';

export const api = {
  // Search
  searchAll: async (query: string): Promise<SearchResult[]> => {
    if (!query) return [];
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },
  // Issues
  getIssues: async (): Promise<Issue[]> => {
    const res = await fetch(`${API_BASE}/issues`);
    if (!res.ok) throw new Error('Failed to fetch issues');
    return res.json();
  },
  createIssue: async (data: Partial<Issue>): Promise<Issue> => {
    const res = await fetch(`${API_BASE}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create issue');
    return res.json();
  },
  updateIssue: async (issueKey: string, data: Partial<Issue>): Promise<Issue> => {
    const res = await fetch(`${API_BASE}/issues/${issueKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update issue');
    return res.json();
  },
  linkWiki: async (issueKey: string, wikiPageId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/issues/${issueKey}/wiki_link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wikiPageId }),
    });
    if (!res.ok) throw new Error('Failed to link wiki');
  },

  // Wiki
  getWikiPages: async (): Promise<WikiPage[]> => {
    try {
      const res = await fetch(`${API_BASE}/wiki`);
      if (!res.ok) throw new Error('Failed to fetch wiki pages');
      return res.json();
    } catch (e) {
      // Mock fallback if API not implemented
      return [
        { pageId: 'home', title: 'Home', content: '# Welcome', version: 1, createdBy: 'admin', updatedAt: new Date().toISOString() },
        { pageId: 'setup', title: 'Setup Guide', content: '# Setup', version: 1, createdBy: 'admin', updatedAt: new Date().toISOString() }
      ];
    }
  },
  getWikiPage: async (pageId: string): Promise<WikiPage> => {
    const res = await fetch(`${API_BASE}/wiki/${pageId}`);
    if (!res.ok) throw new Error('Failed to fetch wiki page');
    return res.json();
  },
  createOrUpdateWikiPage: async (data: Partial<WikiPage>): Promise<WikiPage> => {
    const res = await fetch(`${API_BASE}/wiki`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save wiki page');
    return res.json();
  },

  // Git
  getCommitsByIssue: async (issueKey: string): Promise<GitCommit[]> => {
    const res = await fetch(`${API_BASE}/issues/${issueKey}/commits`);
    if (!res.ok) throw new Error('Failed to fetch commits');
    return res.json();
  },

  // Files
  getFiles: async (): Promise<FileNode[]> => {
    try {
      const res = await fetch(`${API_BASE}/files`);
      if (!res.ok) throw new Error('Failed to fetch files');
      return res.json();
    } catch (e) {
      // Mock fallback
      return [];
    }
  },
  uploadFile: async (file: File): Promise<FileNode> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/files`, {
      method: 'POST',
      body: formData, // fetch will set multipart/form-data boundary automatically
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json();
  },
  deleteFile: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/files/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete file');
  }
};
