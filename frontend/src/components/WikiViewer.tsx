import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../api/client';
import { WikiPage } from '../types';
import { Edit2, Save, FileText, Plus } from 'lucide-react';

const WikiViewer: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [page, setPage] = useState<WikiPage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPages = useCallback(async () => {
    try {
      const data = await api.getWikiPages();
      setPages(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load wiki pages', e);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      try {
        const data = await api.getWikiPage(pageId || 'home');
        setPage(data);
        setContent(data.content);
        setTitle(data.title);
        setIsEditing(false);
      } catch (e) {
        setPage({
          pageId: pageId || 'home',
          title: pageId === 'home' ? 'Home' : '新規ページ',
          content: '# Wiki\nMarkdown形式で記述できます。',
          version: 1,
          createdBy: 'admin',
          updatedAt: new Date().toISOString()
        });
        setTitle(pageId === 'home' ? 'Home' : '新規ページ');
        setContent('# Wiki\nMarkdown形式で記述できます。');
        if (pageId && pageId !== 'home') setIsEditing(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [pageId]);

  const handleSave = async () => {
    if (!page) return;
    try {
      const updated = await api.createOrUpdateWikiPage({
        ...page,
        title,
        content
      });
      setPage(updated);
      setIsEditing(false);
      await fetchPages();
      if (page.pageId !== updated.pageId) {
        navigate(`/wiki/${updated.pageId}`);
      }
    } catch (e) {
      console.error('Wikiの保存に失敗しました:', e);
      const mockUpdated = { ...page, title, content, updatedAt: new Date().toISOString() };
      setPage(mockUpdated);
      setIsEditing(false);
      
      setPages(prev => {
        const exists = prev.find(p => p.pageId === mockUpdated.pageId);
        if (exists) return prev.map(p => p.pageId === mockUpdated.pageId ? mockUpdated : p);
        return [...prev, mockUpdated];
      });
    }
  };

  const handleNewPage = () => {
    const newId = `page-${Date.now()}`;
    navigate(`/wiki/${newId}`);
  };

  return (
    <div style={{ display: 'flex', gap: '16px', height: '100%', flex: 1 }}>
      <div className="panel" style={{ width: '250px', display: 'flex', flexDirection: 'column' }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>ページ一覧</span>
          <Plus size={16} style={{ cursor: 'pointer', color: 'var(--text-sub)' }} onClick={handleNewPage} />
        </div>
        <div className="panel-body" style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
          {pages.map(p => (
            <div 
              key={p.pageId} 
              onClick={() => navigate(`/wiki/${p.pageId}`)}
              style={{ 
                padding: '12px 16px', 
                borderBottom: '1px solid var(--border-color)', 
                cursor: 'pointer',
                backgroundColor: p.pageId === (pageId || 'home') ? '#f0f4f8' : '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FileText size={14} color="var(--text-sub)" />
              <span style={{ fontSize: '13px', fontWeight: p.pageId === (pageId || 'home') ? 'bold' : 'normal', color: p.pageId === (pageId || 'home') ? 'var(--link-color)' : 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.title}
              </span>
            </div>
          ))}
          {pages.length === 0 && (
             <div style={{ padding: '16px', color: 'var(--text-sub)', fontSize: '13px' }}>ページがありません</div>
          )}
        </div>
      </div>

      <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ padding: '24px', color: 'var(--text-sub)' }}>読み込み中...</div>
        ) : page ? (
          <>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafbfc' }}>
              {isEditing ? (
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  style={{ fontSize: '16px', fontWeight: 'bold', padding: '4px 8px', width: '300px' }} 
                />
              ) : (
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{page.title}</span>
              )}
              
              <button 
                className={`btn ${isEditing ? 'btn-primary' : ''}`}
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              >
                {isEditing ? <><Save size={14} /> 保存</> : <><Edit2 size={14} /> 編集</>}
              </button>
            </div>

            <div className="panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
              {isEditing ? (
                <textarea
                  style={{ flex: 1, minHeight: '500px', resize: 'vertical', fontFamily: 'monospace', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              ) : (
                <div style={{ flex: 1, lineHeight: 1.6, fontSize: '14px' }} className="markdown-body">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              )}
            </div>
            
            <div style={{ padding: '12px 24px', fontSize: '12px', color: 'var(--text-sub)', borderTop: '1px solid var(--border-color)', backgroundColor: '#fafbfc', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px' }}>
              最終更新: {new Date(page.updatedAt).toLocaleString()} by {page.createdBy}
            </div>
          </>
        ) : (
          <div style={{ padding: '24px', color: 'var(--text-sub)' }}>ページが見つかりません。</div>
        )}
      </div>
    </div>
  );
};

export default WikiViewer;
