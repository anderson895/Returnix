import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/errorLogger'

// ─────────────────────────────────────────────
// EMAIL TEMPLATES
// ─────────────────────────────────────────────

function baseTemplate(title: string, preheader: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Inter,Arial,sans-serif;">
  <span style="display:none;font-size:1px;color:#f4f6fb;">${preheader}</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%);padding:32px 40px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">🎒</div>
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">MSU Lost &amp; Found System</h1>
            <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Mindanao State University</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
              This is an automated message from the MSU Lost &amp; Found System.<br/>
              Please do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function claimApprovedTemplate(userName: string, itemTitle: string, trackingId: string) {
  const body = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;background:#d1fae5;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:16px;">✅</div>
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Claim Approved!</h2>
      <p style="margin:0;color:#6b7280;font-size:15px;">Great news — your claim request has been verified.</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
      <tr>
        <td style="padding:4px 0;">
          <span style="color:#6b7280;font-size:13px;">Item</span><br/>
          <strong style="color:#111827;font-size:15px;">${itemTitle}</strong>
        </td>
      </tr>
      <tr><td style="padding:8px 0 4px;">
        <span style="color:#6b7280;font-size:13px;">Tracking ID</span><br/>
        <code style="background:#dcfce7;color:#166534;padding:4px 10px;border-radius:6px;font-size:14px;font-weight:700;">#${trackingId}</code>
      </td></tr>
    </table>

    <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0;color:#1e40af;font-size:14px;font-weight:600;">📍 Next Step</p>
      <p style="margin:6px 0 0;color:#1d4ed8;font-size:14px;">Please visit the <strong>Security Office</strong> during office hours to retrieve your item. Bring a valid ID.</p>
    </div>

    <p style="color:#6b7280;font-size:13px;text-align:center;margin:0;">Hi <strong>${userName}</strong>, thank you for using the MSU Lost &amp; Found System.</p>
  `
  return baseTemplate('Claim Approved — MSU Lost & Found', 'Your claim has been approved. Visit the security office to retrieve your item.', body)
}

function claimRejectedTemplate(userName: string, itemTitle: string, reason: string) {
  const body = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;background:#fee2e2;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:16px;">❌</div>
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Claim Not Approved</h2>
      <p style="margin:0;color:#6b7280;font-size:15px;">Hi <strong>${userName}</strong>, unfortunately your claim was not verified at this time.</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:24px;">
      <tr>
        <td style="padding:4px 0;">
          <span style="color:#6b7280;font-size:13px;">Item</span><br/>
          <strong style="color:#111827;font-size:15px;">${itemTitle}</strong>
        </td>
      </tr>
      <tr><td style="padding:8px 0 4px;">
        <span style="color:#6b7280;font-size:13px;">Reason for Rejection</span><br/>
        <p style="margin:6px 0 0;color:#991b1b;font-size:14px;">${reason}</p>
      </td></tr>
    </table>

    <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">💡 What can you do?</p>
      <p style="margin:6px 0 0;color:#78350f;font-size:14px;">You may visit the Security Office to appeal with additional proof of ownership, or contact the Lost &amp; Found team directly for assistance.</p>
    </div>

    <p style="color:#6b7280;font-size:13px;text-align:center;margin:0;">Thank you for using the MSU Lost &amp; Found System.</p>
  `
  return baseTemplate('Claim Update — MSU Lost & Found', 'Your claim could not be verified. See the reason inside.', body)
}

function noMatchYetTemplate(userName: string, itemTitle: string, category: string) {
  const body = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;background:#ede9fe;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:16px;">🔍</div>
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Report Received!</h2>
      <p style="margin:0;color:#6b7280;font-size:15px;">We've recorded your lost item report successfully.</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:20px;margin-bottom:24px;">
      <tr>
        <td style="padding:4px 0;">
          <span style="color:#6b7280;font-size:13px;">Item Reported</span><br/>
          <strong style="color:#111827;font-size:15px;">${itemTitle}</strong>
        </td>
      </tr>
      <tr><td style="padding:8px 0 4px;">
        <span style="color:#6b7280;font-size:13px;">Category</span><br/>
        <span style="background:#ede9fe;color:#6d28d9;padding:3px 10px;border-radius:20px;font-size:13px;font-weight:600;">${category}</span>
      </td></tr>
    </table>

    <div style="background:#fdf4ff;border:1px solid #e9d5ff;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 8px;color:#7c3aed;font-size:15px;font-weight:600;">⏳ No Matching Items Found Yet</p>
      <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.7;">
        Sorry, <strong>${userName}</strong>! We currently don't have any items in our system that match your report.<br/><br/>
        <strong>Don't worry</strong> — we will notify you by email as soon as security personnel logs a found item that matches yours, so you can search and claim it right away.
      </p>
    </div>

    <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0;color:#166534;font-size:14px;font-weight:600;">💡 Tip</p>
      <p style="margin:6px 0 0;color:#15803d;font-size:14px;">You can also check the <strong>Search Found Items</strong> page regularly — it updates in real time as new items are logged by security.</p>
    </div>

    <p style="color:#6b7280;font-size:13px;text-align:center;margin:0;">Thank you for using the MSU Lost &amp; Found System.</p>
  `
  return baseTemplate('Lost Item Report Received — MSU Lost & Found', 'We received your report! Well notify you when a matching item is found.', body)
}

function newMatchFoundTemplate(userName: string, lostItemTitle: string, foundItemTitle: string, trackingId: string, location: string) {
  const body = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;background:#fef3c7;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:16px;">🎉</div>
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Possible Match Found!</h2>
      <p style="margin:0;color:#6b7280;font-size:15px;">Hi <strong>${userName}</strong>, a new item was logged that may match your lost item.</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td width="48%" style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;vertical-align:top;">
          <p style="margin:0 0 6px;color:#991b1b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Your Lost Item</p>
          <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">${lostItemTitle}</p>
        </td>
        <td width="4%" style="text-align:center;vertical-align:middle;color:#d1d5db;font-size:20px;">→</td>
        <td width="48%" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;vertical-align:top;">
          <p style="margin:0 0 6px;color:#166534;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Found Item</p>
          <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">${foundItemTitle}</p>
          <code style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:4px;font-size:12px;">#${trackingId}</code>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:24px;">
      <tr><td>
        <span style="color:#6b7280;font-size:13px;">📍 Found at:</span>
        <strong style="color:#111827;font-size:14px;margin-left:6px;">${location}</strong>
      </td></tr>
    </table>

    <div style="text-align:center;margin-bottom:28px;">
      <p style="margin:0 0 16px;color:#374151;font-size:14px;">Log in to the system and search for <strong>#${trackingId}</strong> to review and submit a claim if it's yours.</p>
    </div>

    <p style="color:#6b7280;font-size:13px;text-align:center;margin:0;">Thank you for using the MSU Lost &amp; Found System.</p>
  `
  return baseTemplate('Possible Match Found — MSU Lost & Found', `A new found item may match your lost ${lostItemTitle}. Check it now!`, body)
}

// ─────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    const FROM_EMAIL = process.env.FROM_EMAIL || 'MSU Lost & Found <noreply@yourdomain.com>'

    if (!RESEND_API_KEY) {
      console.error('[Email] RESEND_API_KEY is not set')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { type, to, userName, itemTitle, trackingId, rejectionReason, category, foundItemTitle, location } = body

    if (!type || !to) {
      return NextResponse.json({ error: 'Missing required fields: type, to' }, { status: 400 })
    }

    let subject = ''
    let html = ''

    switch (type) {
      case 'claim_approved':
        subject = '🎉 Your Claim Has Been Approved — MSU Lost & Found'
        html = claimApprovedTemplate(userName, itemTitle, trackingId)
        break

      case 'claim_rejected':
        subject = 'Update on Your Claim — MSU Lost & Found'
        html = claimRejectedTemplate(userName, itemTitle, rejectionReason)
        break

      case 'no_match_yet':
        subject = '📋 Lost Item Report Received — MSU Lost & Found'
        html = noMatchYetTemplate(userName, itemTitle, category)
        break

      case 'match_found':
        subject = '🎉 Possible Match Found for Your Lost Item — MSU Lost & Found'
        html = newMatchFoundTemplate(userName, itemTitle, foundItemTitle, trackingId, location)
        break

      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    })

    const data = await res.json()

    if (!res.ok) {
      await logError({
        message: data?.message || 'Resend API error',
        route: '/api/email',
        action: `send_email_${type}`,
        metadata: { to, type, resendResponse: data },
      })
      return NextResponse.json({ error: data?.message || 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (err: any) {
    await logError({
      message: err?.message || 'Email API error',
      error: err,
      route: '/api/email',
      action: 'post_email',
    })
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}