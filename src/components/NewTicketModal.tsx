import React, { useState } from 'react';
import { X, Sparkles, Send, ShieldAlert, Languages } from 'lucide-react';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    original_message: string;
    selected_language?: string;
  }) => Promise<void>;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState('Elena Rostova');
  const [customerEmail, setCustomerEmail] = useState('elena.r@example.com');
  const [customerPhone, setCustomerPhone] = useState('+1-555-4421');
  const [selectedLanguage, setSelectedLanguage] = useState('Auto');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const samplePrompts = [
    {
      label: '🇬🇧 English — Delayed Tracking',
      lang: 'English',
      name: 'Jessica Vance',
      email: 'jvance@example.com',
      text: "Hello! My order #MUM-33890 was supposed to arrive yesterday. The carrier tracking has not updated in 4 days. Can someone look into where the parcel is?",
    },
    {
      label: '🇮🇳 Hindi (Devanagari) — Damaged Item',
      lang: 'Hindi',
      name: 'Vikram Mehta',
      email: 'vikram.m@example.in',
      text: "नमस्ते, मैंने 4 दिन पहले खिलौने का सेट ऑर्डर किया था (ऑर्डर #MUM-77210)। आज बॉक्स खोला तो प्लास्टिक के हिस्से टूटे हुए थे। कृपया इसे तुरंत बदलकर नया पीस भेजें।",
    },
    {
      label: '🇮🇳 Hinglish — Payment Deducted',
      lang: 'Hindi',
      name: 'Rohan Verma',
      email: 'rohan.v@example.com',
      text: "Mera account se ₹2,400 debit ho gaya order #MUM-88912 ke liye par website par payment failed dikha raha hai. Please confirm karein kya order confirm hua?",
    },
    {
      label: '🇸🇦 Arabic — Delivery Inquire & Delay',
      lang: 'Arabic',
      name: 'نورة السبيعي',
      email: 'noura.s@example.sa',
      text: "مرحباً، طلبت شحنة رقم #MUM-55102 ولم تصل حتى الآن إلى الدمام وتأخرت عن الموعد المحدد بيومين. هل يمكن تتبع الشحنة وإفادتي بموعد التسليم؟",
    },
    {
      label: '🚨 English — Security & Fraud Escalation',
      lang: 'English',
      name: 'David Sterling',
      email: 'd.sterling@example.org',
      text: "URGENT FRAUD ALERT: An unauthorized charge of $560 was made on my credit card for order #MUM-99128 without my permission! Freeze this order dispatch immediately or I will file an unauthorized chargeback and contact consumer fraud authorities!",
    },
  ];

  const handleSelectSample = (sample: typeof samplePrompts[0]) => {
    setCustomerName(sample.name);
    setCustomerEmail(sample.email);
    setSelectedLanguage(sample.lang);
    setMessage(sample.text);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please provide a customer message to analyze.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        customer_name: customerName,
        customer_email: customerEmail || undefined,
        customer_phone: customerPhone || undefined,
        original_message: message.trim(),
        selected_language: selectedLanguage === 'Auto' ? undefined : selectedLanguage,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isArabicMessage = /[\u0600-\u06FF]/.test(message);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">New Customer Support Ticket</h2>
              <p className="text-xs text-slate-500">Auto-triaged by MumzAssist.A Multilingual AI Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Quick Test Prompt Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Quick Test Scenarios (1-Click Test):</span>
              <span className="text-[11px] text-indigo-600 font-medium">Click to populate</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/80 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Reference</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Language Hint</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="Auto">Auto-Detect</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="Arabic">Arabic (العربية)</option>
              </select>
            </div>
          </div>

          {/* Original Message */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Customer Message (Supports English, Hindi, and Arabic) *
              </label>
              {isArabicMessage && (
                <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Arabic Text Detected (RTL View)
                </span>
              )}
            </div>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter customer message in English, Hindi (Devanagari/Hinglish), or Arabic..."
              className={`w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 leading-relaxed ${
                isArabicMessage ? 'font-arabic text-right' : ''
              }`}
              dir={isArabicMessage ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Stored persistently in PostgreSQL.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Analyzing & Saving...' : 'Submit & Triage'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
