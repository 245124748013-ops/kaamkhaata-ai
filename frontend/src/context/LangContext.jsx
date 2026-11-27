import React, { createContext, useContext, useState } from 'react';

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('kk_lang') || 'en');

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('kk_lang', newLang);
  };

  return (
    <LangContext.Provider value={{ lang, changeLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
