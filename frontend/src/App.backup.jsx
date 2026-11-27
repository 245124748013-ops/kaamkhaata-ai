import React, { useState } from 'react';
import './index.css';
import Layout from './components/Layout.jsx';
import Dashboard from './components/Dashboard.jsx';
import WorkLedger from './components/WorkLedger.jsx';
import VoiceEntry from './components/VoiceEntry.jsx';
import Payments from './components/Payments.jsx';
import Advances from './components/Advances.jsx';
import Calculator from './components/Calculator.jsx';
import Reports from './components/Reports.jsx';
import AIAssistant from './components/AIAssistant.jsx';
import Employers from './components/Employers.jsx';
import { LangProvider } from './context/LangContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

const PAGES = {
  dashboard: Dashboard,
  ledger: WorkLedger,
  voice: VoiceEntry,
  payments: Payments,
  advances: Advances,
  calculator: Calculator,
  reports: Reports,
  ai: AIAssistant,
  employers: Employers,
};

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const PageComponent = PAGES[currentPage] || Dashboard;

  return (
    <LangProvider>
      <ToastProvider>
        <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
          <PageComponent />
        </Layout>
      </ToastProvider>
    </LangProvider>
  );
}

export default App;
