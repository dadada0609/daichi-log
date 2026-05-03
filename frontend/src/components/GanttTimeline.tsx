import React, { useEffect, useState } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { api } from '../api/client';
import { Issue } from '../types';

const GanttTimeline: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);

  useEffect(() => {
    const loadIssues = async () => {
      try {
        const issues = await api.getIssues();
        const mappedTasks: Task[] = issues
          .filter((i: Issue) => i.startDate && i.dueDate)
          .map((i: Issue) => {
            let progress = 0;
            let barColor = 'var(--status-open)';
            if (i.status === 'IN_PROGRESS') { progress = 50; barColor = 'var(--status-in-progress)'; }
            if (i.status === 'RESOLVED') { progress = 100; barColor = 'var(--status-resolved)'; }
            if (i.status === 'CLOSED') { progress = 100; barColor = 'var(--status-closed)'; }

            return {
              id: i.issueKey,
              name: `${i.issueKey}: ${i.title}`,
              start: new Date(i.startDate!),
              end: new Date(i.dueDate!),
              progress: progress,
              type: 'task',
              project: 'Project',
              isDisabled: false,
              styles: { progressColor: barColor, progressSelectedColor: barColor, backgroundColor: '#e2e6ea' }
            };
          });

        if (mappedTasks.length === 0) {
          mappedTasks.push({
            id: 'dummy',
            name: '期間が設定された課題はありません',
            start: new Date(),
            end: new Date(new Date().setDate(new Date().getDate() + 5)),
            progress: 0,
            type: 'task',
            project: 'Project',
            isDisabled: true,
            styles: { backgroundColor: 'transparent', backgroundSelectedColor: 'transparent', progressColor: 'transparent' }
          });
        }

        setTasks(mappedTasks);
      } catch (e) {
        console.error('ガントチャートの読み込みに失敗しました:', e);
      }
    };

    loadIssues();
  }, []);

  return (
    <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>ガントチャート</span>
        <select 
          className="btn"
          value={viewMode} 
          onChange={(e) => setViewMode(e.target.value as ViewMode)}
          style={{ height: '28px', padding: '2px 8px' }}
        >
          <option value={ViewMode.Day}>日</option>
          <option value={ViewMode.Week}>週</option>
          <option value={ViewMode.Month}>月</option>
        </select>
      </div>
      
      <div className="panel-body" style={{ flex: 1, padding: '0', display: 'flex', flexDirection: 'column' }}>
        {tasks.length > 0 && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Gantt 
              tasks={tasks} 
              viewMode={viewMode} 
              columnWidth={viewMode === ViewMode.Month ? 150 : 60}
              listCellWidth="300px"
              rowHeight={40}
              barCornerRadius={4}
              barFill={70}
              fontSize="12"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GanttTimeline;
