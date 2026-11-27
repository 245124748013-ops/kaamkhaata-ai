import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Edit3, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { createWorkEntry, getEmployers } from '../api';
import { useLang } from '../context/LangContext';
import { getTranslation } from '../translations';
import { useToast } from '../context/ToastContext';

const LANG_CODES = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' };

function extractWorkInfo(text) {
  const info = { work_description: text, worker_name: 'Self', work_date: new Date().toISOString().split('T')[0], daily_wage: 0, payment_received: 0, advance_received: 0, wage_type: 'daily', hours_worked: 8 };
  // Extract wage
  const wageMatch = text.match(/(?:₹|rs\.?|rupees?|wage|mujhe|salary|pay(?:ment)?)[:\s]*(\d+)/i) || text.match(/(\d+)\s*(?:rupees?|₹|rs\.?)/i);
  if (wageMatch) info.daily_wage = parseInt(wageMatch[1]);
  // Extract advance
  const advMatch = text.match(/advance[:\s]*(?:₹|rs\.?)?(\d+)/i);
  if (advMatch) info.advance_received = parseInt(advMatch[1]);
  // Extract payment received
  const payMatch = text.match(/(?:received|mila|paid|payment)[:\s]*(?:₹|rs\.?)?(\d+)/i);
  if (payMatch) info.payment_received = parseInt(payMatch[1]);
  // Extract name
  const nameMatch = text.match(/(?:my name is|naam|mera naam|naaku|peru)[:\s]+([A-Za-z\u0900-\u097F\u0C00-\u0C7F]+(?:\s+[A-Za-z\u0900-\u097F\u0C00-\u0C7F]+)?)/i);
  if (nameMatch) info.worker_name = nameMatch[1];
  return info;
}

export default function VoiceEntry() {
  const { lang } = useLang();
  const { addToast } = useToast();
  const t = (p) => getTranslation(lang, p);

  const [voiceLang, setVoiceLang] = useState(lang);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [extracted, setExtracted] = useState(null);
  const [supported, setSupported] = useState(true);
  const [phase, setPhase] = useState('idle'); // idle | listening | done | confirm
  const [form, setForm] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [saving, setSaving] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setSupported(false);
    }
    getEmployers().then(r => setEmployers(r.data)).catch(() => {});
  }, []);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = LANG_CODES[voiceLang] || 'en-IN';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(' ');
      setTranscript(t);
    };
    rec.onend = () => {
      setRecording(false);
      setPhase('done');
    };
    rec.onerror = (e) => {
      setRecording(false);
      setPhase('idle');
      addToast('Voice recognition error: ' + e.error, 'error');
    };
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
    setPhase('listening');
    setTranscript('');
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const handleExtract = () => {
    const info = extractWorkInfo(transcript);
    setExtracted(info);
    setForm({ ...info, employer_id: '' });
    setPhase('confirm');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        employer_id: form.employer_id || null,
        daily_wage: parseFloat(form.daily_wage) || 0,
        payment_received: parseFloat(form.payment_received) || 0,
        advance_received: parseFloat(form.advance_received) || 0,
        hours_worked: parseFloat(form.hours_worked) || 8,
      };
      await createWorkEntry(payload);
      addToast('Work entry saved!', 'success');
      setPhase('idle');
      setTranscript('');
      setForm(null);
    } catch (err) {
      addToast('Save failed: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => { setPhase('idle'); setTranscript(''); setForm(null); };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Voice lang selector */}
      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '12px' }}>{t('voice.selectLang')}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[['en', 'English'], ['hi', 'हिंदी'], ['te', 'తెలుగు']].map(([code, label]) => (
            <button
              key={code}
              onClick={() => setVoiceLang(code)}
              className={`btn ${voiceLang === code ? 'btn-primary' : 'btn-secondary'}`}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Voice button */}
      {!supported ? (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 16px', color: '#ea580c' }} />
          <p style={{ color: '#ea580c', fontWeight: 600, marginBottom: '12px' }}>{t('voice.notSupported')}</p>
          <button className="btn btn-primary" onClick={() => { setPhase('confirm'); setForm({ ...extractWorkInfo(''), employer_id: '' }); }}>
            <Edit3 size={16} /> {t('voice.manualEntry')}
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: '40px 32px', textAlign: 'center' }}>
          {phase === 'idle' || phase === 'listening' ? (
            <div className="voice-btn-container">
              <div style={{ position: 'relative' }}>
                <button
                  className={`voice-btn ${recording ? 'recording' : ''}`}
                  onClick={recording ? stopRecording : startRecording}
                >
                  {recording && <span className="voice-ripple" />}
                  {recording && <span className="voice-ripple" style={{ animationDelay: '0.5s' }} />}
                  {recording ? <MicOff size={40} /> : <Mic size={40} />}
                </button>
              </div>
              <div>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#1e1b4b' }}>
                  {recording ? t('voice.tapToStop') : t('voice.tapToSpeak')}
                </p>
                {recording && <p style={{ color: '#ea580c', fontSize: '14px', marginTop: '4px', fontWeight: 500 }}>{t('voice.listening')}</p>}
              </div>
              {transcript && (
                <div style={{ width: '100%', background: '#f8fafc', borderRadius: '12px', padding: '16px', textAlign: 'left' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>{t('voice.recognized')}</p>
                  <p style={{ color: '#1e293b' }}>{transcript}</p>
                </div>
              )}
              {!recording && transcript && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-primary" onClick={handleExtract}><CheckCircle size={16} /> Extract & Review</button>
                  <button className="btn btn-secondary" onClick={reset}><RefreshCw size={16} /> {t('voice.tryAgain')}</button>
                </div>
              )}
              <button className="btn btn-secondary" onClick={() => { setPhase('confirm'); setForm({ ...extractWorkInfo(''), employer_id: '' }); }}>
                <Edit3 size={16} /> {t('voice.manualEntry')}
              </button>
            </div>
          ) : phase === 'done' && !form ? (
            <div>
              <p>{transcript || 'No speech detected.'}</p>
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleExtract}>Review & Save</button>
              <button className="btn btn-secondary" style={{ marginTop: '8px', marginLeft: '8px' }} onClick={reset}>Try Again</button>
            </div>
          ) : null}
        </div>
      )}

      {/* Confirm/Edit form */}
      {phase === 'confirm' && form && (
        <div className="card" style={{ padding: '28px', marginTop: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: '#1e1b4b' }}>
            {t('voice.extracted')}
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('ledger.worker')}</label>
              <input className="form-input" value={form.worker_name} onChange={e => setForm(f => ({ ...f, worker_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('ledger.date')}</label>
              <input className="form-input" type="date" value={form.work_date} onChange={e => setForm(f => ({ ...f, work_date: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('ledger.description')}</label>
            <input className="form-input" value={form.work_description} onChange={e => setForm(f => ({ ...f, work_description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('ledger.employer')}</label>
            <select className="form-input form-select" value={form.employer_id} onChange={e => setForm(f => ({ ...f, employer_id: e.target.value }))}>
              <option value="">— Select Employer —</option>
              {employers.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('ledger.wage')}</label>
              <input className="form-input" type="number" value={form.daily_wage} onChange={e => setForm(f => ({ ...f, daily_wage: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('ledger.payment')}</label>
              <input className="form-input" type="number" value={form.payment_received} onChange={e => setForm(f => ({ ...f, payment_received: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('ledger.advance')}</label>
            <input className="form-input" type="number" value={form.advance_received} onChange={e => setForm(f => ({ ...f, advance_received: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button className="btn btn-secondary" onClick={reset}>{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <CheckCircle size={16} /> {saving ? '...' : t('voice.confirm')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
