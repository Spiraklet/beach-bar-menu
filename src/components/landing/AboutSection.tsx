'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import BeachSceneIllustration from "./illustrations/BeachSceneIllustration";
import GreekKeyBorder from "./GreekKeyBorder";
import LeadCaptureDialog from "./LeadCaptureDialog";
import { useLanguage } from "./LanguageContext";

const AboutSection = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { t } = useLanguage();

  const highlights = [
    t("highlight1"),
    t("highlight2"),
    t("highlight3"),
    t("highlight4"),
    t("highlight5"),
    t("highlight6"),
  ];

  return (
    <section id="about" className="section-dark py-32 md:py-44">
      <div className="container max-w-6xl">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center mb-24 md:mb-32">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="font-body text-xs tracking-[0.4em] uppercase text-section-dark-foreground/50 mb-6">
              {t("whyFerteto")}
            </p>
            <GreekKeyBorder className="max-w-[200px] mb-5 opacity-30" color="hsl(var(--section-dark-foreground))" />
            <h2 className="font-display text-5xl md:text-6xl font-light text-section-dark-foreground leading-tight mb-8 tracking-wide">
              {t("aboutTitle1")}
              <br />
              <span className="italic">{t("aboutTitle2")}</span>
            </h2>
            <p className="font-body text-section-dark-foreground/70 leading-relaxed mb-10 text-lg">
              {t("aboutDescription")}
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-3 font-body text-sm text-section-dark-foreground/80">
                  <span className="w-1 h-1 rounded-full bg-section-dark-foreground/40 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex items-center justify-center"
          >
            <BeachSceneIllustration className="w-full h-auto scale-110" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto"
        >
          <p className="font-body text-xs tracking-[0.4em] uppercase text-section-dark-foreground/50 mb-6">
            {t("theExperience")}
          </p>
          <GreekKeyBorder className="max-w-xs mx-auto mb-5 opacity-30" color="hsl(var(--section-dark-foreground))" />
          <h2 className="font-display text-5xl md:text-6xl font-light text-section-dark-foreground leading-tight mb-8 tracking-wide">
            {t("scanTitle1")}<br /><span className="italic">{t("scanTitle2")}</span>
          </h2>
          <p className="font-body text-section-dark-foreground/70 leading-relaxed text-lg mb-12">
            {t("scanDescription")}
          </p>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-block px-10 py-4 border border-section-dark-foreground/25 text-section-dark-foreground font-body text-xs tracking-[0.3em] uppercase hover:bg-section-dark-foreground/10 transition-all"
          >
            {t("startFree")}
          </button>
        </motion.div>
      </div>

      <LeadCaptureDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
};

export default AboutSection;
