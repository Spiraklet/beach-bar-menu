'use client';

import Link from "next/link";
import { useLanguage } from "./LanguageContext";
import GreekKeyBorder from "./GreekKeyBorder";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="py-16 md:py-20 bg-background border-t border-border">
      <div className="container max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-12">
          {/* Brand */}
          <div>
            <span className="font-display text-2xl font-light tracking-[0.15em] text-foreground block mb-4">
              ferteto
            </span>
            <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("footerTagline")}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-body text-xs tracking-[0.25em] uppercase text-foreground mb-4">
              {t("footerLinksTitle")}
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("features")}
                </a>
              </li>
              <li>
                <a href="#about" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("about")}
                </a>
              </li>
              <li>
                <Link href="/login" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("clientLogin")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 className="font-body text-xs tracking-[0.25em] uppercase text-foreground mb-4">
              {t("footerContactTitle")}
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:hello@ferteto.com" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
                  hello@ferteto.com
                </a>
              </li>
              <li>
                <a href="#" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("footerPrivacy")}
                </a>
              </li>
              <li>
                <a href="#" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("footerTerms")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <GreekKeyBorder className="max-w-xs mx-auto mb-8 opacity-30" />

        <p className="font-body text-xs tracking-[0.15em] text-muted-foreground uppercase text-center">
          © {new Date().getFullYear()} Ferteto · {t("footerTagline")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
