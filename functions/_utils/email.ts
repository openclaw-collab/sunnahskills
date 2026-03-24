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
}

export async function sendMailChannelsEmail(env: MailEnv, args: SendEmailArgs): Promise<boolean> {
  const toList = Array.isArray(args.to) ? args.to : [args.to];
  if (!toList.length) return false;
  if (!args.from?.email) return false;
  try {
    const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: toList.map((t) => ({ email: t.email, name: t.name })) }],
        from: { email: args.from.email, name: args.from.name },
        reply_to: args.replyTo ? { email: args.replyTo.email, name: args.replyTo.name } : undefined,
        subject: args.subject,
        content: [
          { type: "text/plain", value: args.text },
          { type: "text/html", value: args.html },
        ],
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      console.error("MailChannels send failed", {
        status: res.status,
        subject: args.subject,
        to: toList.map((entry) => entry.email),
        body: errorBody.slice(0, 500),
      });
    }

    return res.ok;
  } catch (error) {
    console.error("MailChannels request failed", {
      subject: args.subject,
      to: toList.map((entry) => entry.email),
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
