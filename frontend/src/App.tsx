import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Plus, List, Columns, GanttChart as GanttIcon, FileText, Book, Folder, Settings as SettingsIcon, Menu } from 'lucide-react';
import IssueBoard from './components/IssueBoard';
import GanttChart from './components/GanttChart';
import WikiViewer from './components/WikiViewer';
import FileSection from './components/FileSection';
import IssueList from './components/IssueList';
import IssueCreatePage from './components/IssueCreatePage';
import GlobalSearch from './components/GlobalSearch';
import Settings from './components/Settings';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Menu size={20} style={{ marginRight: '12px' }} />
        Backlog Clone
      </div>
      <Link to="/" className={`sidebar-item ${isActive('/')}`}><Home size={16} /> ホーム</Link>
      <Link to="/issues/new" className={`sidebar-item ${isActive('/issues/new')}`} style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
        <Plus size={16} /> 課題の追加
      </Link>
      <Link to="/issues" className={`sidebar-item ${isActive('/issues')}`}><List size={16} /> 課題</Link>
      <Link to="/board" className={`sidebar-item ${isActive('/board')}`}><Columns size={16} /> ボード</Link>
      <Link to="/gantt" className={`sidebar-item ${isActive('/gantt')}`}><GanttIcon size={16} /> ガントチャート</Link>
      <Link to="/documents" className={`sidebar-item ${isActive('/documents')}`}><FileText size={16} /> ドキュメント</Link>
      <Link to="/wiki" className={`sidebar-item ${location.pathname.startsWith('/wiki') ? 'active' : ''}`}><Book size={16} /> Wiki</Link>
      <Link to="/files" className={`sidebar-item ${isActive('/files')}`}><Folder size={16} /> ファイル</Link>
      <div style={{ flex: 1 }} />
      <Link to="/settings" className={`sidebar-item ${isActive('/settings')}`} style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <SettingsIcon size={16} /> プロジェクト設定
      </Link>
    </div>
  );
};

const TopNav = () => {
  const [projectName, setProjectName] = useState('SDK_TEST_INTERNAL');
  const [projectKey, setProjectKey] = useState('SDK_TI');

  useEffect(() => {
    const updateNav = () => {
      setProjectName(localStorage.getItem('projectName') || 'SDK_TEST_INTERNAL');
      setProjectKey(localStorage.getItem('projectKey') || 'SDK_TI');
    };
    updateNav();
    window.addEventListener('storage-update', updateNav);
    return () => window.removeEventListener('storage-update', updateNav);
  }, []);

  return (
    <div className="top-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="project-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--primary-color)' }}>★</span> {projectName} ({projectKey})
      </div>
      <GlobalSearch />
    </div>
  );
};

const App: React.FC = () => {
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const color = localStorage.getItem('themeColor') || '#ea5c83';
    document.documentElement.style.setProperty('--primary-color', color);
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-wrapper">
          <TopNav />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<div className="panel"><div className="panel-header">プロジェクトホーム</div><div className="panel-body">最近の更新履歴が表示されます...</div></div>} />
              <Route path="/board" element={<IssueBoard refreshCount={refreshCount} onOpenCreateModal={() => {}} />} />
              <Route path="/gantt" element={<GanttChart refreshCount={refreshCount} />} />
              <Route path="/wiki" element={<WikiViewer />} />
              <Route path="/wiki/:pageId" element={<WikiViewer />} />
              <Route path="/issues" element={<IssueList refreshCount={refreshCount} />} />
              <Route path="/issues/new" element={<IssueCreatePage onSuccess={() => setRefreshCount(prev => prev + 1)} />} />
              <Route path="/documents" element={<div className="panel"><div className="panel-header">ドキュメント</div><div className="panel-body"></div></div>} />
              <Route path="/files" element={<FileSection />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
