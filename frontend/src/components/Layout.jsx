import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, Mic, CreditCard, TrendingUp, Calculator, BarChart3, Bot, Users, Menu, X, RefreshCw } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { getTranslation } from '../translations';
import { resetDemo } from '../api';
import { useToast } from '../context/ToastContext';

const NAV_ITEMS = [
  { key: 'dashboard', icon: LayoutDashboard },
  { key: 'ledger', icon: BookOpen },
  { key: 'voice', icon: Mic },
  { key: 'payments', icon: CreditCard },
  { key: 'advances', icon: TrendingUp },
  { key: 'calculator', icon: Calculator },
  { key: 'reports', icon: BarChart3 },
  { key: 'ai', icon: Bot },
  { key: 'employers', icon: Users },
];

const MOBILE_NAV = [
  { key: 'dashboard', icon: LayoutDashboard },
  { key: 'ledger', icon: BookOpen },
  { key: 'voice', icon: Mic },
  { key: 'ai', icon: Bot },
  { key: 'reports', icon: BarChart3 },
];

export default function Layout({ currentPage, onNavigate, children }) {
  const { lang, changeLang } = useLang();
  const { addToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = (p) => getTranslation(lang, p);

  const handleReset = async () => {
    if (!window.confirm('Reset all demo data?')) return;
    try {
      await resetDemo();
      addToast('Demo data reset!', 'success');
      window.location.reload();
    } catch {
      addToast('Reset failed', 'error');
    }
  };

  const navigate = (page) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>Kaam<span>Khaata</span> AI</h1>
          <p>{t('tagline')}</p>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              className={`nav-item ${currentPage === key ? 'active' : ''}`}
              onClick={() => navigate(key)}
            >
              <Icon size={18} />
              {t(`nav.${key}`)}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Language</p>
          <div className="lang-selector">
            {['en', 'hi', 'te'].map(l => (
              <button key={l} className={`lang-btn ${lang === l ? 'active' : ''}`} onClick={() => changeLang(l)}>
                {l === 'en' ? 'EN' : l === 'hi' ? 'हिं' : 'తె'}
              </button>
            ))}
          </div>
          <button
            onClick={handleReset}
            style={{ marginTop: '12px', width: '100%', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
          >
            <RefreshCw size={14} /> {t('common.resetDemo')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2>{t(`nav.${currentPage}`)}</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['en', 'hi', 'te'].map(l => (
              <button
                key={l}
                onClick={() => changeLang(l)}
                style={{
                  padding: '6px 12px', borderRadius: '20px', border: '1.5px solid',
                  borderColor: lang === l ? '#3d35ca' : '#e2e8f0',
                  background: lang === l ? '#3d35ca' : 'white',
                  color: lang === l ? 'white' : '#64748b',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                {l === 'en' ? 'EN' : l === 'hi' ? 'हिं' : 'తె'}
              </button>
            ))}
          </div>
        </div>

        {/* Page content */}
        <div className="page-content">{children}</div>
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav">
        <div className="bottom-nav-items">
          {MOBILE_NAV.map(({ key, icon: Icon }) => (
            <button
              key={key}
              className={`bottom-nav-item ${currentPage === key ? 'active' : ''}`}
              onClick={() => navigate(key)}
            >
              <Icon />
              <span>{t(`nav.${key}`)}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
