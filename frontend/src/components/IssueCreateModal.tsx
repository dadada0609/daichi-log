import React, { useState, useEffect, useRef } from 'react';
import { Issue, WikiPage } from '../types';
import { api } from '../api/client';
import { X, Save, Link as LinkIcon, Search, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  initialStatus?: string;
  onClose: () => void;
  onSave: (data: Partial<Issue>) => Promise<void>;
}

const IssueCreateModal: React.FC<Props> = ({ initialStatus, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Issue>>({
    title: '',
    description: '',
    status: (initialStatus as any) || 'OPEN',
    priority: 'MEDIUM',
    assignee: '',
    startDate: '',
    dueDate: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Wiki 連携
  const [showWikiSelect, setShowWikiSelect] = useState(false);
  const [wikiQuery, setWikiQuery] = useState('');
  const [allWikis, setAllWikis] = useState<WikiPage[]>([]);
  const [wikiResults, setWikiResults] = useState<WikiPage[]>([]);
  const [linkedWikis, setLinkedWikis] = useState<{ id: string, title: string }[]>([]);

  // ファイル添付
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const navigate = useNavigate();

  // マウント時にWikiの初期一覧を取得
  useEffect(() => {
    const fetchAllWikis = async () => {
      try {
        const res = await api.getWikiPages();
        setAllWikis(res);
        setWikiResults(res);
      } catch (err) {
        console.error('Failed to fetch wikis', err);
      }
    };
    fetchAllWikis();
  }, []);

  // フロントエンド側でのローカルフィルタリング
  useEffect(() => {
    if (wikiQuery.trim().length === 0) {
      setWikiResults(allWikis);
    } else {
      const lowerQuery = wikiQuery.toLowerCase();
      setWikiResults(allWikis.filter(w => w.title.toLowerCase().includes(lowerQuery)));
    }
  }, [wikiQuery, allWikis]);

  // description から動的にリンク表示を解析
  useEffect(() => {
    if (formData.description) {
      const regex = /\[([^\]]+)\]\(\/wiki\/([^\)]+)\)/g;
      let match;
      const wikis = [];
      while ((match = regex.exec(formData.description)) !== null) {
        wikis.push({ id: match[2], title: match[1] });
      }
      setLinkedWikis(wikis);
    } else {
      setLinkedWikis([]);
    }
  }, [formData.description]);

  const handleChange = (field: keyof Issue, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title?.trim()) {
      alert('件名を入力してください');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkWiki = (wiki: WikiPage) => {
    const newDesc = (formData.description || '') + `\n\n**関連Wiki**: [${wiki.title}](/wiki/${wiki.pageId})`;
    handleChange('description', newDesc.trimStart());
    setShowWikiSelect(false);
    setWikiQuery('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        const result = await api.uploadFile(file);
        // api.uploadFile の戻り値に url があれば使い、なければ構築する
        const url = (result as any).url || `/api/v1/uploads/${result.id}`; 
        const isImage = file.type.startsWith('image/');
        const markdownLink = isImage ? `![${file.name}](${url})` : `[${file.name}](${url})`;
        const newDesc = (formData.description || '') + `\n\n**添付ファイル**: ${markdownLink}`;
        handleChange('description', newDesc.trimStart());
      } catch (error) {
        console.error('File upload error', error);
        alert('ファイルのアップロードに失敗しました');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '5vh' }}>
      <div className="panel" style={{ width: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafbfc', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="type-badge">新規タスク</span>
            <span style={{ color: 'var(--text-sub)', fontSize: '13px' }}>課題キーは自動採番されます</span>
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-sub)' }}>件名 <span style={{color: 'var(--primary-color)'}}>*</span></label>
              <input 
                type="text" 
                value={formData.title} 
                onChange={(e) => handleChange('title', e.target.value)} 
                style={{ width: '100%', fontSize: '16px', fontWeight: 'bold', padding: '10px 12px' }} 
                placeholder="件名を入力"
                autoFocus
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
                  
                  {/* File Upload Input (Hidden) */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange}
                  />
                  
                  <button 
                    className="btn" 
                    style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <><div className="spinner" style={{ width: '12px', height: '12px' }}/> アップロード中...</> : 'ファイルを添付'}
                  </button>
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
                  <div style={{ marginTop: '8px', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto' }}>
                    {wikiResults.length > 0 ? wikiResults.map(w => (
                      <div 
                        key={w.pageId} 
                        onClick={() => handleLinkWiki(w)}
                        style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f4f8'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span>{w.title}</span>
                        <span style={{ color: 'var(--link-color)' }}>紐付ける</span>
                      </div>
                    )) : (
                      <div style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-sub)' }}>見つかりませんでした</div>
                    )}
                  </div>
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
              <input 
                type="text" 
                value={formData.assignee || ''} 
                onChange={(e) => handleChange('assignee', e.target.value)}
                style={{ width: '100%', backgroundColor: '#fff' }}
                placeholder="未設定"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-sub)' }}>優先度</label>
              <select 
                value={formData.priority} 
                onChange={(e) => handleChange('priority', e.target.value)}
                style={{ width: '100%', backgroundColor: '#fff' }}
              >
                <option value="HIGH">高</option>
                <option value="MEDIUM">中</option>
                <option value="LOW">低</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-sub)' }}>開始日</label>
              <input 
                type="date" 
                value={formData.startDate || ''} 
                onChange={(e) => handleChange('startDate', e.target.value)}
                style={{ width: '100%', backgroundColor: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-sub)' }}>期限日</label>
              <input 
                type="date" 
                value={formData.dueDate || ''} 
                onChange={(e) => handleChange('dueDate', e.target.value)}
                style={{ width: '100%', backgroundColor: '#fff' }}
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px', backgroundColor: '#fafbfc', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px' }}>
          <button className="btn" onClick={onClose} disabled={isSaving}>キャンセル</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isSaving || isUploading} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isSaving ? (
              <><div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px', borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> 追加中...</>
            ) : (
              <><Save size={14} /> 追加</>
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default IssueCreateModal;
