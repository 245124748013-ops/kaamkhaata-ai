import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Download, Calendar } from 'lucide-react';
import { getMonthlyReport, getWeeklyReport, getEmployerSummary, exportCSV } from '../api';
import { useLang } from '../context/LangContext';
import { getTranslation } from '../translations';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Reports() {
  const { lang } = useLang();
  const t = (p) => getTranslation(lang, p);
  const [tab, setTab] = useState('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [report, setReport] = useState(null);
  const [employerReport, setEmployerReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMonthly = async () => {
    setLoading(true);
    const r = await getMonthlyReport(year, month);
    setReport({ ...r.data, type: 'monthly' });
    setLoading(false);
  };

  const fetchEmployer = async () => {
    setLoading(true);
    const r = await getEmployerSummary();
    setEmployerReport(r.data);
    setLoading(false);
  };

  useEffect(() => {
    if (tab === 'monthly') fetchMonthly();
    else if (tab === 'employer') fetchEmployer();
  }, [tab, year, month]);

  const handleExport = () => {
    const url = exportCSV();
    window.open(url, '_blank');
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['monthly', 'employer'].map(tabKey => (
          <button
            key={tabKey}
            className={`btn ${tab === tabKey ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab(tabKey)}
          >
            {tabKey === 'monthly' ? t('reports.monthly') : t('reports.employer')}
          </button>
        ))}
        <button className="btn btn-teal" style={{ marginLeft: 'auto' }} onClick={handleExport}>
          <Download size={16} /> {t('reports.export')}
        </button>
      </div>

      {/* Controls */}
      {tab === 'monthly' && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <select className="form-input form-select" style={{ width: '100px' }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="form-input form-select" style={{ width: '140px' }} value={month} onChange={e => setMonth(parseInt(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
      )}

      {loading ? <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" /></div> :
        tab === 'monthly' && report ? (
          <div>
            {/* Summary cards */}
            <div className="grid-4" style={{ marginBottom: '20px' }}>
              {[
                { label: t('reports.earned'), value: report.total_earned, color: '#3d35ca' },
                { label: t('reports.received'), value: report.total_received, color: '#0d9488' },
                { label: t('reports.pending'), value: report.total_pending, color: '#ea580c' },
                { label: t('reports.days'), value: report.working_days, color: '#7c3aed', noInr: true },
              ].map(({ label, value, color, noInr }) => (
                <div key={label} className="stat-card">
                  <p className="stat-label">{label}</p>
                  <p className="stat-value" style={{ color }}>{noInr ? value : `₹${Number(value).toLocaleString('en-IN')}`}</p>
                </div>
              ))}
            </div>

            {/* Employer breakdown */}
            {Object.keys(report.employer_summary || {}).length > 0 && (
              <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#1e1b4b' }}>Employer Breakdown</h3>
                <div className="table-container">
                  <table>
                    <thead><tr>
                      <th>Employer</th>
                      <th>Earned</th>
                      <th>Received</th>
                      <th>Pending</th>
                      <th>Days</th>
                    </tr></thead>
                    <tbody>
                      {Object.entries(report.employer_summary).map(([emp, data]) => (
                        <tr key={emp}>
                          <td style={{ fontWeight: 600 }}>{emp}</td>
                          <td>₹{data.earned.toLocaleString('en-IN')}</td>
                          <td style={{ color: '#16a34a' }}>₹{data.received.toLocaleString('en-IN')}</td>
                          <td style={{ color: '#ea580c', fontWeight: 600 }}>₹{data.pending.toLocaleString('en-IN')}</td>
                          <td>{data.days}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Entries table */}
            {report.entries?.length > 0 && (
              <div className="card">
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e1b4b' }}>Work Entries — {MONTHS[month - 1]} {year}</h3>
                </div>
                <div className="table-container">
                  <table>
                    <thead><tr>
                      <th>Date</th>
                      <th>Work</th>
                      <th>Employer</th>
                      <th>Earned</th>
                      <th>Received</th>
                      <th>Pending</th>
                      <th>Status</th>
                    </tr></thead>
                    <tbody>
                      {report.entries.map(e => (
                        <tr key={e.id}>
                          <td>{e.work_date}</td>
                          <td>{e.work_description}</td>
                          <td>{e.employer || '—'}</td>
                          <td style={{ fontWeight: 700 }}>₹{e.total_earned?.toLocaleString('en-IN')}</td>
                          <td style={{ color: '#16a34a' }}>₹{e.payment_received?.toLocaleString('en-IN')}</td>
                          <td style={{ color: '#ea580c' }}>₹{e.pending_balance?.toLocaleString('en-IN')}</td>
                          <td><span className={`badge badge-${e.payment_status}`}>{e.payment_status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : tab === 'employer' && (
          <div className="card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e1b4b' }}>{t('reports.employer')}</h3>
            </div>
            {employerReport.length === 0 ? (
              <div className="empty-state"><h3>No employer data</h3></div>
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr>
                    <th>Employer</th>
                    <th>Total Earned</th>
                    <th>Total Received</th>
                    <th>Total Pending</th>
                    <th>Advances</th>
                    <th>Working Days</th>
                  </tr></thead>
                  <tbody>
                    {employerReport.map(emp => (
                      <tr key={emp.employer_id}>
                        <td style={{ fontWeight: 600 }}>{emp.employer_name}</td>
                        <td style={{ fontWeight: 700, color: '#1e1b4b' }}>₹{emp.total_earned.toLocaleString('en-IN')}</td>
                        <td style={{ color: '#16a34a' }}>₹{emp.total_received.toLocaleString('en-IN')}</td>
                        <td style={{ color: emp.total_pending > 0 ? '#ea580c' : '#16a34a', fontWeight: 600 }}>₹{emp.total_pending.toLocaleString('en-IN')}</td>
                        <td style={{ color: '#7c3aed' }}>₹{emp.total_advances.toLocaleString('en-IN')}</td>
                        <td>{emp.working_days}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
