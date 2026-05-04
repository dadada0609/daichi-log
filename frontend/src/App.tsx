import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Home, Plus, List, Columns, GanttChart as GanttIcon, FileText, Book, Folder, Settings as SettingsIcon, Menu } from 'lucide-react';
import IssueBoard from './components/IssueBoard';
import GanttChart from './components/GanttChart';
import WikiViewer from './components/WikiViewer';
import FileSection from './components/FileSection';
import IssueList from './components/IssueList';
import IssueCreatePage from './components/IssueCreatePage';
import IssueCreateModal from './components/IssueCreateModal';
import GlobalSearch from './components/GlobalSearch';
import Settings from './components/Settings';

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Menu size={20} style={{ marginRight: '12px' }} />
        Backlog Clone
      </div>
      <NavLink to="/" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}><Home size={16} /> ホーム</NavLink>
      <NavLink to="/issues/new" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
        <Plus size={16} /> 課題の追加
      </NavLink>
      <NavLink to="/issues" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}><List size={16} /> 課題</NavLink>
      <NavLink to="/board" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}><Columns size={16} /> ボード</NavLink>
      <NavLink to="/gantt" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}><GanttIcon size={16} /> ガントチャート</NavLink>
      <NavLink to="/documents" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}><FileText size={16} /> ドキュメント</NavLink>
      <NavLink to="/wiki" className={({ isActive }) => `sidebar-item ${isActive || location.pathname.startsWith('/wiki') ? 'active' : ''}`}><Book size={16} /> Wiki</NavLink>
      <NavLink to="/files" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}><Folder size={16} /> ファイル</NavLink>
      <div style={{ flex: 1 }} />
      <NavLink to="/settings" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <SettingsIcon size={16} /> プロジェクト設定
      </NavLink>
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState('OPEN');

  useEffect(() => {
    const color = localStorage.getItem('themeColor') || '#de7c9b';
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
              <Route path="/board" element={<IssueBoard refreshCount={refreshCount} onOpenCreateModal={(status) => { setCreateModalStatus(status); setIsCreateModalOpen(true); }} />} />
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
          {isCreateModalOpen && (
            <IssueCreateModal 
              initialStatus={createModalStatus} 
              onClose={() => setIsCreateModalOpen(false)}
              onSuccess={() => setRefreshCount(prev => prev + 1)}
            />
          )}
        </div>
      </div>
    </Router>
  );
};

export default App;
