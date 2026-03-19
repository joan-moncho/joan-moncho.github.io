// supabase/functions/send-booking-email/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge Function que envía un email de confirmación al cliente cuando reserva.
// Usa Resend (resend.com) — plan gratuito: 3.000 emails/mes.
//
// SETUP:
// 1. Crea cuenta en resend.com y obtén una API Key
// 2. En Supabase → Settings → Edge Functions → Secrets, añade:
//    RESEND_API_KEY = re_XXXXXXXXXXXXXXXX
// 3. Despliega con: supabase functions deploy send-booking-email
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL     = 'Punto Zero <joanmonvi@gmail.com>' // ← tu email verificado en Resend

serve(async (req) => {
  // CORS for GitHub Pages
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      }
    })
  }

  try {
    const { to, name, service, stylist, date, time, price } = await req.json()

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>
  body { font-family: 'Georgia', serif; background: #f5f5f0; margin: 0; padding: 40px 20px; }
  .card { background: #fff; max-width: 520px; margin: 0 auto; padding: 48px; border: 1px solid #e8e8e3; }
  .logo { font-size: 22px; font-weight: bold; letter-spacing: 0.08em; margin-bottom: 40px; }
  .logo span { font-style: italic; font-weight: 400; }
  h1 { font-size: 28px; margin-bottom: 8px; }
  .sub { color: #888; font-size: 15px; margin-bottom: 40px; font-family: sans-serif; }
  .detail { display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #f0f0eb; font-family: sans-serif; font-size: 14px; }
  .detail:last-child { border-bottom: none; }
  .detail-label { color: #888; }
  .detail-value { font-weight: 600; }
  .total { display: flex; justify-content: space-between; padding: 20px 0 0; font-family: sans-serif; }
  .total-label { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
  .total-price { font-size: 28px; font-weight: bold; }
  .footer { margin-top: 40px; font-size: 12px; color: #aaa; font-family: sans-serif; line-height: 1.6; }
</style></head>
<body>
<div class="card">
  <div class="logo">Punto <span>Zero</span></div>
  <h1>¡Tu cita está confirmada!</h1>
  <p class="sub">Hola ${name}, aquí tienes los detalles de tu reserva.</p>
  <div class="detail"><span class="detail-label">Servicio</span><span class="detail-value">${service}</span></div>
  <div class="detail"><span class="detail-label">Estilista</span><span class="detail-value">${stylist}</span></div>
  <div class="detail"><span class="detail-label">Fecha</span><span class="detail-value">${date}</span></div>
  <div class="detail"><span class="detail-label">Hora</span><span class="detail-value">${time}</span></div>
  <div class="total">
    <span class="total-label">Total</span>
    <span class="total-price">${price}€</span>
  </div>
  <div class="footer">
    <p>Si necesitas cancelar, puedes hacerlo desde tu cuenta con al menos 24 horas de antelación.</p>
    <p style="margin-top:8px;">Punto Zero · Madrid</p>
  </div>
</div>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to:   [to],
        subject: `✓ Cita confirmada — ${service} el ${date} a las ${time}`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(JSON.stringify({ error: err }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
