import React, { useEffect, useState, useCallback } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { api } from '../api/client';
import { Issue } from '../types';
import IssueDetailModal from './IssueDetailModal';

interface ExtendedTask extends Task {
  assignee: string | null;
  statusRaw: string;
  statusLabel: string;
}

const getStatusLabel = (status?: string) => {
  switch(status) {
    case 'OPEN': return '未対応';
    case 'IN_PROGRESS': return '処理中';
    case 'RESOLVED': return '処理済み';
    case 'CLOSED': return '完了';
    default: return status || '未対応';
  }
};

const TaskListHeader: React.FC<{ headerHeight: number; rowWidth: string; fontFamily: string; fontSize: string; }> = ({ headerHeight, rowWidth, fontFamily, fontSize }) => {
  return (
    <div style={{ height: headerHeight, width: rowWidth, fontFamily, fontSize, display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: '#fafbfc', color: 'var(--text-sub)' }}>
      <div style={{ flex: 2, padding: '0 12px', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border-color)' }}>件名</div>
      <div style={{ flex: 1, padding: '0 12px', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border-color)' }}>担当者</div>
      <div style={{ flex: 1, padding: '0 12px', display: 'flex', alignItems: 'center' }}>状態</div>
    </div>
  );
};

const TaskListTable: React.FC<{
  rowHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
  tasks: Task[];
}> = ({ rowHeight, rowWidth, fontFamily, fontSize, tasks }) => {
  return (
    <div style={{ width: rowWidth, fontFamily, fontSize }}>
      {tasks.map((task) => {
        const t = task as ExtendedTask;
        return (
          <div key={t.id} style={{ height: rowHeight, display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: '#fff' }}>
            <div style={{ flex: 2, padding: '0 12px', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border-color)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              <span style={{ color: 'var(--link-color)', marginRight: '8px' }}>{t.id !== 'dummy' ? t.id : ''}</span>
              <span style={{ color: 'var(--text-main)' }}>{t.name.split(': ')[1] || t.name}</span>
            </div>
            <div style={{ flex: 1, padding: '0 12px', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border-color)' }}>
              {t.assignee && t.id !== 'dummy' && (
                 <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#ccc', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', marginRight: '6px' }}>
                   {t.assignee.charAt(0).toUpperCase()}
                 </div>
              )}
              <span style={{ color: 'var(--text-sub)' }}>{t.assignee || (t.id === 'dummy' ? '' : '未設定')}</span>
            </div>
            <div style={{ flex: 1, padding: '0 12px', display: 'flex', alignItems: 'center' }}>
              <span className={t.id !== 'dummy' ? `status-pill status-${t.statusRaw || 'OPEN'}` : ''}>{t.statusLabel !== '未対応' || t.id !== 'dummy' ? t.statusLabel : ''}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface Props {
  refreshCount?: number;
}

const GanttChart: React.FC<Props> = ({ refreshCount = 0 }) => {
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [originalIssues, setOriginalIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  const isValidDate = (d: any) => {
    return d instanceof Date && !isNaN(d.getTime());
  };

  const loadIssues = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getIssues();
      const issues = Array.isArray(data) ? data : [];
      setOriginalIssues(issues);
      
      const mappedTasks: ExtendedTask[] = [];

      issues.forEach((i: Issue) => {
        // 安全な日付パース（不正値・空文字・null の場合は本日にフォールバック）
        let start = new Date(i.startDate || new Date());
        let end = new Date(i.dueDate || new Date());
        
        if (!isValidDate(start)) start = new Date();
        if (!isValidDate(end)) end = new Date();

        // ガントチャートの描画制約: end >= start
        if (end.getTime() < start.getTime()) {
          end = new Date(start);
          end.setDate(end.getDate() + 1);
        }

        let progress = 0;
        let barColor = 'var(--status-open)';
        if (i.status === 'IN_PROGRESS') { progress = 50; barColor = 'var(--status-in-progress)'; }
        if (i.status === 'RESOLVED') { progress = 100; barColor = 'var(--status-resolved)'; }
        if (i.status === 'CLOSED') { progress = 100; barColor = 'var(--status-closed)'; }

        mappedTasks.push({
          id: i.issueKey,
          name: `${i.issueKey}: ${i.title || '無題'}`,
          start: start,
          end: end,
          progress: progress,
          type: 'task',
          project: 'Project',
          isDisabled: false,
          styles: { progressColor: barColor, progressSelectedColor: barColor, backgroundColor: '#e2e6ea' },
          assignee: i.assignee,
          statusRaw: i.status || 'OPEN',
          statusLabel: getStatusLabel(i.status)
        });
      });

      // tasksが空の場合にライブラリがクラッシュするのを防ぐダミーデータ
      if (mappedTasks.length === 0) {
        const dummyStart = new Date();
        const dummyEnd = new Date();
        dummyEnd.setDate(dummyEnd.getDate() + 5);

        mappedTasks.push({
          id: 'dummy',
          name: 'ダミー: 表示できる課題がありません',
          start: dummyStart,
          end: dummyEnd,
          progress: 0,
          type: 'task',
          project: 'Project',
          isDisabled: true,
          styles: { backgroundColor: 'transparent', backgroundSelectedColor: 'transparent', progressColor: 'transparent' },
          assignee: null,
          statusRaw: '',
          statusLabel: ''
        });
      }

      setTasks(mappedTasks);
    } catch (e) {
      console.error('ガントチャートの読み込みに失敗しました:', e);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIssues();
  }, [loadIssues, refreshCount]);

  const handleSelect = (task: Task) => {
    if (task.id === 'dummy') return;
    const issue = originalIssues.find(i => i.issueKey === task.id);
    if (issue) setSelectedIssue(issue);
  };

  const handleUpdate = async (updated: Issue) => {
    if (!updated.issueKey) return;
    await api.updateIssue(updated.issueKey, updated);
    setSelectedIssue(null);
    await loadIssues();
  };

  return (
    <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>ガントチャート</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select 
            className="btn"
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            style={{ height: '28px', padding: '2px 8px', backgroundColor: '#fff' }}
          >
            <option value={ViewMode.Day}>日</option>
            <option value={ViewMode.Week}>週</option>
            <option value={ViewMode.Month}>月</option>
          </select>
          <button className="btn">表示設定</button>
        </div>
      </div>
      
      <div className="panel-body" style={{ flex: 1, padding: '0', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ padding: '24px', color: 'var(--text-sub)' }}>読み込み中...</div>
        ) : tasks.length > 0 ? (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Gantt 
              tasks={tasks} 
              viewMode={viewMode} 
              columnWidth={viewMode === ViewMode.Month ? 150 : 60}
              listCellWidth="450px"
              rowHeight={40}
              barCornerRadius={4}
              barFill={70}
              fontSize="12"
              TaskListHeader={TaskListHeader}
              TaskListTable={TaskListTable}
              todayColor="rgba(234, 92, 131, 0.3)"
              onSelect={handleSelect}
              onDoubleClick={handleSelect}
            />
          </div>
        ) : (
          <div style={{ padding: '24px', color: 'var(--text-sub)' }}>表示できる課題がありません。</div>
        )}
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

export default GanttChart;
