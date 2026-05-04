import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Issue } from '../types';
import { api } from '../api/client';
import {
  Bold, Italic, Link as LinkIcon, Image as ImageIcon, ChevronLeft, Layers,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  projectKey: string;
  initialStatus?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CATEGORIES = ['開発', 'インフラ', 'デザイン', 'ドキュメント', 'その他'];
const MILESTONES  = ['リリース 1.0', 'リリース 2.0', 'MVPフェーズ', 'デバッグ期間'];
const VERSIONS    = ['v0.9-beta', 'v1.0-stable', 'v1.1-rc'];
const ASSIGNEES   = ['未設定', '山崎大地', 'テストユーザー'];

/* ================================================================
   インラインスタイル定数（Tailwindパージを完全回避）
================================================================ */
const S = {
  /** ラベルセル */
  label: {
    width: '160px',
    minWidth: '160px',
    backgroundColor: '#fafafa',
    borderRight: '1px solid #e0e0e0',
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#555',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  } as React.CSSProperties,

  /** 入力セル */
  input: {
    flex: 1,
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  } as React.CSSProperties,

  /** 行ラッパー（左右ペア） */
  row: {
    display: 'flex',
    borderBottom: '1px solid #e0e0e0',
  } as React.CSSProperties,

  /** 行ラッパー（最終行: border-bottom なし） */
  rowLast: {
    display: 'flex',
  } as React.CSSProperties,

  /** 左ペア（50% 幅 + 右ボーダー） */
  pairLeft: {
    display: 'flex',
    flex: 1,
    borderRight: '1px solid #e0e0e0',
  } as React.CSSProperties,

  /** 右ペア（50% 幅） */
  pairRight: {
    display: 'flex',
    flex: 1,
  } as React.CSSProperties,

  /** セレクト共通 */
  select: {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '13px',
    backgroundColor: '#fff',
    outline: 'none',
    color: '#333',
  } as React.CSSProperties,
};

/* ================================================================
   AttrRow: [label|input] [label|input] の2ペア行
================================================================ */
interface AttrRowProps {
  label1: React.ReactNode;
  input1: React.ReactNode;
  label2?: React.ReactNode;
  input2?: React.ReactNode;
  isLast?: boolean;
}
const AttrRow: React.FC<AttrRowProps> = ({ label1, input1, label2, input2, isLast }) => (
  <div style={isLast ? S.rowLast : S.row}>
    {/* 左ペア */}
    <div style={S.pairLeft}>
      <div style={S.label}>{label1}</div>
      <div style={S.input}>{input1}</div>
    </div>
    {/* 右ペア */}
    {label2 !== undefined ? (
      <div style={S.pairRight}>
        <div style={S.label}>{label2}</div>
        <div style={S.input}>{input2}</div>
      </div>
    ) : (
      <div style={{ flex: 1 }} />
    )}
  </div>
);

/* ================================================================
   IssueForm
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
  const [isSaving, setIsSaving]   = useState(false);
  const [issueType, setIssueType] = useState('タスク');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof Issue, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleArraySelect = (
    field: 'categoryIds' | 'milestoneIds' | 'versionIds',
    value: string,
  ) => setFormData(prev => ({ ...prev, [field]: value ? [value] : [] }));

  const handleSubmit = async () => {
    if (!formData.title?.trim()) { alert('件名を入力してください'); return; }
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
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        alert(`課題の追加に失敗しました (${res.status}): ${err.error || JSON.stringify(err)}`);
        return;
      }
      if (onSuccess) onSuccess();
    } catch (e: any) {
      alert(`通信エラーが発生しました: ${e?.message || e}`);
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

  /* ----------------------------------------------------------
     ラベルとセレクトの局所スタイル（インライン確定）
  ---------------------------------------------------------- */
  const dateInput: React.CSSProperties = {
    padding: '6px 8px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '13px',
    backgroundColor: '#fff',
    outline: 'none',
    width: '160px',
  };

  const numInput: React.CSSProperties = {
    padding: '6px 8px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '13px',
    backgroundColor: '#fff',
    outline: 'none',
    width: '80px',
  };

  const card: React.CSSProperties = {
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
  };

  const sectionGap: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#f0f0f0' }}>

      {/* ── ヘッダー ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 40px', backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={handleCancel} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <ChevronLeft size={20} />
          </button>
          <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#1f2937', margin: 0 }}>課題の追加</h1>
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>({projectKey})</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setIsPreview(!isPreview)}
            style={{ padding: '6px 14px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', color: '#4b5563', cursor: 'pointer' }}
          >
            {isPreview ? 'エディタ' : 'プレビュー'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            style={{
              padding: '6px 22px', fontSize: '13px', color: '#fff',
              backgroundColor: 'var(--primary-color)', border: 'none',
              borderRadius: '4px', fontWeight: 700, cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
              opacity: isSubmitDisabled ? 0.4 : 1,
            }}
          >
            {isSaving ? '追加中...' : '追加'}
          </button>
        </div>
      </div>

      {/* ── メインエリア ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px', ...sectionGap }}>

        {/* S1: 親課題 */}
        <div style={card}>
          <div style={{ padding: '10px 16px' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Layers size={15} />
              親課題を設定する
            </button>
          </div>
        </div>

        {/* S2: 種別 */}
        <div style={card}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
            <div style={S.label}>種別 <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></div>
            <div style={S.input}>
              <select style={{ ...S.select, maxWidth: '200px' }} value={issueType} onChange={e => setIssueType(e.target.value)}>
                <option value="タスク">タスク</option>
                <option value="バグ">バグ</option>
                <option value="要望">要望</option>
                <option value="その他">その他</option>
              </select>
            </div>
          </div>
        </div>

        {/* S3: 件名 */}
        <div style={card}>
          <div style={{ display: 'flex' }}>
            <div style={S.label}>件名 <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></div>
            <div style={{ ...S.input, padding: '14px 16px' }}>
              <input
                type="text"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}
                placeholder="件名を入力してください"
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* S4: 統合属性カード */}
        <div style={card}>

          {/* 詳細エディタ */}
          <div style={{ borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ padding: '8px 16px', backgroundColor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#555' }}>詳細</span>
            </div>
            {/* ツールバー */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', backgroundColor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
              <button style={{ padding: '5px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '3px' }} onClick={() => insertMarkdown('**', '**')} title="太字"><Bold size={13} /></button>
              <button style={{ padding: '5px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '3px' }} onClick={() => insertMarkdown('*', '*')} title="斜体"><Italic size={13} /></button>
              <div style={{ width: '1px', height: '16px', backgroundColor: '#d1d5db', margin: '0 6px' }} />
              <button style={{ padding: '5px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '3px' }} onClick={() => insertMarkdown('[リンクテキスト](url)')} title="リンク"><LinkIcon size={13} /></button>
              <button style={{ padding: '5px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '3px' }} onClick={() => fileInputRef.current?.click()} title="画像"><ImageIcon size={13} /></button>
              <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} />
              <div style={{ flex: 1 }} />
              <button
                style={{ fontSize: '12px', padding: '4px 10px', color: '#6b7280', background: 'none', border: '1px solid transparent', borderRadius: '3px', cursor: 'pointer' }}
                onClick={() => setIsPreview(!isPreview)}
              >
                プレビュー
              </button>
            </div>
            {/* 本体 */}
            {isPreview ? (
              <div style={{ padding: '20px', minHeight: '220px', backgroundColor: '#fff', fontSize: '13px' }}>
                {formData.description
                  ? <ReactMarkdown>{formData.description}</ReactMarkdown>
                  : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>プレビューする内容がありません</span>}
              </div>
            ) : (
              <textarea
                id="issue-description"
                style={{ width: '100%', minHeight: '220px', padding: '20px', outline: 'none', resize: 'vertical', fontSize: '13px', backgroundColor: '#fff', border: 'none', display: 'block', fontFamily: 'inherit' }}
                placeholder="詳細を入力してください..."
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
              />
            )}
          </div>

          {/* ── 属性テーブル ── */}
          {/* 行1: 状態 | 担当者 */}
          <AttrRow
            label1="状態"
            input1={
              <select style={S.select} value={formData.status} onChange={e => handleChange('status', e.target.value)}>
                <option value="OPEN">🔴 未対応</option>
                <option value="IN_PROGRESS">🔵 処理中</option>
                <option value="RESOLVED">🟢 処理済み</option>
                <option value="CLOSED">⚫ 完了</option>
              </select>
            }
            label2="担当者"
            input2={
              <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                <select style={{ ...S.select, flex: 1 }} value={formData.assignee || ''} onChange={e => handleChange('assignee', e.target.value === '未設定' ? null : e.target.value)}>
                  {ASSIGNEES.map(a => <option key={a} value={a === '未設定' ? '' : a}>{a}</option>)}
                </select>
                <button style={{ fontSize: '12px', padding: '5px 10px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap', color: '#374151' }}>私が担当</button>
              </div>
            }
          />

          {/* 行2: 優先度 | マイルストーン */}
          <AttrRow
            label1="優先度"
            input1={
              <select style={S.select} value={formData.priority} onChange={e => handleChange('priority', e.target.value)}>
                <option value="HIGH">高</option>
                <option value="MEDIUM">中</option>
                <option value="LOW">低</option>
              </select>
            }
            label2={<>マイルストーン <span style={{ color: '#de7c9b', marginLeft: '4px', fontWeight: 400 }}>?</span></>}
            input2={
              <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                <select style={{ ...S.select, flex: 1 }} value={formData.milestoneIds?.[0] || ''} onChange={e => handleArraySelect('milestoneIds', e.target.value)}>
                  <option value="">未設定</option>
                  {MILESTONES.map(ms => <option key={ms} value={ms}>{ms}</option>)}
                </select>
                <button style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
              </div>
            }
          />

          {/* 行3: カテゴリー | 発生バージョン */}
          <AttrRow
            label1="カテゴリー"
            input1={
              <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                <select style={{ ...S.select, flex: 1 }} value={formData.categoryIds?.[0] || ''} onChange={e => handleArraySelect('categoryIds', e.target.value)}>
                  <option value="">未設定</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
              </div>
            }
            label2={<>発生バージョン <span style={{ color: '#de7c9b', marginLeft: '4px', fontWeight: 400 }}>?</span></>}
            input2={
              <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                <select style={{ ...S.select, flex: 1 }} value={formData.versionIds?.[0] || ''} onChange={e => handleArraySelect('versionIds', e.target.value)}>
                  <option value="">未設定</option>
                  {VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <button style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
              </div>
            }
          />

          {/* 行4: 開始日 | 期限日 */}
          <AttrRow
            label1="開始日"
            input1={<input type="date" style={dateInput} value={formData.startDate || ''} onChange={e => handleChange('startDate', e.target.value || null)} />}
            label2="期限日"
            input2={<input type="date" style={dateInput} value={formData.dueDate || ''} onChange={e => handleChange('dueDate', e.target.value || null)} />}
          />

          {/* 行5: 予定時間 | 実績時間 */}
          <AttrRow
            label1="予定時間"
            input1={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" step="0.5" min="0" style={numInput} value={formData.estimatedHours ?? ''} onChange={e => handleChange('estimatedHours', e.target.value ? parseFloat(e.target.value) : null)} />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>時間</span>
              </div>
            }
            label2="実績時間"
            input2={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" step="0.5" min="0" style={numInput} value={formData.actualHours ?? ''} onChange={e => handleChange('actualHours', e.target.value ? parseFloat(e.target.value) : null)} />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>時間</span>
              </div>
            }
            isLast
          />
        </div>

        {/* S5: ファイル添付 */}
        <div style={{ backgroundColor: '#fff', border: '1px dashed #d1d5db', borderRadius: '4px', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
          ファイルをドラッグ＆ドロップするかクリップボードから画像を貼り付けしてください または
          <button style={{ color: '#4488c5', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', marginLeft: '8px', fontSize: '12px' }}>
            ファイルを選択...
          </button>
          <div style={{ marginTop: '6px', fontSize: '11px', color: '#d1d5db' }}>
            ファイル追加（Shiftキーを押しながらファイルを複数選択可能）
          </div>
        </div>

        {/* S6: お知らせユーザー */}
        <div style={card}>
          <div style={{ display: 'flex' }}>
            <div style={{ ...S.label, whiteSpace: 'nowrap' }}>お知らせユーザー</div>
            <div style={{ ...S.input, padding: '14px 16px' }}>
              <input
                type="text"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}
                placeholder="ユーザー名を入力して絞り込み"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* フッターアクション */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingBottom: '16px' }}>
          <button
            type="button"
            onClick={handleCancel}
            style={{ padding: '8px 20px', fontSize: '13px', color: '#4b5563', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            style={{
              padding: '8px 28px', fontSize: '13px', color: '#fff',
              backgroundColor: 'var(--primary-color)', border: 'none',
              borderRadius: '4px', fontWeight: 700, cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
              opacity: isSubmitDisabled ? 0.4 : 1,
            }}
          >
            {isSaving ? '追加中...' : '追加'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default IssueForm;
