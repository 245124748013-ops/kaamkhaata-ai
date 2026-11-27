import React, { useEffect, useState } from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { getAdvances, createAdvance, updateAdvance, deleteAdvance, getEmployers } from '../api';
import { useLang } from '../context/LangContext';
import { getTranslation } from '../translations';
import { useToast } from '../context/ToastContext';

const EMPTY = { employer_id: '', worker_name: 'Self', amount: '', advance_date: new Date().toISOString().split('T')[0], notes: '', is_adjusted: false };

export default function Advances() {
  const { lang } = useLang();
  const { addToast } = useToast();
  const t = (p) => getTranslation(lang, p);
  const [advances, setAdvances] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [ar, emr] = await Promise.all([getAdvances(), getEmployers()]);
    setAdvances(ar.data);
    setEmployers(emr.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await createAdvance({ ...form, amount: parseFloat(form.amount), employer_id: form.employer_id || null });
      setShowModal(false);
      setForm(EMPTY);
      addToast('Advance recorded!', 'success');
      fetchAll();
    } catch (err) {
      addToast('Failed: ' + (err.response?.data?.detail || err.message), 'error');
    }
  };

  const handleAdjust = async (id, current) => {
    await updateAdvance(id, { is_adjusted: !current });
    addToast('Status updated', 'success');
    fetchAll();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this advance?')) return;
    await deleteAdvance(id);
    addToast('Advance deleted', 'success');
    fetchAll();
  };

  const totalAdvances = advances.reduce((s, a) => s + a.amount, 0);
  const pendingAdvances = advances.filter(a => !a.is_adjusted).reduce((s, a) => s + a.amount, 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="stat-card" style={{ flex: 1, minWidth: '140px' }}>
          <p className="stat-label">Total Advances</p>
          <p className="stat-value">₹{totalAdvances.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card" style={{ flex: 1, minWidth: '140px' }}>
          <p className="stat-label">Pending Adjustments</p>
          <p className="stat-value" style={{ color: '#ea580c' }}>₹{pendingAdvances.toLocaleString('en-IN')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setShowModal(true); }}>
            <Plus size={16} /> {t('advances.addAdvance')}
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" /></div> :
          advances.length === 0 ? (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h3>No advances recorded</h3>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>{t('advances.date')}</th>
                  <th>{t('advances.amount')}</th>
                  <th>{t('advances.employer')}</th>
                  <th>{t('advances.worker')}</th>
                  <th>Status</th>
                  <th>{t('ledger.notes')}</th>
                  <th></th>
                </tr></thead>
                <tbody>
                  {advances.map(a => (
                    <tr key={a.id}>
                      <td>{a.advance_date}</td>
                      <td style={{ fontWeight: 700, color: '#7c3aed' }}>₹{a.amount.toLocaleString('en-IN')}</td>
                      <td>{employers.find(e => e.id === a.employer_id)?.name || '—'}</td>
                      <td>{a.worker_name || '—'}</td>
                      <td>
                        <button
                          onClick={() => handleAdjust(a.id, a.is_adjusted)}
                          className={`badge ${a.is_adjusted ? 'badge-paid' : 'badge-pending'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                        >
                          {a.is_adjusted ? t('advances.adjusted') : t('advances.pending')}
                        </button>
                      </td>
                      <td style={{ color: '#94a3b8' }}>{a.notes || '—'}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{t('advances.addAdvance')}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('advances.amount')} *</label>
                    <input className="form-input" type="number" min="0" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('advances.date')} *</label>
                    <input className="form-input" type="date" required value={form.advance_date} onChange={e => setForm(f => ({ ...f, advance_date: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('advances.worker')}</label>
                    <input className="form-input" value={form.worker_name} onChange={e => setForm(f => ({ ...f, worker_name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('advances.employer')}</label>
                    <select className="form-input form-select" value={form.employer_id} onChange={e => setForm(f => ({ ...f, employer_id: e.target.value }))}>
                      <option value="">— Select —</option>
                      {employers.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('advances.notes')}</label>
                  <input className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
