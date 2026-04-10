import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { logError } from '@/lib/errorLogger'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

function resetPasswordTemplate(resetUrl: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password – Back2U</title>
</head>
<body style="margin:0;padding:0;background:#f4f0f1;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:#7D1128;padding:32px 40px 28px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.6);font-weight:400;">Back2U · MSU Lost &amp; Found</p>
              <h1 style="margin:12px 0 0;font-size:22px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;">Reset Your Password</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 32px;">
              <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">Hi there,</p>
              <p style="margin:0 0 28px;font-size:14px;color:#555;line-height:1.7;">
                We received a request to reset your password. Click the button below to proceed. This link is valid for <strong style="color:#333;">24 hours</strong>.
              </p>

              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:13px 36px;background:#7D1128;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;border-radius:8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#aaa;line-height:1.6;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#faf7f8;padding:20px 40px;border-top:1px solid #ede8e9;">
              <p style="margin:0;font-size:12px;color:#bbb;text-align:center;">
                &copy; 2026 Back2U · Marinduque State University
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    // Generate reset link via Supabase Admin (no email sent by Supabase)
    const { data, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/reset-password`,
      },
    })

    if (linkError) {
      await logError({
        message: linkError.message,
        error: linkError,
        route: '/api/auth/forgot-password',
        action: 'generate_reset_link',
        userEmail: email,
      })
      // Return generic message to avoid exposing whether email exists
      return NextResponse.json({ success: true })
    }

    const resetUrl = data?.properties?.action_link
    if (!resetUrl) {
      return NextResponse.json({ error: 'Failed to generate reset link' }, { status: 500 })
    }

    // Send via Nodemailer
    const transporter = createTransporter()
    await transporter.sendMail({
      from: `"Back2U Lost & Found" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🔐 Reset Your Password – Back2U',
      html: resetPasswordTemplate(resetUrl),
    })

    return NextResponse.json({ success: true })

  } catch (err: any) {
    await logError({
      message: err?.message || 'Forgot password API error',
      error: err,
      route: '/api/auth/forgot-password',
      action: 'post_forgot_password',
    })
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}