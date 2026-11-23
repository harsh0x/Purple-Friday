/**
 * Transactional Email & Messaging Templates for Purple Friday
 * Plain text & HTML templates with escaped values (no raw unescaped HTML injection).
 */

export function escapeHtml(str: unknown): string {
  if (typeof str !== "string") return String(str ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface RenderedTemplate {
  subject: string;
  text: string;
  html: string;
}

export type NotificationEvent =
  | "welcome"
  | "order_placed"
  | "payment_received"
  | "proof_ready"
  | "proof_decision_confirmed"
  | "in_printing"
  | "shipped"
  | "delivered"
  | "cancelled_or_refunded"
  | "problem_report_update"
  | "security_alert_email_changed"
  | "security_alert_phone_changed"
  | "security_alert_password_changed"
  | "otp_verification"
  | "admin_customer_event"
  | "admin_alert";

function wrapEmailHtml(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F0D15; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F5F0E8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F0D15; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" style="max-width: 600px; background-color: #15101F; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.4);">
          <!-- Header Logo -->
          <tr>
            <td style="padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.08);">
              <span style="font-size: 18px; font-weight: 900; letter-spacing: -0.5px; color: #FFFFFF; text-transform: uppercase;">PURPLE FRIDAY</span>
              <span style="font-size: 11px; font-family: monospace; color: #6A2CFF; margin-left: 8px;">ATELIER</span>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding-top: 24px; font-size: 14px; line-height: 1.6; color: #D4CEE0;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; font-family: monospace; color: rgba(255,255,255,0.4); text-align: center;">
              &copy; ${new Date().getFullYear()} Purple Friday Atelier India. Strictly transactional.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderNotificationTemplate(
  event: NotificationEvent,
  data: Record<string, unknown>
): RenderedTemplate {
  switch (event) {
    case "welcome": {
      const name = escapeHtml(data.name || "Customer");
      const subject = "Welcome to Purple Friday Atelier";
      const text = `Welcome to Purple Friday, ${name}!\n\nYour account has been verified. You can now access your order portfolio, digital proofs, and custom apparel quotes.\n\nVisit: https://purplefriday.in/account`;
      const html = wrapEmailHtml(
        subject,
        `<h2 style="color: #FFFFFF; font-size: 20px; margin-top: 0;">Welcome, ${name}!</h2>
        <p>Your customer account has been successfully verified. You now have full access to your personalized client workspace, digital proof approvals, and order tracking.</p>
        <p style="margin: 24px 0;"><a href="https://purplefriday.in/account" style="background-color: #6A2CFF; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; display: inline-block;">Access Account Console</a></p>`
      );
      return { subject, text, html };
    }

    case "otp_verification": {
      const otp = escapeHtml(data.otp);
      const purpose = escapeHtml(data.purpose || "Verification");
      const subject = `Your Verification Code: ${otp}`;
      const text = `Your Purple Friday verification code for ${purpose} is: ${otp}\n\nValid for 5 minutes. Do not share this code with anyone.`;
      const html = wrapEmailHtml(
        subject,
        `<h2 style="color: #FFFFFF; font-size: 18px; margin-top: 0;">Verification Code</h2>
        <p>Use the 6-digit code below to complete your ${purpose}:</p>
        <div style="background-color: rgba(106, 44, 255, 0.15); border: 1px solid #6A2CFF; padding: 16px; border-radius: 12px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #CDB8FF;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: rgba(255,255,255,0.5);">This code is valid for 5 minutes and can be used once only. If you did not request this, please ignore.</p>`
      );
      return { subject, text, html };
    }

    case "order_placed": {
      const orderNumber = escapeHtml(data.orderNumber);
      const total = escapeHtml(data.totalFormatted || "₹" + Number(data.total || 0) / 100);
      const subject = `Order Confirmed: #${orderNumber}`;
      const text = `Thank you for your order #${orderNumber}.\nTotal: ${total}\nOur prepress atelier will review your custom designs shortly.\n\nView order: https://purplefriday.in/account/orders/${orderNumber}`;
      const html = wrapEmailHtml(
        subject,
        `<h2 style="color: #FFFFFF; font-size: 20px; margin-top: 0;">Order #${orderNumber} Confirmed</h2>
        <p>Thank you for placing your custom print order. Our prepress studio is reviewing your design specifications and preparing your high-definition digital proof.</p>
        <p style="font-family: monospace; font-size: 16px; color: #6A2CFF;">Total: <strong>${total}</strong></p>
        <p style="margin: 24px 0;"><a href="https://purplefriday.in/account/orders/${orderNumber}" style="background-color: #6A2CFF; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; display: inline-block;">View Order & Status</a></p>`
      );
      return { subject, text, html };
    }

    case "payment_received": {
      const orderNumber = escapeHtml(data.orderNumber);
      const amount = escapeHtml(data.amountFormatted || "₹" + Number(data.amount || 0) / 100);
      const subject = `Payment Received for Order #${orderNumber}`;
      const text = `We have received your payment of ${amount} for Order #${orderNumber}.\nStatus: Verified\n\nThank you!`;
      const html = wrapEmailHtml(
        subject,
        `<h2 style="color: #FFFFFF; font-size: 20px; margin-top: 0;">Payment Received</h2>
        <p>We have successfully verified your payment of <strong>${amount}</strong> for Order <strong>#${orderNumber}</strong>.</p>
        <p>Your order is progressing to the next stage in our production pipeline.</p>`
      );
      return { subject, text, html };
    }

    case "proof_ready": {
      const orderNumber = escapeHtml(data.orderNumber);
      const proofUrl = escapeHtml(data.proofUrl || `https://purplefriday.in/account/orders/${orderNumber}`);
      const subject = `Digital Proof Ready for Review: Order #${orderNumber}`;
      const text = `Your digital merchandise proof for Order #${orderNumber} is ready for approval.\nReview proof: ${proofUrl}`;
      const html = wrapEmailHtml(
        subject,
        `<h2 style="color: #FFFFFF; font-size: 20px; margin-top: 0;">Your Proof is Ready</h2>
        <p>Our prepress atelier has generated the production proof for Order <strong>#${orderNumber}</strong>. Please review print placement, sizing, and colors before we begin printing.</p>
        <p style="margin: 24px 0;"><a href="${proofUrl}" style="background-color: #6A2CFF; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; display: inline-block;">Review & Approve Proof</a></p>`
      );
      return { subject, text, html };
    }

    case "proof_decision_confirmed": {
      const orderNumber = escapeHtml(data.orderNumber);
      const decision = escapeHtml(data.decision);
      const subject = `Proof Decision Recorded: Order #${orderNumber}`;
      const text = `Your decision (${decision}) for Order #${orderNumber} has been logged in our prepress system.`;
      const html = wrapEmailHtml(
        subject,
        `<h2 style="color: #FFFFFF; font-size: 20px; margin-top: 0;">Proof Decision Logged</h2>
        <p>Your decision (<strong>${decision}</strong>) for Order <strong>#${orderNumber}</strong> has been confirmed. Our production queue has been updated accordingly.</p>`
      );
      return { subject, text, html };
    }

    case "in_printing": {
      const orderNumber = escapeHtml(data.orderNumber);
      const subject = `In Printing: Order #${orderNumber}`;
      const text = `Great news! Order #${orderNumber} is now on the print floor being produced with our high-density print systems.`;
      const html = wrapEmailHtml(
        subject,
        `<h2 style="color: #FFFFFF; font-size: 20px; margin-top: 0;">Order #${orderNumber} In Printing</h2>
        <p>Your custom merchandise is now in active production. Each piece is crafted, inspected, and prepped for dispatch.</p>`
      );
      return { subject, text, html };
    }

    case "shipped": {
      const orderNumber = escapeHtml(data.orderNumber);
      const courier = escapeHtml(data.courier || "Blue Dart / Delhivery");
      const trackingNumber = escapeHtml(data.trackingNumber || "");
      const trackingUrl = escapeHtml(data.trackingUrl || "https://purplefriday.in/track-order");
      const subject = `Shipped: Order #${orderNumber}`;
      const text = `Order #${orderNumber} has been dispatched via ${courier}.\nAWB Tracking Number: ${trackingNumber}\nTrack shipment: ${trackingUrl}`;
      const html = wrapEmailHtml(
        subject,
        `<h2 style="color: #FFFFFF; font-size: 20px; margin-top: 0;">Your Order Has Shipped</h2>
        <p>Order <strong>#${orderNumber}</strong> has been handed over to <strong>${courier}</strong>.</p>
        <div style="background-color: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; margin: 16px 0;">
          Tracking Number: <strong style="color: #6A2CFF;">${trackingNumber || "Assigned on transit"}</strong>
        </div>
        <p style="margin: 24px 0;"><a href="${trackingUrl}" style="background-color: #6A2CFF; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; display: inline-block;">Track Package</a></p>`
      );
      return { subject, text, html };
    }

    case "delivered": {
      const orderNumber = escapeHtml(data.orderNumber);
      const subject = `Delivered: Order #${orderNumber}`;
      const text = `Order #${orderNumber} has been delivered. We hope you love your custom merchandise!\nYou can submit a review from your account.`;
      const html = wrapEmailHtml(
        subject,
        `<h2 style="color: #FFFFFF; font-size: 20px; margin-top: 0;">Package Delivered!</h2>
        <p>Your order <strong>#${orderNumber}</strong> has been delivered. We hope you love the print quality and feel of your custom apparel.</p>
        <p style="margin: 24px 0;"><a href="https://purplefriday.in/account/orders/${orderNumber}" style="background-color: #6A2CFF; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; display: inline-block;">View Order & Write Review</a></p>`
      );
      return { subject, text, html };
    }

    case "cancelled_or_refunded": {
      const orderNumber = escapeHtml(data.orderNumber);
      const reason = escapeHtml(data.reason || "Customer request");
      const subject = `Update for Order #${orderNumber}: Cancelled/Refunded`;
      const text = `Order #${orderNumber} has been cancelled or refunded.\nReason: ${reason}`;
      const html = wrapEmailHtml(
        subject,
        `<h2 style="color: #FFFFFF; font-size: 20px; margin-top: 0;">Order #${orderNumber} Update</h2>
        <p>This order has been cancelled or refunded.</p>
        <p style="font-family: monospace; font-size: 13px; color: rgba(255,255,255,0.7);">Reason: ${reason}</p>`
      );
      return { subject, text, html };
    }

    case "problem_report_update": {
      const orderNumber = escapeHtml(data.orderNumber);
      const update = escapeHtml(data.update || "Our team has reviewed your reported issue.");
      const subject = `Update on Reported Problem: Order #${orderNumber}`;
      const text = `Update regarding Order #${orderNumber}:\n${update}`;
      const html = wrapEmailHtml(
        subject,
        `<h2 style="color: #FFFFFF; font-size: 20px; margin-top: 0;">Issue Resolution Update</h2>
        <p>Our team has updated your report for Order <strong>#${orderNumber}</strong>:</p>
        <p style="background-color: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px;">${update}</p>`
      );
      return { subject, text, html };
    }

    case "security_alert_email_changed": {
      const subject = "Security Alert: Email Address Changed";
      const text = `Security notice: The email address associated with your Purple Friday account has been updated.\nIf you did not perform this change, contact support immediately at support@purplefriday.in.`;
      const html = wrapEmailHtml(
        subject,
        `<h2 style="color: #FF5555; font-size: 20px; margin-top: 0;">Security Alert: Email Changed</h2>
        <p>The email address for your account was recently updated. All existing sessions on other devices have been terminated.</p>
        <p style="color: #FF8888;">If you did not authorize this change, please contact our support desk immediately.</p>`
      );
      return { subject, text, html };
    }

    case "security_alert_phone_changed": {
      const subject = "Security Alert: Phone Number Updated";
      const text = `Security notice: The phone number on your Purple Friday account was changed.\nIf you did not perform this change, contact support immediately.`;
      const html = wrapEmailHtml(
        subject,
        `<h2 style="color: #FFB86C; font-size: 20px; margin-top: 0;">Security Alert: Phone Updated</h2>
        <p>The phone number for your account has been updated.</p>
        <p>If you did not make this change, please secure your account immediately.</p>`
      );
      return { subject, text, html };
    }

    case "security_alert_password_changed": {
      const subject = "Security Alert: Password Changed";
      const text = `Security notice: The password for your Purple Friday account was changed.\nAll other sessions have been terminated.`;
      const html = wrapEmailHtml(
        subject,
        `<h2 style="color: #FF5555; font-size: 20px; margin-top: 0;">Security Alert: Password Changed</h2>
        <p>Your account password was successfully updated. As a security measure, all other active sessions have been signed out.</p>`
      );
      return { subject, text, html };
    }

    case "admin_alert": {
      const subject = `[PF ADMIN] ${escapeHtml(data.subject || "Operational Alert")}`;
      const body = escapeHtml(data.body || "");
      const link = escapeHtml(data.link || "/admin");
      const text = `Purple Friday Admin Notification:\n\n${data.subject || "Alert"}\n${data.body || ""}\n\nView: ${process.env.NEXT_PUBLIC_SITE_URL || "https://purplefriday.in"}${data.link || "/admin"}`;
      const html = wrapEmailHtml(
        subject,
        `<h2 style="color: #6A2CFF; font-size: 18px; margin-top: 0;">${escapeHtml(data.subject || "Operational Alert")}</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #DDD4E6;">${body}</p>
        <div style="margin-top: 24px;">
          <a href="${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL || "https://purplefriday.in")}${link}"
             style="display: inline-block; padding: 12px 24px; background-color: #6A2CFF; color: #FFFFFF; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 12px; text-transform: uppercase;">
            View in Admin Console
          </a>
        </div>`
      );
      return { subject, text, html };
    }

    case "admin_customer_event": {
      const eventType = escapeHtml(data.type);
      const summary = escapeHtml(data.summary);
      const subject = `[Admin Alert] Customer Event: ${eventType}`;
      const text = `Customer event recorded: ${eventType}\n${summary}`;
      const html = wrapEmailHtml(
        subject,
        `<h2 style="color: #FFFFFF; font-size: 18px; margin-top: 0;">Admin Alert: ${eventType}</h2>
        <p>${summary}</p>`
      );
      return { subject, text, html };
    }

    default: {
      const subject = "Notification from Purple Friday";
      const text = String(data.message || "Notification from Purple Friday");
      const html = wrapEmailHtml(subject, `<p>${escapeHtml(text)}</p>`);
      return { subject, text, html };
    }
  }
}
