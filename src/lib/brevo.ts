// â”€â”€â”€ Brevo (Sendinblue) Transactional Email Service â”€â”€â”€
// Server-side only. Do NOT import in client components.

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

const SENDER = { name: "Momento", email: "noreply@momento.life" };

interface BrevoResponse {
  messageId: string;
  [key: string]: unknown;
}

async function sendEmail(params: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  replyTo?: { email: string; name?: string };
}): Promise<{ success: true; messageId: string } | { success: false; error: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { success: false, error: "BREVO_API_KEY not configured" };
  }

  try {
    const res = await fetch(BREVO_API, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: SENDER,
        to: params.to,
        subject: params.subject,
        htmlContent: params.htmlContent,
        ...(params.replyTo ? { replyTo: params.replyTo } : {}),
      }),
    });

    const data: BrevoResponse = await res.json();

    if (!res.ok) {
      return { success: false, error: `Brevo API error (${res.status}): ${JSON.stringify(data)}` };
    }

    return { success: true, messageId: data.messageId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// â”€â”€â”€ HTML Templates â”€â”€â”€

function baseLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#05070B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#05070B;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:560px;">
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:#FF0F73;">Momento</span>
            </td>
          </tr>
          <tr>
            <td style="background-color:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6B7280;">
                Live The Moment &mdash; Momento
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#6B7280;">
                This is an automated message from Momento. Please do not reply directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function bookingConfirmedHtml(params: {
  guestName: string;
  experienceTitle: string;
  experienceDate: string;
  experienceTime: string;
  guests: number;
  totalPrice: number;
  currency: string;
  bookingId: string;
  location: string;
  partnerName: string;
}): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#ffffff;font-weight:600;">Booking Confirmed! ðŸŽ‰</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#94A3B8;">Hey ${params.guestName}, get ready for an unforgettable experience.</p>

    <div style="background-color:#1A2332;border-radius:12px;padding:20px;margin-bottom:24px;">
      <h2 style="margin:0 0 4px;font-size:16px;color:#ffffff;font-weight:600;">${params.experienceTitle}</h2>
      <p style="margin:0 0 12px;font-size:13px;color:#6B7280;">${params.location} &middot; ${params.partnerName}</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;border-top:1px solid rgba(255,255,255,0.06);">
            <span style="font-size:12px;color:#6B7280;">Date</span><br/>
            <span style="font-size:14px;color:#ffffff;">${params.experienceDate}</span>
          </td>
          <td style="padding:8px 0;border-top:1px solid rgba(255,255,255,0.06);text-align:right;">
            <span style="font-size:12px;color:#6B7280;">Time</span><br/>
            <span style="font-size:14px;color:#ffffff;">${params.experienceTime}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-top:1px solid rgba(255,255,255,0.06);">
            <span style="font-size:12px;color:#6B7280;">Guests</span><br/>
            <span style="font-size:14px;color:#ffffff;">${params.guests}</span>
          </td>
          <td style="padding:8px 0;border-top:1px solid rgba(255,255,255,0.06);text-align:right;">
            <span style="font-size:12px;color:#6B7280;">Total</span><br/>
            <span style="font-size:14px;color:#ffffff;">${params.currency} ${params.totalPrice.toLocaleString()}</span>
          </td>
        </tr>
      </table>
    </div>

    <div style="background-color:#1A2332;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Booking Reference</p>
      <p style="margin:0;font-size:16px;color:#FF0F73;font-weight:600;font-family:monospace;">${params.bookingId}</p>
    </div>

    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://momento.life"}/bookings" style="display:block;text-align:center;background:linear-gradient(135deg,#FF0F73,#F82D7B);color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;margin-bottom:24px;">
      View My Booking
    </a>

    <p style="margin:0;font-size:12px;color:#6B7280;text-align:center;">
      Need to make changes? Visit your <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://momento.life"}/bookings" style="color:#FF0F73;">bookings page</a>.
    </p>
  `;
  return baseLayout("Booking Confirmed - Momento", body);
}

function giftCardReceivedHtml(params: {
  recipientName: string;
  senderName: string;
  amount: number;
  currency: string;
  code: string;
  message?: string;
  occasion?: string;
}): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#ffffff;font-weight:600;">You've Received a Gift Card! ðŸŽ</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#94A3B8;">Hi ${params.recipientName}, ${params.senderName} has sent you an Momento gift card!</p>

    ${params.occasion ? `<p style="margin:0 0 16px;font-size:13px;color:#FF0F73;text-align:center;">ðŸŽ‰ ${params.occasion}</p>` : ""}

    <div style="background:linear-gradient(135deg,#FF0F73,#F82D7B);border-radius:12px;padding:24px;text-align:center;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;">Gift Card Value</p>
      <p style="margin:0;font-size:36px;color:#ffffff;font-weight:700;">${params.currency} ${params.amount.toLocaleString()}</p>
    </div>

    ${params.message ? `
    <div style="background-color:#1A2332;border-radius:12px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Message from ${params.senderName}</p>
      <p style="margin:0;font-size:14px;color:#E2E8F0;font-style:italic;">&ldquo;${params.message}&rdquo;</p>
    </div>
    ` : ""}

    <div style="background-color:#1A2332;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Your Gift Code</p>
      <p style="margin:0;font-size:18px;color:#FF0F73;font-weight:700;font-family:monospace;letter-spacing:2px;">${params.code}</p>
    </div>

    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://momento.life"}/gift/redeem?code=${params.code}" style="display:block;text-align:center;background:linear-gradient(135deg,#FF0F73,#F82D7B);color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;margin-bottom:16px;">
      Redeem Your Gift
    </a>

    <p style="margin:0;font-size:12px;color:#6B7280;text-align:center;">
      This gift card expires one year from the date of issue. <br/>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://momento.life"}/gift" style="color:#FF0F73;">Learn more about gift cards</a>
    </p>
  `;
  return baseLayout("Gift Card Received - Momento", body);
}

function bookingCancelledHtml(params: {
  guestName: string;
  experienceTitle: string;
  bookingId: string;
  refundStatus: string;
}): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#ffffff;font-weight:600;">Booking Cancelled</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#94A3B8;">Hi ${params.guestName}, your booking has been cancelled as requested.</p>

    <div style="background-color:#1A2332;border-radius:12px;padding:20px;margin-bottom:20px;">
      <h2 style="margin:0 0 4px;font-size:16px;color:#ffffff;font-weight:600;">${params.experienceTitle}</h2>
      <p style="margin:0 0 12px;font-size:13px;color:#6B7280;">Booking Ref: ${params.bookingId}</p>
      <p style="margin:0;font-size:13px;color:#94A3B8;">${params.refundStatus}</p>
    </div>

    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://momento.life"}/experiences" style="display:block;text-align:center;background:linear-gradient(135deg,#FF0F73,#F82D7B);color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;">
      Explore More Experiences
    </a>
  `;
  return baseLayout("Booking Cancelled - Momento", body);
}

// â”€â”€â”€ Public API â”€â”€â”€

export async function sendBookingConfirmation(params: {
  email: string;
  guestName: string;
  experienceTitle: string;
  experienceDate: string;
  experienceTime: string;
  guests: number;
  totalPrice: number;
  currency: string;
  bookingId: string;
  location: string;
  partnerName: string;
}) {
  return sendEmail({
    to: [{ email: params.email, name: params.guestName }],
    subject: `Booking Confirmed â€” ${params.experienceTitle} âœ¦ Momento`,
    htmlContent: bookingConfirmedHtml(params),
  });
}

export async function sendBookingCancellation(params: {
  email: string;
  guestName: string;
  experienceTitle: string;
  bookingId: string;
  refundStatus: string;
}) {
  return sendEmail({
    to: [{ email: params.email, name: params.guestName }],
    subject: `Booking Cancelled â€” ${params.experienceTitle} âœ¦ Momento`,
    htmlContent: bookingCancelledHtml(params),
  });
}

export async function sendGiftCardEmail(params: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  amount: number;
  currency: string;
  code: string;
  message?: string;
  occasion?: string;
}) {
  return sendEmail({
    to: [{ email: params.recipientEmail, name: params.recipientName }],
    subject: `You've Received a Momento Gift Card from ${params.senderName}! ðŸŽ`,
    htmlContent: giftCardReceivedHtml(params),
  });
}

export type SendEmailResult = Awaited<ReturnType<typeof sendEmail>>;
