export interface Issue {
  issueKey: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignee: string | null;
  startDate: string | null; // YYYY-MM-DD
  dueDate: string | null;   // YYYY-MM-DD
  estimatedHours: number | null;
  actualHours: number | null;
  categoryIds?: string[];
  milestoneIds?: string[];
  versionIds?: string[];
}

export interface SearchResult {
  type: 'issue' | 'wiki' | 'file';
  id: string;
  title: string;
  match: string;
}

export interface WikiPage {
  pageId: string;
  title: string;
  content: string;
  version: number;
  createdBy: string;
  updatedAt: string;
}

export interface GitCommit {
  commitHash: string;
  author: string;
  message: string;
  timestamp: string;
}

export interface FileNode {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}
