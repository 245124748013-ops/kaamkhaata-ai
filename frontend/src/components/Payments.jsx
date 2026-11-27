import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getPayments, createPayment, deletePayment, getWorkEntries, getEmployers } from '../api';
import { useLang } from '../context/LangContext';
import { getTranslation } from '../translations';
import { useToast } from '../context/ToastContext';

const EMPTY = { work_entry_id: '', employer_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', notes: '' };

export default function Payments() {
  const { lang } = useLang();
  const { addToast } = useToast();
  const t = (p) => getTranslation(lang, p);
  const [payments, setPayments] = useState([]);
  const [entries, setEntries] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [pr, er, emr] = await Promise.all([getPayments(), getWorkEntries(), getEmployers()]);
    setPayments(pr.data);
    setEntries(er.data);
    setEmployers(emr.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await createPayment({ ...form, amount: parseFloat(form.amount), work_entry_id: form.work_entry_id || null, employer_id: form.employer_id || null });
      setShowModal(false);
      setForm(EMPTY);
      addToast('Payment recorded!', 'success');
      fetchAll();
    } catch (err) {
      addToast('Failed: ' + (err.response?.data?.detail || err.message), 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    await deletePayment(id);
    addToast('Payment deleted', 'success');
    fetchAll();
  };

  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="stat-card" style={{ flex: 1, minWidth: '160px' }}>
          <p className="stat-label">{t('payments.history')}</p>
          <p className="stat-value">₹{totalPayments.toLocaleString('en-IN')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setShowModal(true); }}>
            <Plus size={16} /> {t('payments.addPayment')}
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" /></div> :
          payments.length === 0 ? (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <h3>No payments yet</h3>
              <p>Record your first payment above</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>{t('payments.date')}</th>
                  <th>{t('payments.amount')}</th>
                  <th>{t('payments.mode')}</th>
                  <th>{t('payments.employer')}</th>
                  <th>{t('ledger.notes')}</th>
                  <th></th>
                </tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td>{p.payment_date}</td>
                      <td style={{ fontWeight: 700, color: '#16a34a' }}>₹{p.amount.toLocaleString('en-IN')}</td>
                      <td><span className="badge badge-paid" style={{ textTransform: 'capitalize' }}>{p.payment_mode}</span></td>
                      <td>{employers.find(e => e.id === p.employer_id)?.name || '—'}</td>
                      <td style={{ color: '#94a3b8' }}>{p.notes || '—'}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button></td>
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
              <h3>{t('payments.addPayment')}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('payments.amount')} *</label>
                    <input className="form-input" type="number" min="0" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('payments.date')} *</label>
                    <input className="form-input" type="date" required value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('payments.mode')}</label>
                    <select className="form-input form-select" value={form.payment_mode} onChange={e => setForm(f => ({ ...f, payment_mode: e.target.value }))}>
                      <option value="cash">{t('payments.cash')}</option>
                      <option value="upi">{t('payments.upi')}</option>
                      <option value="bank">{t('payments.bank')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('payments.employer')}</label>
                    <select className="form-input form-select" value={form.employer_id} onChange={e => setForm(f => ({ ...f, employer_id: e.target.value }))}>
                      <option value="">— Select —</option>
                      {employers.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('payments.workEntry')}</label>
                  <select className="form-input form-select" value={form.work_entry_id} onChange={e => setForm(f => ({ ...f, work_entry_id: e.target.value }))}>
                    <option value="">— Link to work entry (optional) —</option>
                    {entries.filter(e => e.pending_balance > 0).map(e => (
                      <option key={e.id} value={e.id}>{e.work_date} - {e.work_description} (₹{e.pending_balance} pending)</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('payments.notes')}</label>
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
