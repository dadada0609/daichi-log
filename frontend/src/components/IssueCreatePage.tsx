import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Issue } from '../types';
import { api } from '../api/client';
import { Save, Eye, Edit2, Bold, Italic, Link as LinkIcon, Image as ImageIcon, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  onSuccess?: () => void;
}

// 選択肢の定義
const CATEGORIES = ['開発', 'インフラ', 'デザイン', 'ドキュメント', 'その他'];
const MILESTONES = ['リリース 1.0', 'リリース 2.0', 'MVPフェーズ', 'デバッグ期間'];
const VERSIONS = ['v0.9-beta', 'v1.0-stable', 'v1.1-rc'];

const IssueCreatePage: React.FC<Props> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<Issue>>({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    assignee: '',
    startDate: null,
    dueDate: null,
    categoryIds: [],
    milestoneIds: [],
    versionIds: [],
    estimatedHours: null,
    actualHours: null
  });

  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [issueType, setIssueType] = useState('タスク');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const projectKey = localStorage.getItem('projectKey') || 'SDK_TI';

  const handleChange = (field: keyof Issue, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field: 'categoryIds' | 'milestoneIds' | 'versionIds', value: string) => {
    setFormData(prev => {
      const arr: string[] = (prev[field] as string[]) || [];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(v => v !== value) };
      } else {
        return { ...prev, [field]: [...arr, value] };
      }
    });
  };

  const handleSubmit = async () => {
    if (!formData.title?.trim()) {
      alert('件名を入力してください');
      return;
    }
    setIsSaving(true);
    try {
      // null/undefined のフィールドを整理して送信
      const payload: Record<string, any> = {
        title: formData.title,
        description: formData.description || '',
        status: formData.status || 'OPEN',
        priority: formData.priority || 'MEDIUM',
        assignee: formData.assignee || null,
        startDate: formData.startDate || null,
        dueDate: formData.dueDate || null,
        estimatedHours: formData.estimatedHours || null,
        actualHours: formData.actualHours || null,
        categoryIds: formData.categoryIds || [],
        milestoneIds: formData.milestoneIds || [],
        versionIds: formData.versionIds || [],
      };

      const res = await fetch('/api/v1/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`[CreateIssue] HTTP ${res.status}:`, errBody);
        alert(`課題の追加に失敗しました (${res.status}): ${errBody.error || JSON.stringify(errBody)}`);
        return;
      }

      console.log('[CreateIssue] Success:', await res.json().catch(() => ({})));
      if (onSuccess) onSuccess();
      navigate('/issues');
    } catch (error: any) {
      console.error('[CreateIssue] Network error:', error);
      alert(`通信エラーが発生しました: ${error?.message || error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('issue-description') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.description || '';
    const newText = `${text.substring(0, start)}${prefix}${text.substring(start, end)}${suffix}${text.substring(end)}`;
    handleChange('description', newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const result = await api.uploadFile(file);
        const url = (result as any).url || `/uploads/${result.id}`;
        const isImage = file.type.startsWith('image/');
        const md = isImage ? `![${file.name}](${url})` : `[${file.name}](${url})`;
        insertMarkdown(`\n${md}\n`);
      } catch (err: any) {
        console.error('[FileUpload] Error:', err);
        alert('ファイルのアップロードに失敗しました');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-800 m-0">課題の追加</h1>
          <span className="text-sm text-gray-500 font-normal">({projectKey})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`flex items-center gap-1 px-4 py-1.5 text-sm border rounded transition-colors ${isPreview ? 'bg-gray-200 border-gray-400' : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'}`}
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? <Edit2 size={14} /> : <Eye size={14} />}
            {isPreview ? 'エディタ' : 'プレビュー'}
          </button>
          <button
            className="flex items-center gap-1 px-6 py-1.5 text-sm text-white rounded hover:opacity-90 font-bold transition-opacity shadow-sm disabled:opacity-50"
            style={{ backgroundColor: 'var(--primary-color)' }}
            onClick={handleSubmit}
            disabled={isSaving}
          >
            <Save size={14} />
            {isSaving ? '追加中...' : '追加'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Issue Type & Subject */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">種別 <span className="text-red-500">*</span></label>
              <select
                className="w-full p-2 bg-white border border-gray-300 rounded text-sm outline-none"
                value={issueType}
                onChange={e => setIssueType(e.target.value)}
              >
                <option value="タスク">タスク</option>
                <option value="バグ">バグ</option>
                <option value="要望">要望</option>
                <option value="その他">その他</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-600 mb-1">件名 <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded text-base font-bold outline-none"
                placeholder="件名を入力してください"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Description Area with Toolbar */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">詳細</label>
            <div className="border border-gray-300 rounded overflow-hidden">
              <div className="flex items-center gap-1 p-1.5 bg-gray-50 border-b border-gray-300">
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" onClick={() => insertMarkdown('**', '**')} title="太字"><Bold size={14} /></button>
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" onClick={() => insertMarkdown('*', '*')} title="斜体"><Italic size={14} /></button>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" onClick={() => insertMarkdown('[リンクテキスト](url)')} title="リンク"><LinkIcon size={14} /></button>
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" onClick={() => fileInputRef.current?.click()} title="画像を挿入"><ImageIcon size={14} /></button>
                <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} />
                <div className="flex-1" />
                <button
                  className={`text-[11px] px-2 py-1 rounded transition-colors ${isPreview ? 'text-white' : 'text-gray-500 hover:bg-gray-200'}`}
                  style={isPreview ? { backgroundColor: 'var(--primary-color)' } : {}}
                  onClick={() => setIsPreview(!isPreview)}
                >
                  プレビュー
                </button>
              </div>

              {isPreview ? (
                <div className="p-4 prose max-w-none min-h-[250px] bg-white">
                  {formData.description ? (
                    <ReactMarkdown>{formData.description}</ReactMarkdown>
                  ) : (
                    <span className="text-gray-400 italic">プレビューする内容がありません</span>
                  )}
                </div>
              ) : (
                <textarea
                  id="issue-description"
                  className="w-full min-h-[250px] p-4 outline-none resize-y font-mono text-sm"
                  style={{ border: 'none' }}
                  placeholder="詳細を入力してください..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Attributes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">

            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">状態</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="OPEN">未対応</option>
                  <option value="IN_PROGRESS">処理中</option>
                  <option value="RESOLVED">処理済み</option>
                  <option value="CLOSED">完了</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">優先度</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  <option value="HIGH">高</option>
                  <option value="MEDIUM">中</option>
                  <option value="LOW">低</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">カテゴリー（複数選択）</label>
                <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded bg-white min-h-[42px]">
                  {CATEGORIES.map(cat => {
                    const selected = (formData.categoryIds || []).includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleMultiSelect('categoryIds', cat)}
                        className={`px-3 py-1 rounded-full text-xs transition-colors border ${selected ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'}`}
                        style={selected ? { backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)' } : {}}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">開始日</label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  value={formData.startDate || ''}
                  onChange={(e) => handleChange('startDate', e.target.value || null)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">予定時間（時間）</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  placeholder="0.0"
                  value={formData.estimatedHours ?? ''}
                  onChange={(e) => handleChange('estimatedHours', e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">担当者</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  placeholder="未設定"
                  value={formData.assignee || ''}
                  onChange={(e) => handleChange('assignee', e.target.value || null)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">マイルストーン（複数選択）</label>
                <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded bg-white min-h-[42px]">
                  {MILESTONES.map(ms => {
                    const selected = (formData.milestoneIds || []).includes(ms);
                    return (
                      <button
                        key={ms}
                        type="button"
                        onClick={() => handleMultiSelect('milestoneIds', ms)}
                        className={`px-3 py-1 rounded-full text-xs transition-colors border ${selected ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'}`}
                        style={selected ? { backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)' } : {}}
                      >
                        {ms}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">発生バージョン（複数選択）</label>
                <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded bg-white min-h-[42px]">
                  {VERSIONS.map(v => {
                    const selected = (formData.versionIds || []).includes(v);
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleMultiSelect('versionIds', v)}
                        className={`px-3 py-1 rounded-full text-xs transition-colors border ${selected ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'}`}
                        style={selected ? { backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)' } : {}}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">期限日</label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  value={formData.dueDate || ''}
                  onChange={(e) => handleChange('dueDate', e.target.value || null)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">実績時間（時間）</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  placeholder="0.0"
                  value={formData.actualHours ?? ''}
                  onChange={(e) => handleChange('actualHours', e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-3 pt-8 pb-12">
            <button
              type="button"
              onClick={() => navigate('/issues')}
              className="px-6 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-8 py-2 text-sm text-white rounded hover:opacity-90 font-bold transition-opacity shadow-sm disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              {isSaving ? '追加中...' : '課題を追加する'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IssueCreatePage;
