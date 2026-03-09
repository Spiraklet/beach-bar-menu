'use client';

import { useLanguage } from "./LanguageContext";

const LanguageSwitch = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "el" ? "en" : "el")}
      className="flex items-center gap-1.5 px-1 py-1 text-xs font-body tracking-[0.15em] uppercase text-primary-foreground/70 hover:text-primary-foreground transition-all"
      aria-label="Switch language"
    >
      <span className={language === "el" ? "text-primary-foreground" : "text-primary-foreground/40"}>ΕΛ</span>
      <span className="text-primary-foreground/30">|</span>
      <span className={language === "en" ? "text-primary-foreground" : "text-primary-foreground/40"}>EN</span>
    </button>
  );
};

export default LanguageSwitch;
