"use client";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { createClient } from "@/utils/supabase/client";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const MONTANTS = [
  { amount: 2,   color: "#4B9AC9", label: "2€"   },
  { amount: 5,   color: "#4BC94B", label: "5€"   },
  { amount: 10,  color: "#C9A24B", label: "10€"  },
  { amount: 20,  color: "#E0492F", label: "20€"  },
  { amount: 50,  color: "#C94BC9", label: "50€"  },
  { amount: 100, color: "#FFD700", label: "100€" },
];
type Montant = (typeof MONTANTS)[0];

// ── Card form (must live inside <Elements>) ────────────────────────────────────

function CardForm({
  clientSecret,
  selected,
  message,
  onSuccess,
  onBack,
}: {
  clientSecret: string;
  selected: Montant;
  message: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setErr("");

    const card = elements.getElement(CardElement);
    if (!card) { setLoading(false); return; }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });

    if (error) {
      setErr(error.message ?? "Paiement refusé");
      setLoading(false);
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess();
    }
  };

  return (
    <>
      {/* Preview */}
      <div style={{ padding:"12px 14px", borderRadius:"10px", marginBottom:"16px", background:`${selected.color}18`, border:`1px solid ${selected.color}44` }}>
        <div style={{ fontSize:"10px", color:selected.color, fontWeight:700, marginBottom:"4px" }}>⭐ SUPER CHAT · {selected.label}</div>
        <div style={{ fontSize:"13px", color:"#ccc", fontStyle: message ? "normal" : "italic" }}>
          {message || "Votre message apparaîtra ici…"}
        </div>
      </div>

      {/* Stripe CardElement */}
      <div style={{ padding:"13px 14px", background:"#111", border:`1px solid ${selected.color}44`, borderRadius:"10px", marginBottom:"4px" }}>
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                color:      "#E7E9EA",
                fontSize:   "15px",
                fontFamily: "Inter, system-ui, sans-serif",
                iconColor:  selected.color,
                "::placeholder": { color: "#555" },
              },
              invalid: { color: "#E0492F", iconColor: "#E0492F" },
            },
          }}
        />
      </div>
      <div style={{ fontSize:"10px", color:"#333", marginBottom:"16px", textAlign:"right" }}>🔒 Paiement sécurisé par Stripe</div>

      {err && (
        <div style={{ color:"#E0492F", fontSize:"12px", marginBottom:"12px", textAlign:"center" }}>{err}</div>
      )}

      <button
        onClick={pay}
        disabled={!stripe || loading}
        style={{ width:"100%", padding:"14px", borderRadius:"12px", background: loading ? "#333" : selected.color, border:"none", color:"#fff", fontSize:"15px", fontWeight:800, cursor: loading ? "not-allowed" : "pointer", boxShadow:`0 4px 20px ${selected.color}55`, transition:"background 0.15s" }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
      >
        {loading ? "Traitement…" : `Payer ${selected.label} ⭐`}
      </button>

      <button onClick={onBack} style={{ width:"100%", padding:"10px", background:"none", border:"none", color:"#444", fontSize:"13px", cursor:"pointer", marginTop:"8px" }}>
        ← Retour
      </button>
    </>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────

export default function SuperChatModal({
  roomId,
  onSuccess,
  onClose,
}: {
  roomId:    string;
  onSuccess: (amount: number, message: string) => void;
  onClose:   () => void;
}) {
  const [step,          setStep]         = useState<"select" | "pay" | "done">("select");
  const [selected,      setSelected]     = useState(MONTANTS[1]);
  const [message,       setMessage]      = useState("");
  const [clientSecret,  setClientSecret] = useState("");
  const [fetching,      setFetching]     = useState(false);
  const [fetchErr,      setFetchErr]     = useState("");

  const proceed = async () => {
    setFetching(true);
    setFetchErr("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const res  = await fetch("/api/stripe/create-payment-intent", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          amount:  selected.amount,
          roomId,
          message,
          userId: user?.id ?? "",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur serveur");
      setClientSecret(json.clientSecret);
      setStep("pay");
    } catch (e: unknown) {
      setFetchErr(e instanceof Error ? e.message : "Erreur interne");
    } finally {
      setFetching(false);
    }
  };

  const handleSuccess = () => {
    onSuccess(selected.amount, message);
    setStep("done");
  };

  const STEP_LABEL: Record<typeof step, string> = {
    select: "Mettez votre message en avant",
    pay:    "Entrez vos coordonnées bancaires",
    done:   "Paiement confirmé !",
  };

  return (
    <>
      <style>{`@keyframes slideUp { from { transform:translateY(100%); opacity:0; } to { transform:none; opacity:1; } }`}</style>
      <div
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"0 0 80px" }}
        onClick={step === "select" ? onClose : undefined}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ width:"100%", maxWidth:"480px", background:"#0a0a0a", border:"1px solid #222", borderTop:`2px solid ${selected.color}`, borderRadius:"20px 20px 0 0", padding:"24px 20px", animation:"slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:"20px" }}>
            <div style={{ fontSize:"22px", marginBottom:"4px" }}>⭐</div>
            <div style={{ color:"#fff", fontSize:"15px", fontWeight:800, marginBottom:"4px" }}>Super Chat</div>
            <div style={{ fontSize:"12px", color:"#555" }}>{STEP_LABEL[step]}</div>
          </div>

          {/* ── STEP 1 : choose amount ── */}
          {step === "select" && (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px", marginBottom:"16px" }}>
                {MONTANTS.map(m => (
                  <button
                    key={m.amount}
                    onClick={() => setSelected(m)}
                    style={{ padding:"12px 8px", borderRadius:"10px", border:`1.5px solid ${selected.amount===m.amount ? m.color : "#222"}`, background: selected.amount===m.amount ? m.color : "#111", color: selected.amount===m.amount ? "#fff" : "#555", fontSize:"15px", fontWeight:700, cursor:"pointer", transition:"all 0.18s", boxShadow: selected.amount===m.amount ? `0 0 14px ${m.color}55` : "none" }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <input
                value={message}
                onChange={e => setMessage(e.target.value.slice(0, 150))}
                placeholder="Votre message (optionnel)…"
                style={{ width:"100%", padding:"12px 16px", borderRadius:"10px", background:"#111", border:`1px solid ${selected.color}44`, color:"#fff", fontSize:"13px", outline:"none", boxSizing:"border-box", marginBottom:"4px", fontFamily:"inherit", transition:"border-color 0.15s" }}
                onFocus={e => (e.currentTarget.style.borderColor = selected.color + "99")}
                onBlur={e  => (e.currentTarget.style.borderColor = selected.color + "44")}
              />
              <div style={{ textAlign:"right", fontSize:"10px", color:"#333", marginBottom:"12px" }}>{message.length}/150</div>

              <div style={{ padding:"12px 14px", borderRadius:"10px", marginBottom:"16px", background:`${selected.color}15`, border:`1px solid ${selected.color}44` }}>
                <div style={{ fontSize:"10px", color:selected.color, fontWeight:700, marginBottom:"4px" }}>⭐ SUPER CHAT · {selected.label}</div>
                <div style={{ fontSize:"13px", color:"#ccc", fontStyle: message ? "normal" : "italic" }}>
                  {message || "Votre message apparaîtra ici…"}
                </div>
              </div>

              {fetchErr && (
                <div style={{ color:"#E0492F", fontSize:"12px", marginBottom:"12px", textAlign:"center" }}>{fetchErr}</div>
              )}

              <button
                onClick={proceed}
                disabled={fetching}
                style={{ width:"100%", padding:"14px", borderRadius:"12px", background: fetching ? "#333" : selected.color, border:"none", color:"#fff", fontSize:"15px", fontWeight:800, cursor: fetching ? "not-allowed" : "pointer", boxShadow:`0 4px 20px ${selected.color}55`, transition:"background 0.15s" }}
              >
                {fetching ? "Préparation…" : `Continuer · ${selected.label} ⭐`}
              </button>

              <button onClick={onClose} style={{ width:"100%", padding:"10px", background:"none", border:"none", color:"#444", fontSize:"13px", cursor:"pointer", marginTop:"8px" }}>
                Annuler
              </button>
            </>
          )}

          {/* ── STEP 2 : card form ── */}
          {step === "pay" && clientSecret && (
            <Elements stripe={stripePromise}>
              <CardForm
                clientSecret={clientSecret}
                selected={selected}
                message={message}
                onSuccess={handleSuccess}
                onBack={() => setStep("select")}
              />
            </Elements>
          )}

          {/* ── STEP 3 : success ── */}
          {step === "done" && (
            <div style={{ textAlign:"center", padding:"8px 0 16px" }}>
              <div style={{ fontSize:"48px", marginBottom:"12px" }}>🎉</div>
              <div style={{ color:selected.color, fontSize:"18px", fontWeight:800, marginBottom:"8px" }}>Super Chat envoyé !</div>
              <div style={{ color:"#555", fontSize:"13px", marginBottom:"24px" }}>
                Votre message de {selected.label} est maintenant visible dans le chat.
              </div>
              <button
                onClick={onClose}
                style={{ padding:"12px 32px", borderRadius:"12px", background:selected.color, border:"none", color:"#fff", fontSize:"15px", fontWeight:800, cursor:"pointer" }}
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
