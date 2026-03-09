'use client';

import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./Dialog";
import { toast } from "sonner";
import GreekKeyBorder from "./GreekKeyBorder";
import { useLanguage } from "./LanguageContext";

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email").max(255, "Email must be less than 255 characters"),
  businessName: z.string().trim().max(150, "Business name must be less than 150 characters").optional(),
  phone: z.string().trim().max(30, "Phone number is too long").optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LeadCaptureDialog = ({ open, onOpenChange }: LeadCaptureDialogProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    businessName: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof LeadFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = leadSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LeadFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LeadFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        throw new Error('Failed to submit');
      }

      setSubmitted(true);
      toast.success(t("dialogSuccess"));
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setSubmitted(false);
      setFormData({ name: "", email: "", businessName: "", phone: "" });
      setErrors({});
    }
    onOpenChange(val);
  };

  const inputClass =
    "w-full bg-transparent border border-border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md p-0 overflow-hidden">
        <div className="p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-display text-3xl font-light text-foreground tracking-wide text-center">
              {submitted ? t("dialogThankYou") : t("dialogTitle")}
            </DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground text-center mt-2">
              {submitted ? t("dialogReceived") : t("dialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <GreekKeyBorder className="max-w-[120px] mx-auto mb-6 opacity-30" />

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder={t("dialogName")}
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={inputClass}
                  maxLength={100}
                />
                {errors.name && (
                  <p className="font-body text-xs text-destructive mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <input
                  type="email"
                  placeholder={t("dialogEmail")}
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={inputClass}
                  maxLength={255}
                />
                {errors.email && (
                  <p className="font-body text-xs text-destructive mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder={t("dialogBusiness")}
                  value={formData.businessName}
                  onChange={(e) => handleChange("businessName", e.target.value)}
                  className={inputClass}
                  maxLength={150}
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder={t("dialogPhone")}
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={inputClass}
                  maxLength={30}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-10 py-4 bg-primary text-primary-foreground font-body text-xs tracking-[0.3em] uppercase hover:opacity-90 transition-opacity mt-2 disabled:opacity-50"
              >
                {submitting ? '...' : t("dialogSubmit")}
              </button>
            </form>
          ) : (
            <div className="text-center py-6">
              <p className="font-body text-muted-foreground text-sm">
                {t("dialogContactAt")} <span className="text-foreground">{formData.email}</span>
              </p>
              <button
                onClick={() => handleClose(false)}
                className="mt-6 px-8 py-3 border border-border text-foreground font-body text-xs tracking-[0.3em] uppercase hover:bg-foreground/5 transition-all"
              >
                {t("dialogClose")}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadCaptureDialog;
