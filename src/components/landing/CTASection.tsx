'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import GreekKeyBorder from "./GreekKeyBorder";
import LeadCaptureDialog from "./LeadCaptureDialog";
import { useLanguage } from "./LanguageContext";

const CTASection = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <section className="relative py-32 md:py-44 bg-background overflow-hidden">
      <div className="container max-w-4xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <GreekKeyBorder className="max-w-xs mx-auto mb-8 opacity-40" />
          <h2 className="font-display text-5xl md:text-7xl font-light text-foreground leading-tight mb-8 tracking-wide">
            {t("ctaTitle1")}
            <br />
            <span className="italic">{t("ctaTitle2")}</span>
          </h2>
          <p className="font-body text-lg text-muted-foreground mb-12 leading-relaxed max-w-xl mx-auto">
            {t("ctaDescription")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <button
              onClick={() => setDialogOpen(true)}
              className="px-10 py-4 bg-primary text-primary-foreground font-body text-xs tracking-[0.3em] uppercase hover:opacity-90 transition-opacity"
            >
              {t("getStartedNow")}
            </button>
            <Link
              href="/login"
              className="px-10 py-4 border border-foreground/20 text-foreground font-body text-xs tracking-[0.3em] uppercase hover:bg-foreground/5 transition-all text-center"
            >
              {t("adminLogin")}
            </Link>
          </div>
          <GreekKeyBorder className="max-w-xs mx-auto opacity-40" />
        </motion.div>
      </div>

      <LeadCaptureDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
};

export default CTASection;
