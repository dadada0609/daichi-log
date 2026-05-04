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
    <div className="flex flex-col h-full bg-[#f4f5f7] w-full">
      {/* Header */}
      <div className="flex justify-between items-center px-12 py-4 bg-white border-b border-gray-200 shadow-sm shrink-0">
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
            {isPreview ? 'エディタ' : 'プレビュー'}
          </button>
          <button
            className="flex items-center gap-1 px-6 py-2 text-sm text-white rounded hover:opacity-90 font-bold transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--primary-color)' }}
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {isSaving ? '追加中...' : '追加'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-12 py-8 bg-[#f4f5f7]">
        <div className="w-full bg-white border border-gray-200 shadow-sm p-8 rounded space-y-8">
          
          {/* 親課題 */}
          <div>
            <button className="flex items-center gap-2 text-sm text-[#ea5c83] hover:underline font-bold">
              <Layers size={16} />
              親課題を設定する
            </button>
          </div>

          {/* 種別 */}
          <div className="flex items-center">
            <label className="w-32 text-xs font-bold text-gray-600">種別 <span className="text-red-500">*</span></label>
            <select
              className="w-48 p-2 border border-gray-300 rounded text-sm bg-gray-50 outline-none hover:bg-white focus:bg-white focus:border-pink-300 transition-colors"
              value={issueType}
              onChange={e => setIssueType(e.target.value)}
            >
              <option value="タスク">タスク</option>
              <option value="バグ">バグ</option>
              <option value="要望">要望</option>
              <option value="その他">その他</option>
            </select>
          </div>

          {/* 件名 */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">件名 <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="w-full p-2.5 border border-gray-300 rounded text-sm outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-300 transition-all"
              placeholder="件名を入力してください"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              autoFocus
            />
          </div>

          {/* 詳細 */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">詳細</label>
            <div className="border border-gray-300 rounded overflow-hidden flex flex-col">
              <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-300">
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" onClick={() => insertMarkdown('**', '**')} title="太字"><Bold size={14} /></button>
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" onClick={() => insertMarkdown('*', '*')} title="斜体"><Italic size={14} /></button>
                <div className="w-px h-4 bg-gray-300 mx-2" />
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" onClick={() => insertMarkdown('[リンクテキスト](url)')} title="リンク"><LinkIcon size={14} /></button>
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" onClick={() => fileInputRef.current?.click()} title="画像を挿入"><ImageIcon size={14} /></button>
                <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} />
                <div className="flex-1" />
                <button
                  className="text-xs px-3 py-1 text-gray-500 hover:bg-gray-200 rounded border border-transparent hover:border-gray-300 transition-colors"
                  onClick={() => setIsPreview(!isPreview)}
                >
                  プレビュー
                </button>
              </div>

              {isPreview ? (
                <div className="p-4 prose max-w-none min-h-[250px] bg-white text-sm">
                  {formData.description ? <ReactMarkdown>{formData.description}</ReactMarkdown> : <span className="text-gray-400 italic">プレビューする内容がありません</span>}
                </div>
              ) : (
                <textarea
                  id="issue-description"
                  className="w-full min-h-[250px] p-4 outline-none resize-y text-sm bg-white"
                  placeholder="詳細を入力してください..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              )}
            </div>
          </div>

          {/* グリッド (2カラム) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 pt-6 border-t border-gray-200">
            {/* 左カラム */}
            <div className="space-y-6">
              <div className="flex items-start">
                <label className="w-32 text-xs font-bold text-gray-600 mt-2 shrink-0">状態</label>
                <select
                  className="flex-1 p-2 border border-gray-300 rounded text-sm bg-gray-50 outline-none hover:bg-white focus:bg-white transition-colors"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="OPEN">🔴 未対応</option>
                  <option value="IN_PROGRESS">🔵 処理中</option>
                  <option value="RESOLVED">🟢 処理済み</option>
                  <option value="CLOSED">⚫ 完了</option>
                </select>
              </div>

              <div className="flex items-start">
                <label className="w-32 text-xs font-bold text-gray-600 mt-2 shrink-0">優先度</label>
                <select
                  className="flex-1 p-2 border border-gray-300 rounded text-sm bg-gray-50 outline-none hover:bg-white focus:bg-white transition-colors"
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  <option value="HIGH">高</option>
                  <option value="MEDIUM">中</option>
                  <option value="LOW">低</option>
                </select>
              </div>

              <div className="flex items-start">
                <label className="w-32 text-xs font-bold text-gray-600 mt-2 shrink-0">カテゴリー</label>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 p-2 border border-gray-300 rounded text-sm bg-gray-50 outline-none hover:bg-white focus:bg-white transition-colors"
                      value={formData.categoryIds?.[0] || ''}
                      onChange={(e) => handleArraySelect('categoryIds', e.target.value)}
                    >
                      <option value="">未設定</option>
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 bg-white shadow-sm shrink-0 transition-colors">+</button>
                  </div>
                  <div className="text-right mt-1"><span className="text-[10px] text-[#ea5c83] cursor-pointer hover:underline">複数選択</span></div>
                </div>
              </div>

              <div className="flex items-start">
                <label className="w-32 text-xs font-bold text-gray-600 mt-2 shrink-0">開始日</label>
                <div className="flex-1">
                  <input
                    type="date"
                    className="w-40 p-2 border border-gray-300 rounded text-sm bg-white outline-none focus:border-pink-300 transition-colors"
                    value={formData.startDate || ''}
                    onChange={(e) => handleChange('startDate', e.target.value || null)}
                  />
                </div>
              </div>

              <div className="flex items-start">
                <label className="w-32 text-xs font-bold text-gray-600 mt-2 shrink-0">予定時間</label>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="w-24 p-2 border border-gray-300 rounded text-sm bg-white outline-none focus:border-pink-300 transition-colors"
                      value={formData.estimatedHours ?? ''}
                      onChange={(e) => handleChange('estimatedHours', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                    <span className="text-xs text-gray-600">時間(hours)</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 leading-tight">この課題にかかる予定作業時間です。<br/>例：1、0.25、36</div>
                </div>
              </div>
            </div>

            {/* 右カラム */}
            <div className="space-y-6">
              <div className="flex items-start">
                <label className="w-32 text-xs font-bold text-gray-600 mt-2 shrink-0">担当者</label>
                <div className="flex-1 flex items-center gap-2">
                  <select
                    className="flex-1 p-2 border border-gray-300 rounded text-sm bg-gray-50 outline-none hover:bg-white focus:bg-white transition-colors"
                    value={formData.assignee || ''}
                    onChange={(e) => handleChange('assignee', e.target.value === '未設定' ? null : e.target.value)}
                  >
                    {ASSIGNEES.map(a => <option key={a} value={a === '未設定' ? '' : a}>{a}</option>)}
                  </select>
                  <button className="text-xs px-3 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 whitespace-nowrap text-gray-700 transition-colors">私が担当</button>
                </div>
              </div>

              <div className="flex items-start">
                <label className="w-32 text-xs font-bold text-gray-600 mt-2 shrink-0">マイルストーン <span className="text-pink-400 font-normal">?</span></label>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 p-2 border border-gray-300 rounded text-sm bg-gray-50 outline-none hover:bg-white focus:bg-white transition-colors"
                      value={formData.milestoneIds?.[0] || ''}
                      onChange={(e) => handleArraySelect('milestoneIds', e.target.value)}
                    >
                      <option value="">未設定</option>
                      {MILESTONES.map(ms => <option key={ms} value={ms}>{ms}</option>)}
                    </select>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 bg-white shadow-sm shrink-0 transition-colors">+</button>
                  </div>
                  <div className="text-right mt-1"><span className="text-[10px] text-[#ea5c83] cursor-pointer hover:underline">複数選択</span></div>
                </div>
              </div>

              <div className="flex items-start">
                <label className="w-32 text-xs font-bold text-gray-600 mt-2 shrink-0">発生バージョン <span className="text-pink-400 font-normal">?</span></label>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 p-2 border border-gray-300 rounded text-sm bg-gray-50 outline-none hover:bg-white focus:bg-white transition-colors"
                      value={formData.versionIds?.[0] || ''}
                      onChange={(e) => handleArraySelect('versionIds', e.target.value)}
                    >
                      <option value="">未設定</option>
                      {VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 bg-white shadow-sm shrink-0 transition-colors">+</button>
                  </div>
                  <div className="text-right mt-1"><span className="text-[10px] text-[#ea5c83] cursor-pointer hover:underline">複数選択</span></div>
                </div>
              </div>

              <div className="flex items-start">
                <label className="w-32 text-xs font-bold text-gray-600 mt-2 shrink-0">期限日</label>
                <div className="flex-1">
                  <input
                    type="date"
                    className="w-40 p-2 border border-gray-300 rounded text-sm bg-white outline-none focus:border-pink-300 transition-colors"
                    value={formData.dueDate || ''}
                    onChange={(e) => handleChange('dueDate', e.target.value || null)}
                  />
                </div>
              </div>

              <div className="flex items-start">
                <label className="w-32 text-xs font-bold text-gray-600 mt-2 shrink-0">実績時間</label>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="w-24 p-2 border border-gray-300 rounded text-sm bg-white outline-none focus:border-pink-300 transition-colors"
                      value={formData.actualHours ?? ''}
                      onChange={(e) => handleChange('actualHours', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                    <span className="text-xs text-gray-600">時間(hours)</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 leading-tight">この課題にかかった実作業時間です。<br/>例：1、0.25、36</div>
                </div>
              </div>
            </div>
          </div>

          {/* D&D */}
          <div className="bg-white border border-gray-300 p-6 text-center text-xs text-gray-500 border-dashed mt-8 rounded">
            ファイルをドラッグ＆ドロップするかクリップボードから画像を貼り付けしてください または <button className="text-[#4488c5] border border-gray-300 bg-gray-50 px-3 py-1 rounded hover:bg-gray-100 transition-colors ml-1">ファイルを選択...</button>
            <div className="mt-2 text-[10px] text-gray-400">ファイル追加（Shiftキーを押しながらファイルを複数選択可能）</div>
          </div>

          {/* お知らせユーザー */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <label className="block text-xs font-bold text-gray-600 mb-2">課題の追加をお知らせしたいユーザー</label>
            <input
              type="text"
              className="w-full p-2.5 border border-gray-300 rounded text-sm bg-white outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-300 transition-all"
              placeholder="ユーザー名を入力して絞り込み"
              readOnly
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              className="px-6 py-2.5 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold transition-colors"
              onClick={() => setIsPreview(!isPreview)}
            >
              プレビュー
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="px-8 py-2.5 text-sm text-white rounded hover:opacity-90 font-bold transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              {isSaving ? '追加中...' : '追加'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IssueForm;
