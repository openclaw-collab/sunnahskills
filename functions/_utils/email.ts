type MailAddress = { email: string; name?: string };

export type SendEmailArgs = {
  to: MailAddress | MailAddress[];
  from: MailAddress;
  subject: string;
  text: string;
  html: string;
  replyTo?: MailAddress;
};

export interface MailEnv {
  EMAIL_FROM?: string;
  EMAIL_TO?: string;
  SITE_URL?: string;
  RESEND_API_KEY?: string;
  RESEND_API_URL?: string;
}

function formatAddress(address: MailAddress) {
  return address.name ? `${address.name} <${address.email}>` : address.email;
}

export async function sendMailChannelsEmail(env: MailEnv, args: SendEmailArgs): Promise<boolean> {
  const toList = Array.isArray(args.to) ? args.to : [args.to];
  if (!toList.length) return false;
  if (!args.from?.email) return false;
  try {
    const endpoint = env.RESEND_API_URL?.trim() || "https://api.resend.com/emails";
    const apiKey = env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      console.error("Resend not configured", {
        reason: "RESEND_API_KEY is missing",
        subject: args.subject,
        to: toList.map((entry) => entry.email),
      });
      return false;
    }

    const headers: Record<string, string> = {
      "content-type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: formatAddress(args.from),
        to: toList.map((entry) => formatAddress(entry)),
        reply_to: args.replyTo ? formatAddress(args.replyTo) : undefined,
        subject: args.subject,
        text: args.text,
        html: args.html,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      console.error("Resend send failed", {
        status: res.status,
        subject: args.subject,
        to: toList.map((entry) => entry.email),
        body: errorBody.slice(0, 500),
      });
    }

    return res.ok;
  } catch (error) {
    console.error("Resend request failed", {
      subject: args.subject,
      to: toList.map((entry) => entry.email),
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
