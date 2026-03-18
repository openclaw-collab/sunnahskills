const BRAND = {
  cream: "#F2F0E9",
  charcoal: "#1A1A1A",
  moss: "#2E4036",
  clay: "#CC5833",
};

function wrapHtml(title: string, body: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:${BRAND.cream};color:${BRAND.charcoal};font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:680px;margin:0 auto;padding:28px 18px;">
      <div style="border:1px solid rgba(46,64,54,0.15);border-radius:28px;overflow:hidden;background:#ffffff;">
        <div style="padding:22px 22px 14px 22px;background:${BRAND.charcoal};color:${BRAND.cream};">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(242,240,233,0.75);">
            Sunnah Skills
          </div>
          <div style="font-size:22px;font-weight:700;margin-top:8px;">${escapeHtml(title)}</div>
        </div>
        <div style="padding:22px;">
          ${body}
        </div>
        <div style="padding:14px 22px 22px 22px;color:rgba(26,26,26,0.65);font-size:12px;line-height:1.5;">
          <div style="border-top:1px solid rgba(26,26,26,0.08);padding-top:14px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${BRAND.clay};vertical-align:middle;margin-right:8px;"></span>
            Calm, disciplined training. Built for families.
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#039;";
      default:
        return c;
    }
  });
}

export function registrationConfirmationEmail(params: {
  guardianName: string;
  studentName: string;
  programName: string;
  registrationId: number;
  siteUrl?: string;
}) {
  const title = "Registration received";
  const text = `Sunnah Skills — Registration received

Guardian: ${params.guardianName}
Student: ${params.studentName}
Program: ${params.programName}
Registration ID: ${params.registrationId}

Next step: complete payment in the registration flow.`;

  const ctaUrl = params.siteUrl ? `${params.siteUrl}/registration/pending` : undefined;
  const html = wrapHtml(
    title,
    `
      <p style="margin:0 0 12px 0;line-height:1.6;">
        Assalamu alaykum ${escapeHtml(params.guardianName)} — we’ve received your registration for
        <strong>${escapeHtml(params.studentName)}</strong>.
      </p>
      <div style="border:1px solid rgba(46,64,54,0.12);border-radius:18px;background:${BRAND.cream};padding:14px 16px;margin:14px 0;">
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.moss};">Summary</div>
        <div style="margin-top:8px;line-height:1.7;">
          <div><strong>Program:</strong> ${escapeHtml(params.programName)}</div>
          <div><strong>Registration ID:</strong> #${params.registrationId}</div>
        </div>
      </div>
      <p style="margin:0 0 16px 0;line-height:1.6;color:rgba(26,26,26,0.8);">
        Next step: complete your payment to finalize enrollment. If your session is full, we’ll place you on the waitlist and notify you.
      </p>
      ${
        ctaUrl
          ? `<a href="${ctaUrl}" style="display:inline-block;background:${BRAND.clay};color:${BRAND.cream};text-decoration:none;padding:12px 16px;border-radius:999px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">View status</a>`
          : ""
      }
    `,
  );

  return { subject: "Sunnah Skills — Registration received", text, html };
}

export function waitlistConfirmationEmail(params: {
  name: string;
  programName: string;
  siteUrl?: string;
}) {
  const title = "You’re on the waitlist";
  const text = `Sunnah Skills — Waitlist confirmation

Name: ${params.name}
Program: ${params.programName}

We’ll email you when a spot opens.`;

  const html = wrapHtml(
    title,
    `
      <p style="margin:0 0 12px 0;line-height:1.6;">
        Assalamu alaykum ${escapeHtml(params.name)} — you’ve been added to the waitlist for
        <strong>${escapeHtml(params.programName)}</strong>.
      </p>
      <p style="margin:0 0 16px 0;line-height:1.6;color:rgba(26,26,26,0.8);">
        We’ll email you as soon as a spot opens up.
      </p>
    `,
  );

  return { subject: "Sunnah Skills — Waitlist confirmation", text, html };
}

export function paymentReceiptEmail(params: {
  guardianName: string;
  studentName: string;
  programName: string;
  amountCents: number;
  currency: string;
  receiptUrl?: string | null;
  siteUrl?: string;
}) {
  const title = "Payment received";
  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: (params.currency || "usd").toUpperCase(),
    maximumFractionDigits: 0,
  }).format(params.amountCents / 100);

  const text = `Sunnah Skills — Payment received

Guardian: ${params.guardianName}
Student: ${params.studentName}
Program: ${params.programName}
Amount: ${money}
Receipt: ${params.receiptUrl ?? "—"}`;

  const html = wrapHtml(
    title,
    `
      <p style="margin:0 0 12px 0;line-height:1.6;">
        Assalamu alaykum ${escapeHtml(params.guardianName)} — we received your payment.
      </p>
      <div style="border:1px solid rgba(46,64,54,0.12);border-radius:18px;background:${BRAND.cream};padding:14px 16px;margin:14px 0;">
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.moss};">Receipt</div>
        <div style="margin-top:8px;line-height:1.7;">
          <div><strong>Student:</strong> ${escapeHtml(params.studentName)}</div>
          <div><strong>Program:</strong> ${escapeHtml(params.programName)}</div>
          <div><strong>Amount:</strong> ${escapeHtml(money)}</div>
        </div>
      </div>
      ${
        params.receiptUrl
          ? `<a href="${params.receiptUrl}" style="display:inline-block;border:1px solid rgba(46,64,54,0.25);color:${BRAND.moss};text-decoration:none;padding:11px 14px;border-radius:999px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">View Stripe receipt</a>`
          : ""
      }
    `,
  );

  return { subject: "Sunnah Skills — Payment received", text, html };
}

export function adminNewRegistrationEmail(params: {
  guardianName: string;
  guardianEmail: string;
  studentName: string;
  programName: string;
  registrationId: number;
  siteUrl?: string;
}) {
  const title = "New registration";
  const dashUrl = params.siteUrl ? `${params.siteUrl}/admin/dashboard` : undefined;
  const text = `New Sunnah Skills registration

Program: ${params.programName}
Student: ${params.studentName}
Guardian: ${params.guardianName} (${params.guardianEmail})
Registration ID: ${params.registrationId}
`;

  const html = wrapHtml(
    title,
    `
      <p style="margin:0 0 12px 0;line-height:1.6;">
        New registration received.
      </p>
      <div style="border:1px solid rgba(26,26,26,0.08);border-radius:18px;padding:14px 16px;background:#fff;">
        <div><strong>Program:</strong> ${escapeHtml(params.programName)}</div>
        <div><strong>Student:</strong> ${escapeHtml(params.studentName)}</div>
        <div><strong>Guardian:</strong> ${escapeHtml(params.guardianName)} (${escapeHtml(params.guardianEmail)})</div>
        <div><strong>Registration ID:</strong> #${params.registrationId}</div>
      </div>
      ${
        dashUrl
          ? `<div style="margin-top:16px;"><a href="${dashUrl}" style="display:inline-block;background:${BRAND.clay};color:${BRAND.cream};text-decoration:none;padding:12px 16px;border-radius:999px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">Open dashboard</a></div>`
          : ""
      }
    `,
  );

  return { subject: "Sunnah Skills — New registration", text, html };
}

export function adminPaymentReceivedEmail(params: {
  guardianName: string;
  guardianEmail: string;
  studentName: string;
  programName: string;
  amountCents: number;
  currency: string;
  registrationId: number;
  receiptUrl?: string | null;
  siteUrl?: string;
}) {
  const title = "Payment received";
  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: (params.currency || "usd").toUpperCase(),
    maximumFractionDigits: 0,
  }).format(params.amountCents / 100);

  const dashUrl = params.siteUrl ? `${params.siteUrl}/admin/dashboard` : undefined;
  const text = `Payment received

Program: ${params.programName}
Student: ${params.studentName}
Guardian: ${params.guardianName} (${params.guardianEmail})
Registration ID: ${params.registrationId}
Amount: ${money}
Receipt: ${params.receiptUrl ?? "—"}`;

  const html = wrapHtml(
    title,
    `
      <p style="margin:0 0 12px 0;line-height:1.6;">
        A payment was confirmed via Stripe webhook.
      </p>
      <div style="border:1px solid rgba(26,26,26,0.08);border-radius:18px;padding:14px 16px;background:#fff;">
        <div><strong>Program:</strong> ${escapeHtml(params.programName)}</div>
        <div><strong>Student:</strong> ${escapeHtml(params.studentName)}</div>
        <div><strong>Guardian:</strong> ${escapeHtml(params.guardianName)} (${escapeHtml(params.guardianEmail)})</div>
        <div><strong>Registration ID:</strong> #${params.registrationId}</div>
        <div><strong>Amount:</strong> ${escapeHtml(money)}</div>
      </div>
      <div style="margin-top:16px;">
        ${
          params.receiptUrl
            ? `<a href="${params.receiptUrl}" style="display:inline-block;border:1px solid rgba(46,64,54,0.25);color:${BRAND.moss};text-decoration:none;padding:11px 14px;border-radius:999px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;margin-right:10px;">Stripe receipt</a>`
            : ""
        }
        ${
          dashUrl
            ? `<a href="${dashUrl}" style="display:inline-block;background:${BRAND.clay};color:${BRAND.cream};text-decoration:none;padding:12px 16px;border-radius:999px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">Dashboard</a>`
            : ""
        }
      </div>
    `,
  );

  return { subject: "Sunnah Skills — Payment received", text, html };
}

