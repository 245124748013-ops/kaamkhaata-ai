import React, { useState } from 'react';
import { Calculator as CalcIcon, RefreshCw } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { getTranslation } from '../translations';

export default function Calculator() {
  const { lang } = useLang();
  const t = (p) => getTranslation(lang, p);
  const [form, setForm] = useState({ wageType: 'daily', wage: '', days: '', hours: '', advance: '', payment: '' });
  const [result, setResult] = useState(null);

  const calculate = () => {
    const wage = parseFloat(form.wage) || 0;
    const days = parseFloat(form.days) || 1;
    const hours = parseFloat(form.hours) || 0;
    const advance = parseFloat(form.advance) || 0;
    const payment = parseFloat(form.payment) || 0;

    let gross = 0;
    if (form.wageType === 'daily') gross = wage * days;
    else gross = wage * hours;
    const net = Math.max(0, gross - advance - payment);

    setResult({ gross, advance, payment, net, totalReceived: advance + payment });
  };

  const reset = () => { setForm({ wageType: 'daily', wage: '', days: '', hours: '', advance: '', payment: '' }); setResult(null); };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#3d35ca,#6165f1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalcIcon size={24} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e1b4b' }}>{t('calculator.title')}</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Calculate your wages accurately</p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{t('calculator.wageType')}</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['daily', 'hourly'].map(type => (
              <button
                key={type}
                onClick={() => setForm(f => ({ ...f, wageType: type }))}
                className={`btn ${form.wageType === type ? 'btn-primary' : 'btn-secondary'}`}
              >
                {type === 'daily' ? t('calculator.daily') : t('calculator.hourly')}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('calculator.wage')}</label>
            <input className="form-input" type="number" min="0" value={form.wage} onChange={e => setForm(f => ({ ...f, wage: e.target.value }))} placeholder="600" />
          </div>
          {form.wageType === 'daily' ? (
            <div className="form-group">
              <label className="form-label">{t('calculator.days')}</label>
              <input className="form-input" type="number" min="1" value={form.days} onChange={e => setForm(f => ({ ...f, days: e.target.value }))} placeholder="26" />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">{t('calculator.hours')}</label>
              <input className="form-input" type="number" min="0" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} placeholder="208" />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('calculator.advance')}</label>
            <input className="form-input" type="number" min="0" value={form.advance} onChange={e => setForm(f => ({ ...f, advance: e.target.value }))} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('calculator.payment')}</label>
            <input className="form-input" type="number" min="0" value={form.payment} onChange={e => setForm(f => ({ ...f, payment: e.target.value }))} placeholder="0" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={calculate}><CalcIcon size={16} /> {t('calculator.calculate')}</button>
          <button className="btn btn-secondary" onClick={reset}><RefreshCw size={16} /></button>
        </div>

        {result && (
          <div style={{ marginTop: '28px', background: 'linear-gradient(135deg, #f8fafc, #f0f4ff)', borderRadius: '16px', padding: '24px', border: '1px solid #e0e9ff' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#1e1b4b' }}>{t('calculator.result')}</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { label: t('calculator.gross'), value: result.gross, color: '#1e1b4b', big: true },
                { label: 'Advance Received', value: result.advance, color: '#7c3aed' },
                { label: 'Payment Received', value: result.payment, color: '#16a34a' },
                { label: 'Total Received', value: result.totalReceived, color: '#16a34a' },
                { label: t('calculator.net'), value: result.net, color: result.net > 0 ? '#ea580c' : '#16a34a', big: true },
              ].map(({ label, value, color, big }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: big ? '12px 0' : '6px 0', borderBottom: big ? '1px solid #e2e8f0' : 'none' }}>
                  <span style={{ fontSize: big ? '15px' : '14px', fontWeight: big ? 700 : 500, color: big ? '#1e293b' : '#64748b' }}>{label}</span>
                  <span style={{ fontSize: big ? '20px' : '16px', fontWeight: 700, color }}>₹{value.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
