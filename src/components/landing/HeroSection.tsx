'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import LeadCaptureDialog from "./LeadCaptureDialog";
import LanguageSwitch from "./LanguageSwitch";
import { useLanguage } from "./LanguageContext";

const HeroSection = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/images/hero-beach.jpg"
          alt="Seaside beach bar with ocean view at sunset"
          className="w-full h-full object-cover"
          fetchPriority="high"
          sizes="100vw"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 hero-overlay" />
      </div>

      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-12 py-8">
        <motion.span
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="font-display text-3xl md:text-4xl font-light tracking-[0.15em] text-primary-foreground"
        >
          ferteto
        </motion.span>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4 md:gap-8"
        >
          <a href="#features" className="hidden md:inline text-xs font-body tracking-[0.25em] uppercase text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            {t("features")}
          </a>
          <a href="#about" className="hidden md:inline text-xs font-body tracking-[0.25em] uppercase text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            {t("about")}
          </a>
          <LanguageSwitch />
          <Link
            href="/login"
            className="px-6 py-2.5 text-xs font-body tracking-[0.25em] uppercase border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 transition-all"
          >
            {t("login")}
          </Link>
        </motion.div>
      </nav>

      <div className="relative z-10 text-center px-6 max-w-4xl">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-body text-xs md:text-sm tracking-[0.4em] uppercase text-primary-foreground/60 mb-8"
        >
          {t("heroTagline")}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-display text-4xl md:text-6xl lg:text-7xl font-light text-primary-foreground leading-[0.9] mb-10 tracking-wide"
        >
          {t("heroTitle1")}
          <br />
          <span className="italic">{t("heroTitle2")}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="font-body text-base md:text-lg text-primary-foreground/70 max-w-xl mx-auto mb-12 leading-relaxed"
        >
          {t("heroDescription")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => setDialogOpen(true)}
            className="px-10 py-4 bg-primary text-primary-foreground font-body text-xs tracking-[0.3em] uppercase hover:opacity-90 transition-opacity"
          >
            {t("getStarted")}
          </button>
          <a
            href="#features"
            className="px-10 py-4 border border-primary-foreground/25 text-primary-foreground font-body text-xs tracking-[0.3em] uppercase hover:bg-primary-foreground/10 transition-all"
          >
            {t("learnMore")}
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-5 h-9 border border-primary-foreground/30 rounded-full flex items-start justify-center pt-2"
        >
          <div className="w-0.5 h-2 bg-primary-foreground/50 rounded-full" />
        </motion.div>
      </motion.div>

      <LeadCaptureDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
};

export default HeroSection;
