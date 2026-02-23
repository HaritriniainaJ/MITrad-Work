// ─────────────────────────────────────────────────────────────────────────────
// PAGE : Support
// Formulaire de contact : bug, amélioration, question.
// Stockage localStorage + bouton copier/mailto pour envoi manuel.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import GlassCard from '@/components/GlassCard';
import { Send, Copy, Check, MessageSquare, Bug, Lightbulb, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

type TicketType = 'bug' | 'amélioration' | 'question';

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  type: TicketType;
  message: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<TicketType, { label: string; icon: React.ElementType; color: string }> = {
  'bug':          { label: 'Bug',         icon: Bug,         color: 'text-destructive bg-destructive/10' },
  'amélioration': { label: 'Amélioration', icon: Lightbulb,  color: 'text-warning bg-warning/10' },
  'question':     { label: 'Question',    icon: HelpCircle,  color: 'text-primary bg-primary/10' },
};

export default function Support() {
  const { user } = useAuth();
  const storageKey = `mitrad_support_${user!.email}`;

  // Récupération des tickets existants
  const [tickets] = useState<SupportTicket[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); }
    catch { return []; }
  });

  // État du formulaire
  const [form, setForm] = useState({
    name:    user?.name || '',
    email:   user?.email || '',
    type:    'bug' as TicketType,
    message: '',
  });

  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /** Soumet le formulaire et sauvegarde en localStorage */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) { toast.error('Le message est requis'); return; }

    const ticket: SupportTicket = {
      id:        `support-${Date.now()}`,
      name:      form.name,
      email:     form.email,
      type:      form.type,
      message:   form.message.trim(),
      createdAt: new Date().toISOString(),
    };

    // Sauvegarde dans localStorage
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    localStorage.setItem(storageKey, JSON.stringify([ticket, ...existing]));

    setSubmitted(true);
    toast.success('Message enregistré !');
  };

  /** Copie le ticket formaté dans le presse-papier */
  const copyTicket = () => {
    const text = `
=== SUPPORT MITRAD ===
De : ${form.name} (${form.email})
Type : ${form.type}
Date : ${new Date().toLocaleString('fr')}

Message :
${form.message}
`.trim();

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Copié dans le presse-papier !');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /** Ouvre le client mail avec le ticket pré-rempli */
  const sendByMail = () => {
    const subject = encodeURIComponent(`[MITrad Support] ${form.type} — ${form.name}`);
    const body    = encodeURIComponent(`Type : ${form.type}\n\nMessage :\n${form.message}`);
    window.open(`mailto:support@mitrad.app?subject=${subject}&body=${body}`);
  };

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Support</h1>
        <p className="text-muted-foreground text-sm mt-1">Un bug ? Une idée ? Une question ? On est là.</p>
      </div>

      {submitted ? (
        /* Message de confirmation */
        <GlassCard className="animate-fade-up text-center py-12" glow="blue">
          <MessageSquare size={52} className="text-success mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Message envoyé !</h3>
          <p className="text-muted-foreground text-sm mb-6">Ton message a été enregistré. Tu peux aussi l'envoyer manuellement par email.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={copyTicket} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm hover:bg-accent transition-all">
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              Copier le ticket
            </button>
            <button onClick={sendByMail} className="flex items-center gap-2 gradient-btn px-5 py-2.5 text-sm">
              <Send size={14} /> Envoyer par email
            </button>
            <button onClick={() => setSubmitted(false)} className="text-sm text-primary hover:underline px-4 py-2.5">
              Nouveau message
            </button>
          </div>
        </GlassCard>
      ) : (
        /* Formulaire */
        <GlassCard className="animate-fade-up">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Nom et email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Ton nom</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-dark mt-1"
                  placeholder="Ex: Moussa"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ton email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input-dark mt-1"
                  placeholder="ton@email.com"
                  required
                />
              </div>
            </div>

            {/* Type de demande */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Type de demande</label>
              <div className="flex gap-3">
                {(Object.keys(TYPE_CONFIG) as TicketType[]).map(t => {
                  const cfg = TYPE_CONFIG[t];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, type: t }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                        form.type === t
                          ? `border-current ${cfg.color}`
                          : 'border-border/50 text-muted-foreground hover:bg-accent/30'
                      }`}
                    >
                      <Icon size={14} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-xs text-muted-foreground">Ton message</label>
              <textarea
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                className="input-dark mt-1 min-h-[140px] resize-none"
                placeholder={
                  form.type === 'bug'
                    ? "Décris le bug : que faisais-tu ? Qu'est-il arrivé ? Sur quel appareil ?"
                    : form.type === 'amélioration'
                    ? "Décris ton idée. Plus c'est précis, mieux c'est."
                    : "Pose ta question. On répond vite."
                }
                required
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button type="button" onClick={copyTicket}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                Copier
              </button>
              <button type="submit" className="flex-1 gradient-btn py-2.5 text-sm flex items-center justify-center gap-2">
                <Send size={14} /> Envoyer
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Historique des tickets */}
      {tickets.length > 0 && (
        <GlassCard className="animate-fade-up">
          <h3 className="text-sm font-bold text-foreground mb-4">Tes messages précédents ({tickets.length})</h3>
          <div className="space-y-3">
            {tickets.slice(0, 5).map(t => {
              const cfg = TYPE_CONFIG[t.type] || TYPE_CONFIG['question'];
              const Icon = cfg.icon;
              return (
                <div key={t.id} className="p-3 rounded-xl bg-accent/30 border border-border/30">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`p-1 rounded ${cfg.color}`}><Icon size={11} /></span>
                    <span className="text-xs font-medium text-foreground capitalize">{t.type}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(t.createdAt).toLocaleDateString('fr')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.message}</p>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
