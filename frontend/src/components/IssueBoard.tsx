import React, { useEffect, useState } from 'react';
import { Issue } from '../types';
import { api } from '../api/client';
import { Plus, MoreHorizontal, Calendar } from 'lucide-react';
import IssueDetailModal from './IssueDetailModal';

interface Props {
  refreshCount?: number;
  onOpenCreateModal?: (status: string) => void;
}

const IssueBoard: React.FC<Props> = ({ refreshCount = 0, onOpenCreateModal }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const fetchIssues = async () => {
    try {
      const data = await api.getIssues();
      setIssues(data || []);
    } catch (e) {
      console.error('課題の取得に失敗しました:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [refreshCount]);

  const handleUpdate = async (updated: Issue) => {
    await api.updateIssue(updated.issueKey, updated);
    setSelectedIssue(null);
    await fetchIssues();
  };

  const statuses = [
    { key: 'OPEN', label: '未対応', color: 'var(--status-open)' },
    { key: 'IN_PROGRESS', label: '処理中', color: 'var(--status-in-progress)' },
    { key: 'RESOLVED', label: '処理済み', color: 'var(--status-resolved)' },
    { key: 'CLOSED', label: '完了', color: 'var(--status-closed)' }
  ];

  const isOverdue = (dateStr: string) => {
    const due = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  if (loading) return <div style={{ padding: '16px', color: 'var(--text-sub)' }}>読み込み中...</div>;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '18px' }}>ボード</h1>
          <button className="btn" style={{ height: '28px' }}>フィルタを隠す</button>
        </div>
        <button className="btn" style={{ height: '28px' }}>検索条件を保存</button>
      </div>

      {/* フィルタ領域 (モック) */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <select className="btn" style={{ minWidth: '150px', backgroundColor: '#fff' }} defaultValue="">
          <option value="" disabled>種別</option>
        </select>
        <select className="btn" style={{ minWidth: '150px', backgroundColor: '#fff' }} defaultValue="">
          <option value="" disabled>カテゴリー</option>
        </select>
        <select className="btn" style={{ minWidth: '150px', backgroundColor: '#fff' }} defaultValue="">
          <option value="" disabled>マイルストーン</option>
        </select>
        <select className="btn" style={{ minWidth: '150px', backgroundColor: '#fff' }} defaultValue="">
          <option value="" disabled>担当者</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', flex: 1, paddingBottom: '16px' }}>
        {statuses.map(status => {
          const columnIssues = issues.filter(i => i.status === status.key);
          const count = columnIssues.length;
          
          return (
            <div key={status.key} style={{ minWidth: '320px', width: '320px', display: 'flex', flexDirection: 'column', background: '#f4f5f7', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              
              {/* Column Header */}
              <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderBottom: '1px solid var(--border-color)', borderTop: `3px solid ${status.color}`, borderTopLeftRadius: '4px', borderTopRightRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: status.color }}></div>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{status.label}</span>
                <span style={{ background: '#e2e6ea', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', color: '#333' }}>
                  {count > 99 ? '99+' : count}
                </span>
                <Plus size={16} color="#999" style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={() => onOpenCreateModal && onOpenCreateModal(status.key)} />
              </div>

              {/* Column Body */}
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
                {columnIssues.map(issue => {
                  const overdue = issue.dueDate ? isOverdue(issue.dueDate) : false;
                  
                  return (
                    <div key={issue.issueKey} onClick={() => setSelectedIssue(issue)} style={{ background: '#fff', borderRadius: '4px', padding: '12px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="type-badge">タスク</span>
                          <span style={{ color: 'var(--link-color)', fontSize: '12px' }}>{issue.issueKey}</span>
                        </div>
                        <MoreHorizontal size={16} color="#999" style={{ cursor: 'pointer' }} />
                      </div>
                      
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '12px', lineHeight: 1.4, wordBreak: 'break-word' }}>
                        {issue.title}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11px', color: 'var(--text-sub)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>
                            {issue.assignee ? issue.assignee.charAt(0).toUpperCase() : '?'}
                          </div>
                        </div>
                        
                        {issue.dueDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: overdue ? '#ed8077' : 'var(--text-sub)', fontWeight: overdue ? 'bold' : 'normal' }}>
                            <Calendar size={12} />
                            <span>{issue.dueDate.replace(/-/g, '/')}</span>
                            {overdue && <span style={{ color: '#ed8077' }}>🔥</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedIssue && (
        <IssueDetailModal 
          issue={selectedIssue} 
          onClose={() => setSelectedIssue(null)} 
          onSave={handleUpdate} 
        />
      )}
    </div>
  );
};

export default IssueBoard;
