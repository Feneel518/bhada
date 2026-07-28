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
    from: process.env.EMAIL_FROM ?? `"Bhada" <${process.env.SMTP_USER}>`,
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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}
