import { vi } from "vitest";

/**
 * Mock Cloudflare MailChannels for testing email functionality.
 */

// ============================================================================
// Types
// ============================================================================

export interface EmailMessage {
  to: string | { email: string; name?: string }[];
  from: { email: string; name?: string };
  subject: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
}

export interface SentEmail extends EmailMessage {
  id: string;
  sentAt: Date;
}

// ============================================================================
// MailChannels Mock Implementation
// ============================================================================

export class MockMailChannels {
  private sentEmails: SentEmail[] = [];
  private shouldFail = false;
  private failureMessage = "Failed to send email";

  /**
   * Send an email via MailChannels
   */
  async send(message: EmailMessage): Promise<{ success: boolean; id?: string }> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sentEmail: SentEmail = {
      ...message,
      id,
      sentAt: new Date(),
    };

    this.sentEmails.push(sentEmail);

    return { success: true, id };
  }

  /**
   * Send a template email
   */
  async sendTemplate(
    to: string,
    templateId: string,
    data: Record<string, unknown>
  ): Promise<{ success: boolean; id?: string }> {
    return this.send({
      to,
      from: { email: "noreply@example.com", name: "Test App" },
      subject: `Template: ${templateId}`,
      text: JSON.stringify(data),
    });
  }

  /**
   * Get all sent emails (for assertions)
   */
  getSentEmails(): SentEmail[] {
    return [...this.sentEmails];
  }

  /**
   * Get emails sent to a specific address
   */
  getEmailsTo(address: string): SentEmail[] {
    return this.sentEmails.filter((email) => {
      if (Array.isArray(email.to)) {
        return email.to.some((recipient: string | { email: string }) =>
          typeof recipient === "string"
            ? recipient === address
            : recipient.email === address
        );
      }
      return email.to === address;
    });
  }

  /**
   * Check if an email was sent with specific content
   */
  wasEmailSent(
    options: Partial<{
      to: string;
      subject: string;
      containsText: string;
    }>
  ): boolean {
    return this.sentEmails.some((email) => {
      let matches = true;

      if (options.to) {
        const toMatch = Array.isArray(email.to)
          ? email.to.some((recipient: string | { email: string }) =>
              typeof recipient === "string" ? recipient === options.to : recipient.email === options.to
            )
          : email.to === options.to;
        matches = matches && toMatch;
      }

      if (options.subject) {
        matches = matches && email.subject.includes(options.subject);
      }

      if (options.containsText) {
        const content = `${email.text || ""} ${email.html || ""}`;
        matches = matches && content.includes(options.containsText);
      }

      return matches;
    });
  }

  /**
   * Clear all sent emails
   */
  clear(): void {
    this.sentEmails = [];
  }

  /**
   * Configure mock to fail on next send
   */
  setShouldFail(message = "Failed to send email"): void {
    this.shouldFail = true;
    this.failureMessage = message;
  }

  /**
   * Reset failure state
   */
  resetFailure(): void {
    this.shouldFail = false;
    this.failureMessage = "Failed to send email";
  }
}

// ============================================================================
// Mock Factory
// ============================================================================

export function createMockMailChannels(): MockMailChannels {
  return new MockMailChannels();
}

/**
 * Creates a mock fetch response for MailChannels API
 */
export function mockMailChannelsSuccess(
  responseData: Record<string, unknown> = { success: true }
): Response {
  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function mockMailChannelsError(
  message = "Bad Request",
  status = 400
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ============================================================================
// Vitest Mock Setup
// ============================================================================

export const mockSendEmail = vi.fn();

export function setupMailChannelsMock() {
  vi.mock("@cloudflare/mailchannels", () => ({
    send: mockSendEmail,
  }));
}

export function resetMailChannelsMocks() {
  mockSendEmail.mockClear();
  mockSendEmail.mockResolvedValue({ success: true });
}
