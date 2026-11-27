import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Phone, MapPin } from 'lucide-react';
import { getEmployers, createEmployer, updateEmployer, deleteEmployer } from '../api';
import { useLang } from '../context/LangContext';
import { getTranslation } from '../translations';
import { useToast } from '../context/ToastContext';

const EMPTY = { name: '', phone: '', address: '', notes: '' };

export default function Employers() {
  const { lang } = useLang();
  const { addToast } = useToast();
  const t = (p) => getTranslation(lang, p);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const fetchAll = async () => {
    setLoading(true);
    const r = await getEmployers();
    setEmployers(r.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setForm(EMPTY); setEditEmp(null); setShowModal(true); };
  const openEdit = (emp) => {
    setForm({ name: emp.name, phone: emp.phone || '', address: emp.address || '', notes: emp.notes || '' });
    setEditEmp(emp);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editEmp) await updateEmployer(editEmp.id, form);
      else await createEmployer(form);
      setShowModal(false);
      addToast(editEmp ? 'Employer updated!' : 'Employer added!', 'success');
      fetchAll();
    } catch (err) {
      addToast('Failed: ' + (err.response?.data?.detail || err.message), 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employer?')) return;
    try {
      await deleteEmployer(id);
      addToast('Deleted', 'success');
      fetchAll();
    } catch { addToast('Delete failed', 'error'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> {t('employers.add')}</button>
      </div>

      {loading ? <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" /></div> :
        employers.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <h3>No employers yet</h3>
              <p>Add your first employer above</p>
            </div>
          </div>
        ) : (
          <div className="grid-3">
            {employers.map(emp => (
              <div key={emp.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#3d35ca,#6165f1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18 }}>
                    {emp.name[0].toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(emp)}><Edit2 size={14} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#1e1b4b', marginBottom: '8px' }}>{emp.name}</h3>
                {emp.phone && <p style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {emp.phone}</p>}
                {emp.address && <p style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><MapPin size={12} /> {emp.address}</p>}
                {emp.notes && <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', fontStyle: 'italic' }}>{emp.notes}</p>}
              </div>
            ))}
          </div>
        )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editEmp ? t('employers.edit') : t('employers.add')}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('employers.name')} *</label>
                  <input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ramesh Constructions" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('employers.phone')}</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('employers.address')}</label>
                  <input className="form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Hyderabad, Telangana" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('employers.notes')}</label>
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
