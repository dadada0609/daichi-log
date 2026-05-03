import React, { useState, useEffect } from 'react';
import { Issue, SearchResult } from '../types';
import { api } from '../api/client';
import { X, Save, Link as LinkIcon, Search, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  issue: Issue;
  onClose: () => void;
  onSave: (updated: Issue) => Promise<void>;
}

const IssueDetailModal: React.FC<Props> = ({ issue, onClose, onSave }) => {
  const [formData, setFormData] = useState<Issue>({ ...issue });
  const [isSaving, setIsSaving] = useState(false);
  const [showWikiSelect, setShowWikiSelect] = useState(false);
  const [wikiQuery, setWikiQuery] = useState('');
  const [wikiResults, setWikiResults] = useState<SearchResult[]>([]);
  const [linkedWikis, setLinkedWikis] = useState<{ id: string, title: string }[]>([]);
  const [linkLoading, setLinkLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (field: keyof Issue, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  // 課題のdescriptionに存在するWikiリンクをパースして表示用にする簡易ロジック
  useEffect(() => {
    if (formData.description) {
      const regex = /\[([^\]]+)\]\(\/wiki\/([^\)]+)\)/g;
      let match;
      const wikis = [];
      while ((match = regex.exec(formData.description)) !== null) {
        wikis.push({ id: match[2], title: match[1] });
      }
      setLinkedWikis(wikis);
    }
  }, [formData.description]);

  useEffect(() => {
    const fetchWikis = async () => {
      if (wikiQuery.trim().length > 0) {
        const res = await api.searchAll(wikiQuery);
        setWikiResults(res.filter(r => r.type === 'wiki'));
      } else {
        setWikiResults([]);
      }
    };
    const timer = setTimeout(fetchWikis, 300);
    return () => clearTimeout(timer);
  }, [wikiQuery]);

  const handleLinkWiki = async (wiki: SearchResult) => {
    setLinkLoading(true);
    try {
      // 実際のバックエンドAPIを呼び出して紐付け（フェーズ9要求）
      await api.linkWiki(formData.issueKey, wiki.id);
      
      // UIの即時反映としてMarkdownリンクを追記する
      const newDesc = (formData.description || '') + `\n\n**関連Wiki**: [${wiki.title}](/wiki/${wiki.id})`;
      handleChange('description', newDesc);
      
      setShowWikiSelect(false);
      setWikiQuery('');
    } catch (e) {
      console.error('Wiki連携エラー:', e);
      alert('Wikiの紐付けに失敗しました');
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '5vh' }}>
      <div className="panel" style={{ width: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafbfc', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="type-badge">タスク</span>
            <span style={{ fontWeight: 'bold', color: 'var(--link-color)', fontSize: '14px' }}>{formData.issueKey}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sub)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="panel-body" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', gap: '24px' }}>
          
          {/* Main Column */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-sub)' }}>件名</label>
              <input 
                type="text" 
                value={formData.title} 
                onChange={(e) => handleChange('title', e.target.value)} 
                style={{ width: '100%', fontSize: '16px', fontWeight: 'bold', padding: '10px 12px' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-sub)' }}>詳細</label>
              <textarea 
                value={formData.description || ''} 
                onChange={(e) => handleChange('description', e.target.value)}
                style={{ width: '100%', minHeight: '300px', padding: '12px', fontFamily: 'inherit', resize: 'vertical', lineHeight: '1.6' }}
                placeholder="課題の詳細を入力してください..."
              />
            </div>

            {/* Attachments & Wiki Section */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '13px', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LinkIcon size={14} color="var(--text-sub)" /> 関連Wiki / 添付ファイル
                </h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn" style={{ fontSize: '12px' }} onClick={() => setShowWikiSelect(!showWikiSelect)}>Wikiを紐付け</button>
                  <button className="btn" style={{ fontSize: '12px' }} onClick={() => {
                    const newDesc = (formData.description || '') + '\n\n**添付ファイル**: [ファイルを開く](/files)';
                    handleChange('description', newDesc);
                  }}>ファイルを添付</button>
                </div>
              </div>

              {/* Wiki Search Dropdown */}
              {showWikiSelect && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8f9fa', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-sub)' }} />
                    <input 
                      type="text" 
                      placeholder="Wikiタイトルを検索..." 
                      value={wikiQuery}
                      onChange={e => setWikiQuery(e.target.value)}
                      style={{ width: '100%', padding: '6px 12px 6px 30px', fontSize: '13px' }}
                      autoFocus
                    />
                  </div>
                  {wikiQuery.trim().length > 0 && (
                    <div style={{ marginTop: '8px', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto' }}>
                      {wikiResults.length > 0 ? wikiResults.map(w => (
                        <div 
                          key={w.id} 
                          onClick={() => handleLinkWiki(w)}
                          style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f4f8'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span>{w.title}</span>
                          {linkLoading ? <div className="spinner" style={{ width: '12px', height: '12px' }} /> : <span style={{ color: 'var(--link-color)' }}>紐付ける</span>}
                        </div>
                      )) : (
                        <div style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-sub)' }}>見つかりませんでした</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Linked Wikis Display */}
              {linkedWikis.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {linkedWikis.map((wiki, idx) => (
                    <div key={`${wiki.id}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                      <CheckCircle size={14} color="var(--primary-color)" />
                      <a 
                        href={`/wiki/${wiki.id}`} 
                        onClick={(e) => { e.preventDefault(); navigate(`/wiki/${wiki.id}`); onClose(); }} 
                        style={{ fontSize: '13px', color: 'var(--link-color)', textDecoration: 'none', fontWeight: 'bold' }}
                      >
                        {wiki.title}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#fafbfc', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-sub)' }}>状態</label>
              <select 
                value={formData.status} 
                onChange={(e) => handleChange('status', e.target.value)}
                style={{ width: '100%', backgroundColor: '#fff', fontWeight: 'bold', color: `var(--status-${(formData.status || 'OPEN').toLowerCase().replace('_', '-')})` }}
              >
                <option value="OPEN">未対応</option>
                <option value="IN_PROGRESS">処理中</option>
                <option value="RESOLVED">処理済み</option>
                <option value="CLOSED">完了</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-sub)' }}>担当者</label>
              <input type="text" value={formData.assignee || ''} onChange={(e) => handleChange('assignee', e.target.value)} style={{ width: '100%', backgroundColor: '#fff' }} placeholder="未設定" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-sub)' }}>優先度</label>
              <select value={formData.priority} onChange={(e) => handleChange('priority', e.target.value)} style={{ width: '100%', backgroundColor: '#fff' }}>
                <option value="HIGH">高</option>
                <option value="MEDIUM">中</option>
                <option value="LOW">低</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-sub)' }}>開始日</label>
              <input type="date" value={formData.startDate || ''} onChange={(e) => handleChange('startDate', e.target.value)} style={{ width: '100%', backgroundColor: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-sub)' }}>期限日</label>
              <input type="date" value={formData.dueDate || ''} onChange={(e) => handleChange('dueDate', e.target.value)} style={{ width: '100%', backgroundColor: '#fff' }} />
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-sub)' }}>
              見積時間: {formData.estimatedHours || '-'} hours<br />
              実績時間: {formData.actualHours || '-'} hours
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px', backgroundColor: '#fafbfc', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px' }}>
          <button className="btn" onClick={onClose} disabled={isSaving}>キャンセル</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isSaving ? (
              <><div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px', borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> 保存中...</>
            ) : (
              <><Save size={14} /> 保存</>
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default IssueDetailModal;
