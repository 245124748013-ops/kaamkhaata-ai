import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { getWorkEntries, createWorkEntry, updateWorkEntry, deleteWorkEntry, getEmployers } from '../api';
import { useLang } from '../context/LangContext';
import { getTranslation } from '../translations';
import { useToast } from '../context/ToastContext';

const StatusBadge = ({ status, t }) => {
  const configs = {
    paid: { cls: 'badge-paid', label: t('common.paid') },
    pending: { cls: 'badge-pending', label: t('common.pending') },
    partial: { cls: 'badge-partial', label: t('common.partial') },
  };
  const cfg = configs[status] || configs.pending;
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
};

const EMPTY_FORM = {
  worker_name: '', employer_id: '', work_description: '', work_date: new Date().toISOString().split('T')[0],
  daily_wage: '', hours_worked: 8, wage_type: 'daily', payment_received: 0, advance_received: 0, notes: ''
};

export default function WorkLedger() {
  const { lang } = useLang();
  const { addToast } = useToast();
  const t = (p) => getTranslation(lang, p);

  const [entries, setEntries] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.payment_status = filterStatus;
      const [entriesRes, empsRes] = await Promise.all([getWorkEntries(params), getEmployers()]);
      setEntries(entriesRes.data);
      setEmployers(empsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [search, filterStatus]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditEntry(null); setShowModal(true); };
  const openEdit = (entry) => {
    setForm({
      worker_name: entry.worker_name, employer_id: entry.employer_id || '',
      work_description: entry.work_description, work_date: entry.work_date,
      daily_wage: entry.daily_wage, hours_worked: entry.hours_worked,
      wage_type: entry.wage_type, payment_received: entry.payment_received,
      advance_received: entry.advance_received, notes: entry.notes || ''
    });
    setEditEntry(entry);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, employer_id: form.employer_id || null, daily_wage: parseFloat(form.daily_wage) || 0, hours_worked: parseFloat(form.hours_worked) || 8, payment_received: parseFloat(form.payment_received) || 0, advance_received: parseFloat(form.advance_received) || 0 };
      if (editEntry) await updateWorkEntry(editEntry.id, payload);
      else await createWorkEntry(payload);
      setShowModal(false);
      addToast(editEntry ? 'Entry updated!' : 'Entry added!', 'success');
      fetchAll();
    } catch (err) {
      addToast('Failed to save: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await deleteWorkEntry(id);
      addToast('Entry deleted', 'success');
      fetchAll();
    } catch { addToast('Delete failed', 'error'); }
  };

  const preview = () => {
    const wage = parseFloat(form.daily_wage) || 0;
    const hours = parseFloat(form.hours_worked) || 8;
    const total = form.wage_type === 'hourly' ? wage * hours : wage;
    const received = parseFloat(form.payment_received) || 0;
    const advance = parseFloat(form.advance_received) || 0;
    return { total, pending: Math.max(0, total - received - advance) };
  };
  const { total, pending } = preview();

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            className="form-input" placeholder={t('ledger.search')}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <select className="form-input form-select" style={{ width: '140px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">{t('ledger.all')}</option>
          <option value="pending">{t('common.pending')}</option>
          <option value="partial">{t('common.partial')}</option>
          <option value="paid">{t('common.paid')}</option>
        </select>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> {t('ledger.addEntry')}
        </button>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" /></div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <h3>{t('ledger.noEntries')}</h3>
            <p>{t('ledger.addFirst')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('ledger.date')}</th>
                  <th>{t('ledger.description')}</th>
                  <th>{t('ledger.employer')}</th>
                  <th>{t('ledger.earned')}</th>
                  <th>{t('ledger.payment')}</th>
                  <th>{t('ledger.pending')}</th>
                  <th>{t('ledger.status')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 500 }}>{e.work_date}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{e.work_description}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{e.worker_name}</div>
                    </td>
                    <td>{e.employer?.name || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td style={{ fontWeight: 700, color: '#1e1b4b' }}>₹{e.total_earned?.toLocaleString('en-IN')}</td>
                    <td style={{ color: '#16a34a', fontWeight: 600 }}>₹{e.payment_received?.toLocaleString('en-IN')}</td>
                    <td style={{ color: e.pending_balance > 0 ? '#ea580c' : '#16a34a', fontWeight: 600 }}>₹{e.pending_balance?.toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={e.payment_status} t={t} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(e)}><Edit2 size={14} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editEntry ? t('ledger.edit') : t('ledger.addEntry')}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('ledger.worker')} *</label>
                    <input className="form-input" required value={form.worker_name} onChange={e => setForm(f => ({ ...f, worker_name: e.target.value }))} placeholder="Raju Kumar" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('ledger.date')} *</label>
                    <input className="form-input" type="date" required value={form.work_date} onChange={e => setForm(f => ({ ...f, work_date: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('ledger.description')} *</label>
                  <input className="form-input" required value={form.work_description} onChange={e => setForm(f => ({ ...f, work_description: e.target.value }))} placeholder="Mason work - laying bricks..." />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('ledger.employer')}</label>
                  <select className="form-input form-select" value={form.employer_id} onChange={e => setForm(f => ({ ...f, employer_id: e.target.value }))}>
                    <option value="">— {t('ledger.employer')} —</option>
                    {employers.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('ledger.wageType')}</label>
                    <select className="form-input form-select" value={form.wage_type} onChange={e => setForm(f => ({ ...f, wage_type: e.target.value }))}>
                      <option value="daily">{t('ledger.daily')}</option>
                      <option value="hourly">{t('ledger.hourly')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('ledger.wage')} *</label>
                    <input className="form-input" type="number" min="0" required value={form.daily_wage} onChange={e => setForm(f => ({ ...f, daily_wage: e.target.value }))} placeholder="600" />
                  </div>
                </div>
                {form.wage_type === 'hourly' && (
                  <div className="form-group">
                    <label className="form-label">{t('ledger.hours')}</label>
                    <input className="form-input" type="number" min="0" max="24" value={form.hours_worked} onChange={e => setForm(f => ({ ...f, hours_worked: e.target.value }))} />
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('ledger.payment')}</label>
                    <input className="form-input" type="number" min="0" value={form.payment_received} onChange={e => setForm(f => ({ ...f, payment_received: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('ledger.advance')}</label>
                    <input className="form-input" type="number" min="0" value={form.advance_received} onChange={e => setForm(f => ({ ...f, advance_received: e.target.value }))} />
                  </div>
                </div>
                {/* Preview */}
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>{t('ledger.earned')}: <strong style={{ color: '#1e1b4b' }}>₹{total.toLocaleString('en-IN')}</strong></span>
                    <span style={{ color: '#64748b' }}>{t('ledger.pending')}: <strong style={{ color: pending > 0 ? '#ea580c' : '#16a34a' }}>₹{pending.toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('ledger.notes')}</label>
                  <input className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
