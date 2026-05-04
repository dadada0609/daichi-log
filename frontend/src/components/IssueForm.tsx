import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Issue } from '../types';
import { api } from '../api/client';
import { Bold, Italic, Link as LinkIcon, Image as ImageIcon, ChevronLeft, Layers } from 'lucide-react';
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

/* ----------------------------------------------------------------
   共通スタイル定数
---------------------------------------------------------------- */
// テーブル行: ラベルセル
const LABEL_CELL =
  'w-[160px] shrink-0 bg-[#fafafa] border-r border-[#e0e0e0] px-4 py-3 text-[12px] font-bold text-gray-600 flex items-center';
// テーブル行: 入力セル
const INPUT_CELL = 'flex-1 px-4 py-3 flex items-center bg-white';
// セレクトボックス共通
const SELECT_BASE =
  'w-full p-2 border border-gray-300 rounded text-sm bg-white outline-none focus:border-[#de7c9b] focus:ring-1 focus:ring-[#de7c9b] transition-colors';

/* ----------------------------------------------------------------
   テーブル行コンポーネント（ラベル | 入力値）
   2カラム構造: [label1 | input1] [label2 | input2]
---------------------------------------------------------------- */
const AttrRow: React.FC<{
  label1: string;
  children1: React.ReactNode;
  label2?: string;
  children2?: React.ReactNode;
  isLast?: boolean;
}> = ({ label1, children1, label2, children2, isLast }) => (
  <div className={`flex ${!isLast ? 'border-b border-[#e0e0e0]' : ''}`}>
    {/* 左ペア */}
    <div className="flex flex-1 border-r border-[#e0e0e0]">
      <div className={LABEL_CELL}>{label1}</div>
      <div className={INPUT_CELL}>{children1}</div>
    </div>
    {/* 右ペア */}
    {label2 !== undefined ? (
      <div className="flex flex-1">
        <div className={LABEL_CELL}>{label2}</div>
        <div className={INPUT_CELL}>{children2}</div>
      </div>
    ) : (
      <div className="flex-1" /> /* 右カラムが空の場合の穴埋め */
    )}
  </div>
);

/* ================================================================
   IssueForm メインコンポーネント
================================================================ */
const IssueForm: React.FC<Props> = ({ projectKey, initialStatus, onSuccess, onCancel }) => {
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
    actualHours: null,
  });

  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [issueType, setIssueType] = useState('タスク');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof Issue, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleArraySelect = (
    field: 'categoryIds' | 'milestoneIds' | 'versionIds',
    value: string,
  ) => setFormData(prev => ({ ...prev, [field]: value ? [value] : [] }));

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
        alert(`課題の追加に失敗しました (${res.status}): ${errBody.error || JSON.stringify(errBody)}`);
        return;
      }

      if (onSuccess) onSuccess();
    } catch (error: any) {
      alert(`通信エラーが発生しました: ${error?.message || error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const insertMarkdown = (prefix: string, suffix = '') => {
    const ta = document.getElementById('issue-description') as HTMLTextAreaElement;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const text = formData.description || '';
    handleChange('description', `${text.slice(0, s)}${prefix}${text.slice(s, e)}${suffix}${text.slice(e)}`);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + prefix.length, e + prefix.length); }, 0);
  };

  const handleFileUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (!ev.target.files?.length) return;
    const file = ev.target.files[0];
    try {
      const result = await api.uploadFile(file);
      const url = (result as any).url || `/uploads/${result.id}`;
      const md = file.type.startsWith('image/') ? `![${file.name}](${url})` : `[${file.name}](${url})`;
      insertMarkdown(`\n${md}\n`);
    } catch {
      alert('ファイルのアップロードに失敗しました');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => (onCancel ? onCancel() : navigate(-1));
  const isSubmitDisabled = !formData.title?.trim() || isSaving;

  /* ============================================================
     レンダリング
  ============================================================ */
  return (
    <div className="flex flex-col h-full w-full bg-[#f0f0f0]">

      {/* ── ヘッダーバー ── */}
      <div className="flex justify-between items-center px-10 py-3 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-700 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-[17px] font-bold text-gray-800 m-0">課題の追加</h1>
          <span className="text-sm text-gray-400 font-normal">({projectKey})</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-1.5 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-600 transition-colors"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? 'エディタ' : 'プレビュー'}
          </button>
          <button
            className="px-6 py-1.5 text-sm text-white rounded font-bold shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--primary-color)' }}
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {isSaving ? '追加中...' : '追加'}
          </button>
        </div>
      </div>

      {/* ── スクロール可能なメインエリア ── */}
      <div className="flex-1 overflow-y-auto px-10 py-6 space-y-4">

        {/* ─── Section 1: 親課題 ─── */}
        <div className="bg-white border border-[#e0e0e0] rounded px-5 py-3">
          <button className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--primary-color)' }}>
            <Layers size={15} />
            親課題を設定する
          </button>
        </div>

        {/* ─── Section 2: 種別 ─── */}
        <div className="bg-white border border-[#e0e0e0] rounded">
          <div className="flex border-b border-[#e0e0e0]">
            <div className={LABEL_CELL}>
              種別 <span className="text-red-500 ml-1">*</span>
            </div>
            <div className={INPUT_CELL}>
              <select
                className={`${SELECT_BASE} max-w-[200px]`}
                value={issueType}
                onChange={e => setIssueType(e.target.value)}
              >
                <option value="タスク">タスク</option>
                <option value="バグ">バグ</option>
                <option value="要望">要望</option>
                <option value="その他">その他</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Section 3: 件名 ─── */}
        <div className="bg-white border border-[#e0e0e0] rounded">
          <div className="flex">
            <div className={LABEL_CELL}>
              件名 <span className="text-red-500 ml-1">*</span>
            </div>
            <div className={`${INPUT_CELL} py-4`}>
              <input
                type="text"
                className="w-full p-2.5 border border-gray-300 rounded text-sm bg-white outline-none focus:border-[#de7c9b] focus:ring-1 focus:ring-[#de7c9b] transition-all"
                placeholder="件名を入力してください"
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* ─── Section 4: 統合属性カード ─── */}
        <div className="bg-white border border-[#e0e0e0] rounded overflow-hidden">

          {/* 詳細エディタ */}
          <div className="border-b border-[#e0e0e0]">
            <div className="px-5 py-2 bg-[#fafafa] border-b border-[#e0e0e0]">
              <span className="text-[12px] font-bold text-gray-600">詳細</span>
            </div>
            {/* ツールバー */}
            <div className="flex items-center gap-1 px-4 py-2 bg-[#fafafa] border-b border-[#e0e0e0]">
              <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" onClick={() => insertMarkdown('**', '**')} title="太字"><Bold size={13} /></button>
              <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" onClick={() => insertMarkdown('*', '*')} title="斜体"><Italic size={13} /></button>
              <div className="w-px h-4 bg-gray-300 mx-2" />
              <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" onClick={() => insertMarkdown('[リンクテキスト](url)')} title="リンク"><LinkIcon size={13} /></button>
              <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" onClick={() => fileInputRef.current?.click()} title="画像を挿入"><ImageIcon size={13} /></button>
              <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} />
              <div className="flex-1" />
              <button
                className="text-xs px-3 py-1 text-gray-500 hover:bg-gray-200 rounded border border-transparent hover:border-gray-300 transition-colors"
                onClick={() => setIsPreview(!isPreview)}
              >
                プレビュー
              </button>
            </div>
            {/* エディタ本体 */}
            {isPreview ? (
              <div className="p-5 prose max-w-none min-h-[220px] bg-white text-sm">
                {formData.description
                  ? <ReactMarkdown>{formData.description}</ReactMarkdown>
                  : <span className="text-gray-400 italic">プレビューする内容がありません</span>}
              </div>
            ) : (
              <textarea
                id="issue-description"
                className="w-full min-h-[220px] p-5 outline-none resize-y text-sm bg-white block"
                placeholder="詳細を入力してください..."
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
              />
            )}
          </div>

          {/* ─ 属性テーブル ─
              構造: 各行 = [ラベル|入力] [ラベル|入力]
              左右を border-r で分離、行間を border-b で分離
          */}
          <div className="divide-y divide-[#e0e0e0]">

            {/* 行1: 状態 | 担当者 */}
            <AttrRow
              label1="状態"
              children1={
                <select
                  className={SELECT_BASE}
                  value={formData.status}
                  onChange={e => handleChange('status', e.target.value)}
                >
                  <option value="OPEN">🔴 未対応</option>
                  <option value="IN_PROGRESS">🔵 処理中</option>
                  <option value="RESOLVED">🟢 処理済み</option>
                  <option value="CLOSED">⚫ 完了</option>
                </select>
              }
              label2="担当者"
              children2={
                <div className="flex items-center gap-2 w-full">
                  <select
                    className={`${SELECT_BASE} flex-1`}
                    value={formData.assignee || ''}
                    onChange={e => handleChange('assignee', e.target.value === '未設定' ? null : e.target.value)}
                  >
                    {ASSIGNEES.map(a => (
                      <option key={a} value={a === '未設定' ? '' : a}>{a}</option>
                    ))}
                  </select>
                  <button className="text-xs px-3 py-1.5 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 whitespace-nowrap text-gray-700 transition-colors">
                    私が担当
                  </button>
                </div>
              }
            />

            {/* 行2: 優先度 | マイルストーン */}
            <AttrRow
              label1="優先度"
              children1={
                <select
                  className={SELECT_BASE}
                  value={formData.priority}
                  onChange={e => handleChange('priority', e.target.value)}
                >
                  <option value="HIGH">高</option>
                  <option value="MEDIUM">中</option>
                  <option value="LOW">低</option>
                </select>
              }
              label2={<>マイルストーン <span className="text-[#de7c9b] ml-1 font-normal">?</span></>  as any}
              children2={
                <div className="flex items-center gap-2 w-full">
                  <select
                    className={`${SELECT_BASE} flex-1`}
                    value={formData.milestoneIds?.[0] || ''}
                    onChange={e => handleArraySelect('milestoneIds', e.target.value)}
                  >
                    <option value="">未設定</option>
                    {MILESTONES.map(ms => <option key={ms} value={ms}>{ms}</option>)}
                  </select>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 bg-white shadow-sm shrink-0">+</button>
                </div>
              }
            />

            {/* 行3: カテゴリー | 発生バージョン */}
            <AttrRow
              label1="カテゴリー"
              children1={
                <div className="flex items-center gap-2 w-full">
                  <select
                    className={`${SELECT_BASE} flex-1`}
                    value={formData.categoryIds?.[0] || ''}
                    onChange={e => handleArraySelect('categoryIds', e.target.value)}
                  >
                    <option value="">未設定</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 bg-white shadow-sm shrink-0">+</button>
                </div>
              }
              label2={<>発生バージョン <span className="text-[#de7c9b] ml-1 font-normal">?</span></> as any}
              children2={
                <div className="flex items-center gap-2 w-full">
                  <select
                    className={`${SELECT_BASE} flex-1`}
                    value={formData.versionIds?.[0] || ''}
                    onChange={e => handleArraySelect('versionIds', e.target.value)}
                  >
                    <option value="">未設定</option>
                    {VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 bg-white shadow-sm shrink-0">+</button>
                </div>
              }
            />

            {/* 行4: 開始日 | 期限日 */}
            <AttrRow
              label1="開始日"
              children1={
                <input
                  type="date"
                  className="p-2 border border-gray-300 rounded text-sm bg-white outline-none focus:border-[#de7c9b] transition-colors w-[160px]"
                  value={formData.startDate || ''}
                  onChange={e => handleChange('startDate', e.target.value || null)}
                />
              }
              label2="期限日"
              children2={
                <input
                  type="date"
                  className="p-2 border border-gray-300 rounded text-sm bg-white outline-none focus:border-[#de7c9b] transition-colors w-[160px]"
                  value={formData.dueDate || ''}
                  onChange={e => handleChange('dueDate', e.target.value || null)}
                />
              }
            />

            {/* 行5: 予定時間 | 実績時間 */}
            <AttrRow
              label1="予定時間"
              children1={
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="w-24 p-2 border border-gray-300 rounded text-sm bg-white outline-none focus:border-[#de7c9b] transition-colors"
                    value={formData.estimatedHours ?? ''}
                    onChange={e => handleChange('estimatedHours', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                  <span className="text-xs text-gray-500">時間</span>
                </div>
              }
              label2="実績時間"
              children2={
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="w-24 p-2 border border-gray-300 rounded text-sm bg-white outline-none focus:border-[#de7c9b] transition-colors"
                    value={formData.actualHours ?? ''}
                    onChange={e => handleChange('actualHours', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                  <span className="text-xs text-gray-500">時間</span>
                </div>
              }
              isLast
            />
          </div>
        </div>

        {/* ─── Section 5: ファイル添付 ─── */}
        <div className="bg-white border border-dashed border-gray-300 rounded p-5 text-center text-xs text-gray-500">
          ファイルをドラッグ＆ドロップするかクリップボードから画像を貼り付けしてください または
          <button className="text-[#4488c5] border border-gray-300 bg-gray-50 px-3 py-1 rounded hover:bg-gray-100 transition-colors ml-2">
            ファイルを選択...
          </button>
          <div className="mt-1.5 text-[10px] text-gray-400">
            ファイル追加（Shiftキーを押しながらファイルを複数選択可能）
          </div>
        </div>

        {/* ─── Section 6: お知らせユーザー ─── */}
        <div className="bg-white border border-[#e0e0e0] rounded overflow-hidden">
          <div className="flex">
            <div className={`${LABEL_CELL} whitespace-nowrap`}>お知らせユーザー</div>
            <div className={`${INPUT_CELL} py-4`}>
              <input
                type="text"
                className="w-full p-2.5 border border-gray-300 rounded text-sm bg-white outline-none focus:border-[#de7c9b] focus:ring-1 focus:ring-[#de7c9b] transition-all"
                placeholder="ユーザー名を入力して絞り込み"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* ─── フッターアクション ─── */}
        <div className="flex justify-end gap-3 py-4">
          <button
            type="button"
            className="px-6 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold transition-colors"
            onClick={handleCancel}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="px-8 py-2 text-sm text-white rounded font-bold transition-opacity shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            {isSaving ? '追加中...' : '追加'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default IssueForm;
