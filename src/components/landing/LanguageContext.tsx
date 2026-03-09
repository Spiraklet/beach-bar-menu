'use client';

import { createContext, useContext, useState, ReactNode } from "react";

type Language = "el" | "en";

const translations = {
  // Nav
  features: { el: "Χαρακτηριστικά", en: "Features" },
  about: { el: "Σχετικά", en: "About" },
  login: { el: "Σύνδεση", en: "Login" },

  // Hero
  heroTagline: { el: "Ψηφιακή Εμπειρία Beach Bar", en: "Digital Beach Bar Experience" },
  heroTitle1: { el: "Το μενού σου,", en: "Your menu," },
  heroTitle2: { el: "ξανά από την αρχή.", en: "reimagined." },
  heroDescription: {
    el: "Πανέμορφα ψηφιακά μενού, QR codes για κάθε τραπέζι και διαχείριση παραγγελιών σε πραγματικό χρόνο — όλα από ένα μέρος.",
    en: "Beautiful digital menus, QR codes for every table, and real-time order management — all from one place.",
  },
  getStarted: { el: "Ξεκίνα Τώρα", en: "Get Started" },
  learnMore: { el: "Μάθε Περισσότερα", en: "Learn More" },

  // Features
  whatWeOffer: { el: "Τι προσφέρουμε", en: "What we offer" },
  featuresTitle1: { el: "Όλα όσα χρειάζεται", en: "Everything your beach bar" },
  featuresTitle2: { el: "το beach bar σου.", en: "needs to thrive." },

  featureSubtitle1: { el: "Όμορφα & Δυναμικά", en: "Beautiful & Dynamic" },
  featureTitle1: { el: "Ψηφιακά Μενού", en: "Digital Menus" },
  featureDesc1: {
    el: "Δημιούργησε και διαχειρίσου το μενού σου με κατηγορίες, προσαρμογές και ενημερώσεις σε πραγματικό χρόνο. Οι αλλαγές γίνονται ζωντανές αμέσως — χωρίς επανεκτύπωση.",
    en: "Create and manage your menu with categories, customizations, and real-time updates. Changes go live instantly — no reprinting needed.",
  },

  featureSubtitle2: { el: "Σκάναρε & Παράγγειλε", en: "Scan & Order" },
  featureTitle2: { el: "QR Codes", en: "QR Codes" },
  featureDesc2: {
    el: "Δημιούργησε μοναδικά QR codes για κάθε τραπέζι. Οι πελάτες σκανάρουν για να δουν το μενού και να παραγγείλουν απευθείας από το κινητό τους.",
    en: "Generate unique QR codes for each table. Customers scan to view the menu and place orders directly from their phone.",
  },

  featureSubtitle3: { el: "Πίνακας Ελέγχου", en: "Real-time Dashboard" },
  featureTitle3: { el: "Διαχείριση Παραγγελιών", en: "Order Management" },
  featureDesc3: {
    el: "Παρακολούθησε κάθε παραγγελία με πίνακα ελέγχου σε πραγματικό χρόνο. Ενημερώσεις κατάστασης, ειδοποιήσεις και αναλυτικά — όλα σε μία διεπαφή.",
    en: "Track every order with a real-time dashboard. Status updates, notifications, and analytics — all in one powerful interface.",
  },

  // About
  whyFerteto: { el: "Γιατί Ferteto", en: "Why Ferteto" },
  aboutTitle1: { el: "Φτιαγμένο για την", en: "Built for the" },
  aboutTitle2: { el: "παραθαλάσσια εμπειρία.", en: "seaside experience." },
  aboutDescription: {
    el: "Το Ferteto μεταμορφώνει τον τρόπο λειτουργίας των beach bars. Από τη δημιουργία εντυπωσιακών ψηφιακών μενού μέχρι την επεξεργασία παραγγελιών σε πραγματικό χρόνο, σε βοηθάμε να προσφέρεις μια αψεγάδιαστη εμπειρία.",
    en: "Ferteto transforms how beach bars operate. From crafting gorgeous digital menus to processing orders in real-time, we help you deliver a seamless experience that keeps customers coming back.",
  },

  highlight1: { el: "Άμεση δημιουργία ψηφιακού μενού", en: "Instant digital menu creation" },
  highlight2: { el: "QR code για κάθε τραπέζι", en: "QR code for every table" },
  highlight3: { el: "Παρακολούθηση παραγγελιών σε πραγματικό χρόνο", en: "Real-time order tracking" },
  highlight4: { el: "Υποστήριξη πολλών γλωσσών", en: "Multi-language support" },
  highlight5: { el: "Αναλυτικά & αναφορές", en: "Analytics & reporting" },
  highlight6: { el: "Λειτουργεί σε κάθε συσκευή", en: "Works on any device" },

  theExperience: { el: "Η εμπειρία", en: "The experience" },
  scanTitle1: { el: "Από το σκανάρισμα", en: "From scan" },
  scanTitle2: { el: "στο ποτό.", en: "to sip." },
  scanDescription: {
    el: "Οι πελάτες σου απλά σκανάρουν ένα QR code στο τραπέζι τους, περιηγούνται στο όμορφα σχεδιασμένο μενού σου και κάνουν την παραγγελία τους — χωρίς αναμονή, χωρίς σύγχυση.",
    en: "Your customers simply scan a QR code at their table, browse your beautifully designed menu, and place their order — no waiting, no confusion. Your staff sees orders appear in real-time, ready to prepare and serve.",
  },
  startFree: { el: "Ξεκίνα Δωρεάν", en: "Start Free" },

  // CTA
  ctaTitle1: { el: "Έτοιμος να γίνεις", en: "Ready to go" },
  ctaTitle2: { el: "ψηφιακός;", en: "digital?" },
  ctaDescription: {
    el: "Γίνε μέλος των beach bars σε όλη την ακτή που χρησιμοποιούν ήδη το Ferteto για να ενθουσιάσουν τους πελάτες τους.",
    en: "Join beach bars across the coast that are already using Ferteto to delight their customers and streamline operations.",
  },
  getStartedNow: { el: "Ξεκίνα Τώρα", en: "Get Started Now" },
  adminLogin: { el: "Είσοδος Διαχειριστή", en: "Admin Login" },

  // Footer
  footerTagline: { el: "Ψηφιακά μενού για beach bars", en: "Digital menus for beach bars" },
  footerLinksTitle: { el: "Σύνδεσμοι", en: "Links" },
  footerContactTitle: { el: "Επικοινωνία", en: "Contact" },
  footerPrivacy: { el: "Πολιτική Απορρήτου", en: "Privacy Policy" },
  footerTerms: { el: "Όροι Χρήσης", en: "Terms of Service" },
  clientLogin: { el: "Είσοδος Πελάτη", en: "Client Login" },

  // Lead Dialog
  dialogTitle: { el: "Ξεκίνα Τώρα", en: "Get Started" },
  dialogDescription: { el: "Άφησε τα στοιχεία σου και θα επικοινωνήσουμε μαζί σου.", en: "Leave your details and we'll get you set up." },
  dialogThankYou: { el: "Ευχαριστούμε!", en: "Thank you!" },
  dialogReceived: { el: "Λάβαμε τα στοιχεία σου και θα επικοινωνήσουμε σύντομα.", en: "We've received your details and will reach out shortly." },
  dialogName: { el: "Το όνομά σου *", en: "Your name *" },
  dialogEmail: { el: "Email *", en: "Email address *" },
  dialogBusiness: { el: "Όνομα επιχείρησης", en: "Beach bar / business name" },
  dialogPhone: { el: "Τηλέφωνο", en: "Phone number" },
  dialogSubmit: { el: "Υποβολή", en: "Submit" },
  dialogClose: { el: "Κλείσιμο", en: "Close" },
  dialogSuccess: { el: "Ευχαριστούμε! Θα επικοινωνήσουμε σύντομα.", en: "Thank you! We'll be in touch soon." },
  dialogContactAt: { el: "Θα επικοινωνήσουμε στο", en: "We'll contact you at" },
} as const;

type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("el");

  const t = (key: TranslationKey): string => {
    return translations[key]?.[language] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
