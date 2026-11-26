import nodemailer from "nodemailer";

type EmailKind = "verification" | "password-reset";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("Email delivery is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.");
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export async function sendAuthEmail({
  to,
  name,
  url,
  kind,
}: {
  to: string;
  name: string;
  url: string;
  kind: EmailKind;
}) {
  const verification = kind === "verification";
  const subject = verification ? "Verify your Bhada email" : "Reset your Bhada password";
  const eyebrow = verification ? "Confirm your email" : "Password reset";
  const heading = verification ? "One click and you’re in." : "Let’s get you back in.";
  const copy = verification
    ? "Verify your email address to activate your secure Bhada workspace."
    : "We received a request to reset your password. This secure link expires in one hour.";
  const action = verification ? "Verify email" : "Reset password";
  await getTransport().sendMail({
    from: fromAddress(),
    to,
    subject,
    text: `${heading}\n\n${copy}\n\n${url}\n\nIf you did not request this, you can safely ignore this email.`,
    html: `
      <div style="background:#f5f6fa;padding:40px 16px;font-family:Arial,sans-serif;color:#252a38">
        <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e7e8ee;border-radius:20px;overflow:hidden">
          <div style="padding:28px 32px;background:#282853;color:#fff;font-size:22px;font-weight:800">bhada</div>
          <div style="padding:36px 32px">
            <div style="color:#5b5bd6;text-transform:uppercase;letter-spacing:.14em;font-size:11px;font-weight:800">${eyebrow}</div>
            <h1 style="font-size:28px;letter-spacing:-.03em;margin:12px 0 14px">${heading}</h1>
            <p style="font-size:15px;line-height:1.7;color:#6f7585;margin:0">Hi ${escapeHtml(name || "there")}, ${copy}</p>
            <a href="${url}" style="display:inline-block;margin-top:28px;background:#5656ce;color:#fff;text-decoration:none;padding:14px 22px;border-radius:11px;font-size:14px;font-weight:800">${action}</a>
            <p style="font-size:12px;line-height:1.6;color:#999eaa;margin:28px 0 0">If you did not request this, you can safely ignore this email.</p>
          </div>
        </div>
      </div>`,
  });
}

function fromAddress() {
  const configuredFrom = process.env.EMAIL_FROM;
  return configuredFrom && !configuredFrom.includes("example.com")
    ? configuredFrom
    : `"Bhadaa" <${process.env.SMTP_USER}>`;
}

export type SummaryLine = { tenant: string; place: string; amount: string; status: string; remindUrl: string };

export async function sendDailySummaryEmail({
  to,
  name,
  subject,
  intro,
  lines,
  dashboardUrl,
  settingsUrl,
}: {
  to: string;
  name: string;
  subject: string;
  intro: string;
  lines: SummaryLine[];
  dashboardUrl: string;
  settingsUrl: string;
}) {
  const rows = lines.map((line) => `
          <tr>
            <td style="padding:12px 0;border-top:1px solid #ececea">
              <div style="font-size:14px;font-weight:700;color:#1d1d1b">${escapeHtml(line.tenant)}</div>
              <div style="font-size:12px;color:#7b7b74;margin-top:2px">${escapeHtml(line.place)} · ${escapeHtml(line.status)}</div>
            </td>
            <td style="padding:12px 0;border-top:1px solid #ececea;text-align:right;white-space:nowrap">
              <div style="font-size:14px;font-weight:700;color:#1d1d1b">${escapeHtml(line.amount)}</div>
              <a href="${escapeHtml(line.remindUrl)}" style="font-size:12px;color:#8a6d1f;font-weight:700;text-decoration:none">Remind on WhatsApp →</a>
            </td>
          </tr>`).join("");

  await getTransport().sendMail({
    from: fromAddress(),
    to,
    subject,
    text: `${intro}\n\n${lines.map((line) => `• ${line.tenant} (${line.place}): ${line.amount}, ${line.status}`).join("\n")}\n\nOpen Bhadaa: ${dashboardUrl}\n\nTurn these emails off: ${settingsUrl}`,
    html: `
      <div style="background:#f3f2ee;padding:32px 14px;font-family:Arial,sans-serif;color:#1d1d1b">
        <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e4e3de;border-radius:16px;overflow:hidden">
          <div style="padding:22px 28px;background:#111;color:#e4c77a;font-size:20px;font-weight:800">Bhadaa</div>
          <div style="padding:28px">
            <p style="font-size:15px;line-height:1.6;margin:0 0 18px">Hi ${escapeHtml(name || "there")}, ${escapeHtml(intro)}</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
            <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;margin-top:22px;background:#e4c77a;color:#111;text-decoration:none;padding:13px 20px;border-radius:10px;font-size:14px;font-weight:800">Open Bhadaa</a>
            <p style="font-size:11px;line-height:1.6;color:#9a9a93;margin:26px 0 0">You get this on days rent falls due and on Mondays while rent is overdue. <a href="${escapeHtml(settingsUrl)}" style="color:#9a9a93">Turn it off in Settings → Documents</a>.</p>
          </div>
        </div>
      </div>`,
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}
