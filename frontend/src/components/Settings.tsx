import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

const Settings: React.FC = () => {
  const [themeColor, setThemeColor] = useState('#de7c9b');
  const [projectName, setProjectName] = useState('SDK_TEST_INTERNAL');
  const [projectKey, setProjectKey] = useState('SDK_TI');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedColor = localStorage.getItem('themeColor') || '#de7c9b';
    const savedName = localStorage.getItem('projectName') || 'SDK_TEST_INTERNAL';
    const savedKey = localStorage.getItem('projectKey') || 'SDK_TI';
    setThemeColor(savedColor);
    setProjectName(savedName);
    setProjectKey(savedKey);
  }, []);

  const handleSave = () => {
    localStorage.setItem('themeColor', themeColor);
    localStorage.setItem('projectName', projectName);
    localStorage.setItem('projectKey', projectKey);
    document.documentElement.style.setProperty('--primary-color', themeColor);
    
    // Dispatch custom event to notify TopNav
    window.dispatchEvent(new Event('storage-update'));
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const presets = ['#de7c9b', '#4488c5', '#a1af2f', '#f29c38', '#8c564b'];

  return (
    <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '600px', margin: '24px auto' }}>
      <div className="panel-header" style={{ fontSize: '16px', fontWeight: 'bold' }}>プロジェクト設定</div>
      <div className="panel-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-sub)' }}>プロジェクト名</label>
          <input 
            type="text" 
            value={projectName} 
            onChange={e => setProjectName(e.target.value)} 
            style={{ width: '100%', fontSize: '14px', padding: '8px 12px' }} 
          />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-sub)' }}>プロジェクトキー</label>
          <input 
            type="text" 
            value={projectKey} 
            onChange={e => setProjectKey(e.target.value)} 
            style={{ width: '100%', fontSize: '14px', padding: '8px 12px' }} 
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--text-sub)' }}>テーマカラー (全体アクセント)</label>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {presets.map(color => (
              <div 
                key={color} 
                onClick={() => setThemeColor(color)}
                style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', backgroundColor: color, cursor: 'pointer',
                  border: themeColor === color ? '3px solid #333' : '3px solid transparent',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s'
                }}
              />
            ))}
            <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--border-color)', margin: '0 8px' }} />
            <input 
              type="color" 
              value={themeColor} 
              onChange={e => setThemeColor(e.target.value)}
              style={{ width: '40px', height: '40px', border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
              title="カスタムカラー"
            />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
          {isSaved && <span style={{ color: 'var(--status-resolved)', fontSize: '13px', fontWeight: 'bold' }}>✓ 変更を保存しました</span>}
          <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Save size={16} /> 設定を保存して適用
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
