import { useState } from 'react';

const FACEBOOK_PAGE_ID = 'mitradgroup';

const features = [
  'MentorX — scores et rapport hebdomadaire',
  'Dashboard de performance',
  'Objectifs et plan de trading',
  'Import MT4, MT5, cTrader, Tradovate',
  'Export XLSX / CSV',
  'Rapport détaillé et historique des trades',
  'Analyses quotidiennes',
  'Suivi des performances en temps réel',
];

const plans = [
  {
    id: 'mensuel',
    name: 'Mensuel',
    price: 25000,
    priceLabel: '25 000 Ar',
    period: '/ mois',
    oldPrice: null,
    saving: null,
    featured: false,
  },
  {
    id: '6mois',
    name: '6 mois',
    price: 125000,
    priceLabel: '125 000 Ar',
    period: '',
    oldPrice: '150 000 Ar',
    saving: '-17%',
    featured: true,
  },
  {
    id: 'annuel',
    name: 'Annuel',
    price: 275000,
    priceLabel: '275 000 Ar',
    period: '/ an',
    oldPrice: '300 000 Ar',
    saving: '-8%',
    featured: false,
  },
];

export default function Pricing() {
  const params = new URLSearchParams(window.location.search);
  const isInactive = params.get('inactive') === '1';
  const isRenew = params.get('renew') === '1';
  const ctaLabel = isRenew ? 'Renouveler' : 'Souscrire';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [payment, setPayment] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [error, setError] = useState('');

  const openModal = (plan: typeof plans[0]) => {
    setSelectedPlan(plan);
    setName('');
    setEmail('');
    setPhone('');
    setPayment('');
    setError('');
  };

  const closeModal = () => setSelectedPlan(null);

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !payment) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (!selectedPlan) return;

    const message = encodeURIComponent(
      `Bonjour MITrad ! 👋\n\nJe souhaite ${isRenew ? 'renouveler' : 'souscrire à'} l'offre suivante :\n\n` +
      `📦 Offre : ${selectedPlan.name}\n` +
      `💰 Prix : ${selectedPlan.priceLabel}\n` +
      `💳 Paiement via : ${payment}\n` +
      `📱 Numéro : ${phone}\n\n` +
      `👤 Nom : ${name}\n` +
      `📧 Email : ${email}\n\n` +
      `Merci de confirmer ma souscription.`
    );

    window.open(
      `https://www.facebook.com/messages/t/${FACEBOOK_PAGE_ID}?text=${message}`,
      '_blank'
    );

    closeModal();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B0F1A',
      color: '#fff',
      fontFamily: 'Inter, sans-serif',
      padding: '60px 20px',
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(26,107,255,0.15)',
          border: '1px solid rgba(26,107,255,0.3)',
          borderRadius: 99,
          padding: '6px 18px',
          fontSize: 12,
          color: '#6FA3FF',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 16,
        }}>
          Nos offres
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.2 }}>
          Choisissez votre offre
        </h1>
        <p style={{ fontSize: 15, color: '#8899AA', maxWidth: 480, margin: '0 auto' }}>
          Accès complet à toutes les fonctionnalités MITrad Journal, quelle que soit la formule choisie.
        </p>
      </div>

      {isInactive && (
        <div style={{
          maxWidth: 600,
          margin: '0 auto 32px',
          padding: '16px 20px',
          borderRadius: 14,
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>⏳</span>
          <div>
            <p style={{ fontWeight: 700, color: '#f59e0b', marginBottom: 4, fontSize: 14 }}>
              Compte en attente d'activation
            </p>
            <p style={{ color: '#8899AA', fontSize: 13, lineHeight: 1.5 }}>
              Votre compte a bien été créé. L'administrateur va l'activer après réception de votre paiement.
              En attendant, consultez nos offres ci-dessous et contactez-nous via Messenger.
            </p>
          </div>
        </div>
      )}

      {/* Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 20,
        maxWidth: 960,
        margin: '0 auto 40px',
      }}>
        {plans.map(plan => (
          <div
            key={plan.id}
            style={{
              background: plan.featured ? 'rgba(26,107,255,0.08)' : 'rgba(255,255,255,0.03)',
              border: plan.featured ? '2px solid rgba(26,107,255,0.6)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              position: 'relative',
              transition: 'transform 0.2s, border-color 0.2s',
            }}
          >
            {plan.featured && (
              <div style={{
                position: 'absolute',
                top: -13,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#1A6BFF',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 14px',
                borderRadius: 99,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                Recommandé
              </div>
            )}

            {/* Plan name */}
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{plan.name}</div>

            {/* Price */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{plan.priceLabel}</span>
                {plan.period && (
                  <span style={{ fontSize: 13, color: '#8899AA' }}>{plan.period}</span>
                )}
              </div>
              {plan.oldPrice && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 13, color: '#556070', textDecoration: 'line-through' }}>
                    {plan.oldPrice}
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'rgba(34,197,94,0.15)',
                    color: '#4ADE80',
                    padding: '2px 10px',
                    borderRadius: 99,
                  }}>
                    {plan.saving}
                  </span>
                </div>
              )}
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* Features */}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {features.map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#AABCCC' }}>
                  <span style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'rgba(34,197,94,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 1,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => openModal(plan)}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                background: plan.featured ? '#1A6BFF' : 'rgba(255,255,255,0.08)',
                color: '#fff',
                transition: 'opacity 0.15s',
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseOut={e => (e.currentTarget.style.opacity = '1')}
            >
              {ctaLabel}
            </button>
          </div>
        ))}
      </div>

      {/* Payment note */}
      <p style={{ textAlign: 'center', fontSize: 12, color: '#556070' }}>
        Paiement accepté via MVola · Orange Money · Airtel Money
      </p>

      {/* Modal */}
      {selectedPlan && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 20,
          }}
        >
          <div style={{
            background: '#131825',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: '32px 28px',
            width: '100%',
            maxWidth: 420,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: '#fff' }}>
              {ctaLabel} — {selectedPlan.name}
            </h3>
            <p style={{ fontSize: 13, color: '#8899AA', marginBottom: 24 }}>
              {selectedPlan.priceLabel}{selectedPlan.period}
            </p>

            <label style={labelStyle}>Votre nom complet</label>
            <input
              type="text"
              placeholder="Prénom et nom"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>Votre email</label>
            <input
              type="email"
              placeholder="email@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>Moyen de paiement</label>
            <select
              value={payment}
              onChange={e => setPayment(e.target.value)}
              style={inputStyle}
            >
              <option value="">Choisir...</option>
              <option>MVola</option>
              <option>Orange Money</option>
              <option>Airtel Money</option>
            </select>

            <label style={labelStyle}>Numéro de téléphone</label>
            <input
              type="tel"
              placeholder="034 XX XXX XX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ ...inputStyle, marginBottom: error ? 8 : 24 }}
            />

            {error && (
              <p style={{ fontSize: 12, color: '#F87171', marginBottom: 16 }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={closeModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'transparent',
                  color: '#8899AA',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#1A6BFF',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Envoyer via Messenger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#8899AA',
  marginBottom: 6,
  fontWeight: 600,
  letterSpacing: '0.04em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '11px 14px',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  marginBottom: 16,
  display: 'block',
  boxSizing: 'border-box',
};
