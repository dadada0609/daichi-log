import React, { useEffect, useState, useCallback } from 'react';
import { Issue } from '../types';
import { api } from '../api/client';
import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import IssueDetailModal from './IssueDetailModal';

interface Props {
  refreshCount?: number;
}

const IssueList: React.FC<Props> = ({ refreshCount = 0 }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getIssues();
      setIssues(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('課題の取得に失敗しました:', e);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, []);
    
  useEffect(() => {
    fetchIssues();
  }, [fetchIssues, refreshCount]);

  const handleUpdate = async (updated: Issue) => {
    if (!updated.issueKey) return;
    try {
      await api.updateIssue(updated.issueKey, updated);
      setSelectedIssue(null);
      await fetchIssues();
    } catch (e) {
      console.error('更新に失敗しました:', e);
    }
  };

  const getPriorityIcon = (priority?: string) => {
    if (!priority) return null;
    switch (priority) {
      case 'HIGH': return <ArrowUp size={14} color="#ed8077" />;
      case 'MEDIUM': return <ArrowRight size={14} color="#4488c5" />;
      case 'LOW': return <ArrowDown size={14} color="#a1af2f" />;
      default: return null;
    }
  };

  const getStatusClass = (status?: string) => {
    return `status-pill status-${status || 'OPEN'}`;
  };
  
  const getStatusLabel = (status?: string) => {
    switch(status) {
      case 'OPEN': return '未対応';
      case 'IN_PROGRESS': return '処理中';
      case 'RESOLVED': return '処理済み';
      case 'CLOSED': return '完了';
      default: return status || '未対応';
    }
  };

  if (loading) return <div style={{ padding: '24px', color: 'var(--text-sub)' }}>読み込み中...</div>;

  return (
    <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8f9fa' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px', marginRight: '8px' }}>検索条件</span>
          <button className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white', borderColor: 'var(--primary-color)' }}>シンプル検索</button>
          <button className="btn">高度な検索</button>
        </div>
      </div>

      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderBottom: 'none' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
          全 {issues.length} 件中 {issues.length > 0 ? 1 : 0} 〜 {issues.length} 件を表示
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn">まとめて操作</button>
          <button className="btn">一括登録</button>
          <button className="btn">表示設定</button>
        </div>
      </div>
      
      <div className="panel-body" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="backlog-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>種別</th>
              <th style={{ width: '100px' }}>キー</th>
              <th>件名</th>
              <th style={{ width: '120px' }}>担当者</th>
              <th style={{ width: '100px' }}>状態</th>
              <th style={{ width: '100px' }}>カテゴリー</th>
              <th style={{ width: '60px', textAlign: 'center' }}>優先度</th>
              <th style={{ width: '100px' }}>登録日</th>
              <th style={{ width: '100px' }}>期限日</th>
            </tr>
          </thead>
          <tbody>
            {issues.map(issue => (
              <tr key={issue.issueKey}>
                <td><span className="type-badge">タスク</span></td>
                <td><a href="#" onClick={(e) => { e.preventDefault(); setSelectedIssue(issue); }} style={{ color: 'var(--link-color)', textDecoration: 'none' }}>{issue.issueKey}</a></td>
                <td>
                  <a href="#" onClick={(e) => { e.preventDefault(); setSelectedIssue(issue); }} style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {issue.title || '（件名なし）'}
                  </a>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>
                      {issue.assignee ? issue.assignee.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span>{issue.assignee || '未設定'}</span>
                  </div>
                </td>
                <td><span className={getStatusClass(issue.status)}>{getStatusLabel(issue.status)}</span></td>
                <td><span style={{ color: 'var(--text-sub)' }}>-</span></td>
                <td style={{ textAlign: 'center' }}>{getPriorityIcon(issue.priority)}</td>
                <td style={{ color: 'var(--text-sub)' }}>-</td>
                <td style={{ color: issue.dueDate ? 'var(--text-main)' : 'var(--text-sub)' }}>
                  {issue.dueDate ? issue.dueDate.replace(/-/g, '/') : '-'}
                </td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-sub)' }}>
                  該当する課題が見つかりませんでした。
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

export default IssueList;
