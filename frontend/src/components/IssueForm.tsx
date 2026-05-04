import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Issue } from '../types';
import { api } from '../api/client';
import { Save, Eye, Edit2, Bold, Italic, Link as LinkIcon, Image as ImageIcon, ChevronLeft, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  projectKey: string;
  initialStatus?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CATEGORIES = ['開発', 'インフラ', 'デザイン', 'ドキュメント', 'その他'];
const MILESTONES = ['リリース 1.0', 'リリース 2.0', 'MVPフェーズ', 'デバッグ期間'];
const VERSIONS = ['v0.9-beta', 'v1.0-stable', 'v1.1-rc'];
const ASSIGNEES = ['未設定', '山崎大地', 'テストユーザー'];

const IssueForm: React.FC<Props> = ({ projectKey, initialStatus, onSuccess, onCancel }) => {
  console.log("DEBUG: 2026-05-04 修正反映テスト");
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<Issue>>({
    title: '',
    description: '',
    status: (initialStatus as any) || 'OPEN',
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

  const handleChange = (field: keyof Issue, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArraySelect = (field: 'categoryIds' | 'milestoneIds' | 'versionIds', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value ? [value] : [] }));
  };

  const handleSubmit = async () => {
    if (!formData.title?.trim()) {
      alert('件名を入力してください');
      return;
    }
    setIsSaving(true);
    try {
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

  const handleCancel = () => {
    if (onCancel) onCancel();
    else navigate(-1);
  };

  const isSubmitDisabled = !formData.title?.trim() || isSaving;

  return (
    <div className="flex flex-col h-full bg-[#f6f8fa] w-full">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800 m-0">課題の追加</h1>
          <span className="text-sm text-gray-500 font-normal">({projectKey})</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className={`flex items-center gap-1 px-4 py-2 text-sm border rounded transition-colors ${isPreview ? 'bg-gray-200 border-gray-400' : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'}`}
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? <Edit2 size={16} /> : <Eye size={16} />}
            {isPreview ? 'エディタ' : 'プレビュー'}
          </button>
          <button
            className="flex items-center gap-1 px-6 py-2 text-sm text-white rounded hover:opacity-90 font-bold transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--primary-color)' }}
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            <Save size={16} />
            {isSaving ? '追加中...' : '追加'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded shadow-sm p-8 space-y-6">
          
          {/* Parent Issue Button */}
          <div>
            <button className="flex items-center gap-2 text-sm text-[#4488c5] hover:underline font-bold">
              <Layers size={16} />
              親課題を設定する
            </button>
          </div>

          {/* Issue Type */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">種別 <span className="text-red-500">*</span></label>
            <select
              className="w-48 p-2 bg-white border border-gray-300 rounded text-sm outline-none"
              value={issueType}
              onChange={e => setIssueType(e.target.value)}
            >
              <option value="タスク">タスク</option>
              <option value="バグ">バグ</option>
              <option value="要望">要望</option>
              <option value="その他">その他</option>
            </select>
          </div>

          {/* Subject (Title) */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">件名 <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded text-lg font-bold outline-none focus:ring-2 focus:ring-pink-200 transition-all"
              placeholder="件名を入力してください"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              autoFocus
            />
          </div>

          {/* Description Area with Toolbar */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">詳細</label>
            <div className="border border-gray-300 rounded overflow-hidden flex flex-col">
              <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-300">
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" onClick={() => insertMarkdown('**', '**')} title="太字"><Bold size={16} /></button>
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" onClick={() => insertMarkdown('*', '*')} title="斜体"><Italic size={16} /></button>
                <div className="w-px h-5 bg-gray-300 mx-2" />
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" onClick={() => insertMarkdown('[リンクテキスト](url)')} title="リンク"><LinkIcon size={16} /></button>
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" onClick={() => fileInputRef.current?.click()} title="画像を挿入"><ImageIcon size={16} /></button>
                <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} />
                <div className="flex-1" />
                <button
                  className={`text-xs px-3 py-1.5 rounded transition-colors ${isPreview ? 'text-white font-bold' : 'text-gray-500 hover:bg-gray-200'}`}
                  style={isPreview ? { backgroundColor: 'var(--primary-color)' } : {}}
                  onClick={() => setIsPreview(!isPreview)}
                >
                  プレビュー
                </button>
              </div>

              {isPreview ? (
                <div className="p-4 prose max-w-none min-h-[300px] bg-white">
                  {formData.description ? (
                    <ReactMarkdown>{formData.description}</ReactMarkdown>
                  ) : (
                    <span className="text-gray-400 italic">プレビューする内容がありません</span>
                  )}
                </div>
              ) : (
                <textarea
                  id="issue-description"
                  className="w-full min-h-[300px] p-4 outline-none resize-y font-mono text-sm bg-white"
                  style={{ border: 'none' }}
                  placeholder="詳細を入力してください..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              )}
              {/* Drag & Drop Hint Area */}
              <div className="bg-gray-50 border-t border-gray-300 p-3 text-center text-xs text-gray-500 border-dashed">
                ファイルをドラッグ＆ドロップするかクリップボードから画像を貼り付けしてください または <button className="text-[#4488c5] hover:underline" onClick={() => fileInputRef.current?.click()}>ファイルを選択...</button>
              </div>
            </div>
          </div>

          {/* Attributes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-6 border-t border-gray-200">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="flex items-center">
                <label className="w-32 text-xs font-bold text-gray-600">状態</label>
                <select
                  className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="OPEN">未対応</option>
                  <option value="IN_PROGRESS">処理中</option>
                  <option value="RESOLVED">処理済み</option>
                  <option value="CLOSED">完了</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-32 text-xs font-bold text-gray-600">優先度</label>
                <select
                  className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  <option value="HIGH">高</option>
                  <option value="MEDIUM">中</option>
                  <option value="LOW">低</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-32 text-xs font-bold text-gray-600">カテゴリー</label>
                <select
                  className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  value={formData.categoryIds?.[0] || ''}
                  onChange={(e) => handleArraySelect('categoryIds', e.target.value)}
                >
                  <option value="">未設定</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-32 text-xs font-bold text-gray-600">開始日</label>
                <input
                  type="date"
                  className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  value={formData.startDate || ''}
                  onChange={(e) => handleChange('startDate', e.target.value || null)}
                  onKeyDown={(e) => e.preventDefault()}
                />
              </div>

              <div className="flex items-center">
                <label className="w-32 text-xs font-bold text-gray-600">予定時間（時間）</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  placeholder="0.0"
                  value={formData.estimatedHours ?? ''}
                  onChange={(e) => handleChange('estimatedHours', e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="flex items-center">
                <label className="w-32 text-xs font-bold text-gray-600">担当者</label>
                <select
                  className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  value={formData.assignee || ''}
                  onChange={(e) => handleChange('assignee', e.target.value === '未設定' ? null : e.target.value)}
                >
                  {ASSIGNEES.map(a => <option key={a} value={a === '未設定' ? '' : a}>{a}</option>)}
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-32 text-xs font-bold text-gray-600">マイルストーン</label>
                <select
                  className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  value={formData.milestoneIds?.[0] || ''}
                  onChange={(e) => handleArraySelect('milestoneIds', e.target.value)}
                >
                  <option value="">未設定</option>
                  {MILESTONES.map(ms => <option key={ms} value={ms}>{ms}</option>)}
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-32 text-xs font-bold text-gray-600">発生バージョン</label>
                <select
                  className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  value={formData.versionIds?.[0] || ''}
                  onChange={(e) => handleArraySelect('versionIds', e.target.value)}
                >
                  <option value="">未設定</option>
                  {VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-32 text-xs font-bold text-gray-600">期限日</label>
                <input
                  type="date"
                  className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  value={formData.dueDate || ''}
                  onChange={(e) => handleChange('dueDate', e.target.value || null)}
                  onKeyDown={(e) => e.preventDefault()}
                />
              </div>

              <div className="flex items-center">
                <label className="w-32 text-xs font-bold text-gray-600">実績時間（時間）</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  placeholder="0.0"
                  value={formData.actualHours ?? ''}
                  onChange={(e) => handleChange('actualHours', e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-center gap-4 pt-8 pb-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-8 py-2.5 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="px-10 py-2.5 text-sm text-white rounded hover:opacity-90 font-bold transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

export default IssueForm;
