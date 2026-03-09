'use client';

import { motion } from "framer-motion";
import CocktailIllustration from "./illustrations/CocktailIllustration";
import QRPhoneIllustration from "./illustrations/QRPhoneIllustration";
import DashboardIllustration from "./illustrations/DashboardIllustration";
import GreekKeyBorder from "./GreekKeyBorder";
import { useLanguage } from "./LanguageContext";

const FeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      Illustration: CocktailIllustration,
      title: t("featureTitle1"),
      subtitle: t("featureSubtitle1"),
      description: t("featureDesc1"),
    },
    {
      Illustration: QRPhoneIllustration,
      title: t("featureTitle2"),
      subtitle: t("featureSubtitle2"),
      description: t("featureDesc2"),
    },
    {
      Illustration: DashboardIllustration,
      title: t("featureTitle3"),
      subtitle: t("featureSubtitle3"),
      description: t("featureDesc3"),
    },
  ];

  return (
    <section id="features" className="py-32 md:py-44 bg-background">
      <div className="container max-w-6xl">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-24 md:mb-32"
        >
          <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-6">
            {t("whatWeOffer")}
          </p>
          <GreekKeyBorder className="max-w-xs mx-auto mb-6 opacity-40" />
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-foreground leading-tight tracking-wide">
            {t("featuresTitle1")}
            <br />
            <span className="italic">{t("featuresTitle2")}</span>
          </h2>
          <GreekKeyBorder className="max-w-xs mx-auto mt-6 opacity-40" />
        </motion.div>

        <div className="space-y-32 md:space-y-44">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className={`grid md:grid-cols-2 gap-16 md:gap-24 items-center ${
                index % 2 === 1 ? "md:direction-rtl" : ""
              }`}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={`flex justify-center ${index % 2 === 1 ? "md:order-2" : ""}`}
              >
                <feature.Illustration className="w-full max-w-[240px] md:max-w-[280px] h-auto" />
              </motion.div>
              <div className={index % 2 === 1 ? "md:order-1" : ""}>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="font-body text-xs tracking-[0.3em] uppercase text-primary mb-3"
                >
                  {feature.subtitle}
                </motion.p>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="font-display text-4xl md:text-5xl font-light text-foreground mb-6 tracking-wide"
                >
                  {feature.title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="font-body text-muted-foreground leading-relaxed text-lg"
                >
                  {feature.description}
                </motion.p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
