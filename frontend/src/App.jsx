
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

const pageVariants = {
  initial: { opacity: 0, y: 18, filter: 'blur(5px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -12, filter: 'blur(4px)' },
};

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const PageComponent = PAGES[currentPage] || Dashboard;

  return (
    <LangProvider>
      <ToastProvider>
        <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentPage}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <PageComponent />
            </motion.div>
          </AnimatePresence>
        </Layout>
      </ToastProvider>
    </LangProvider>
  );
}

export default App;
