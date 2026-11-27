import React, { useEffect, useState, useRef } from 'react';
import { Send, Bot, User, Mic, MicOff } from 'lucide-react';
import { aiQuery, getAISuggestions } from '../api';
import { useLang } from '../context/LangContext';
import { getTranslation } from '../translations';

const LANG_CODES = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' };

const WELCOME_MSGS = {
  en: "👋 Hello! I'm your KaamKhaata AI assistant. I can answer questions about your earnings, pending payments, advances, and work history — all from your actual records. How can I help you today?",
  hi: "👋 नमस्ते! मैं आपका KaamKhaata AI सहायक हूँ। मैं आपकी कमाई, बकाया भुगतान, एडवांस और काम के इतिहास के बारे में सवालों के जवाब दे सकता हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?",
  te: "👋 నమస్కారం! నేను మీ KaamKhaata AI సహాయకుడిని. మీ అసలు రికార్డుల నుండి మీ సంపాదన, పెండింగ్ చెల్లింపులు, అడ్వాన్స్ మరియు పని చరిత్ర గురించి ప్రశ్నలకు సమాధానం ఇవ్వగలను. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?"
};

export default function AIAssistant() {
  const { lang } = useLang();
  const t = (p) => getTranslation(lang, p);
  const [messages, setMessages] = useState([{ role: 'ai', text: WELCOME_MSGS[lang] || WELCOME_MSGS.en, ts: Date.now() }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recording, setRecording] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    getAISuggestions(lang).then(r => setSuggestions(r.data.suggestions || [])).catch(() => {});
    setMessages([{ role: 'ai', text: WELCOME_MSGS[lang] || WELCOME_MSGS.en, ts: Date.now() }]);
  }, [lang]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (question) => {
    const q = question || input.trim();
    if (!q) return;
    setInput('');
    setMessages(msgs => [...msgs, { role: 'user', text: q, ts: Date.now() }]);
    setLoading(true);
    try {
      const r = await aiQuery(q, lang);
      setMessages(msgs => [...msgs, { role: 'ai', text: r.data.answer, ts: Date.now() }]);
    } catch (err) {
      setMessages(msgs => [...msgs, { role: 'ai', text: 'Sorry, I encountered an error. Please try again.', ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = LANG_CODES[lang] || 'en-IN';
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };
    rec.onend = () => setRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  };

  const stopVoice = () => { recognitionRef.current?.stop(); setRecording(false); };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '16px', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#3d35ca)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#0d9488,#2dd4bf)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={26} color="white" />
          </div>
          <div>
            <h2 style={{ color: 'white', fontWeight: 800, fontSize: '18px' }}>{t('ai.title')}</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{t('ai.subtitle')}</p>
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <p style={{ padding: '12px 20px 4px', fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('ai.suggestions')}</p>
          <div className="suggestion-chips">
            {suggestions.slice(0, 6).map((s, i) => (
              <button key={i} className="chip" onClick={() => sendMessage(s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="card">
        <div className="chat-container">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <div className={`chat-avatar ${msg.role}`}>
                {msg.role === 'ai' ? <Bot size={18} color="white" /> : <User size={18} color="#94a3b8" />}
              </div>
              <div className="chat-bubble">{msg.text}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-message ai">
              <div className="chat-avatar ai"><Bot size={18} color="white" /></div>
              <div className="chat-bubble" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{t('ai.thinking')}</span>
                <span style={{ display: 'flex', gap: '3px' }}>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <span key={i} style={{ width: 6, height: 6, background: '#94a3b8', borderRadius: '50%', animation: `pulse 1s ${d}s infinite` }} />
                  ))}
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
          <button
            className={`btn ${recording ? 'btn-danger' : 'btn-secondary'} btn-sm`}
            onClick={recording ? stopVoice : startVoice}
            title="Voice input"
          >
            {recording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <input
            className="form-input"
            placeholder={t('ai.placeholder')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={loading}
          />
          <button
            className="btn btn-primary"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
