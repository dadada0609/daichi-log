import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, CheckCircle } from 'lucide-react';
import { api } from '../api/client';
import { SearchResult } from '../types';

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const debounceTimeout = setTimeout(async () => {
      if (query.trim().length > 0) {
        setLoading(true);
        try {
          const res = await api.searchAll(query);
          setResults(res);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300); // 300ms debounce
    return () => clearTimeout(debounceTimeout);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    if (result.type === 'issue') navigate(`/issues`); 
    if (result.type === 'wiki') navigate(`/wiki/${result.id}`);
    if (result.type === 'file') navigate(`/files`);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '300px' }}>
      <div style={{ position: 'relative' }}>
        <input 
          type="text" 
          placeholder="課題、Wiki、ファイルを検索" 
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => { if (query) setIsOpen(true); }}
          style={{ 
            width: '100%', 
            padding: '6px 12px 6px 32px', 
            borderRadius: '16px', 
            border: 'none', 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            color: '#fff',
            outline: 'none',
            fontSize: '13px',
            transition: 'all 0.2s'
          }} 
        />
        <Search size={14} color="#fff" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.8 }} />
      </div>

      {isOpen && query.trim().length > 0 && (
        <div style={{ 
          position: 'absolute', 
          top: '36px', 
          left: 0, 
          width: '400px', 
          backgroundColor: '#fff', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
          borderRadius: '4px', 
          zIndex: 2000,
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {loading ? (
             <div className="spinner-wrapper"><div className="spinner" /> 検索中...</div>
          ) : results.length > 0 ? (
            <div>
              {results.map((r, i) => (
                <div 
                  key={`${r.type}-${r.id}-${i}`}
                  onClick={() => handleSelect(r)}
                  style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid var(--border-color)', 
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    {r.type === 'issue' ? <CheckCircle size={14} color="var(--status-open)" /> : <FileText size={14} color="var(--link-color)" />}
                    {r.match}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div style={{ padding: '16px', color: 'var(--text-sub)', fontSize: '13px', textAlign: 'center' }}>一致する結果がありません</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
