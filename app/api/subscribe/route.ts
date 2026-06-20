import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    // Configure the transporter with environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("⚠️ SMTP credentials not configured. Cannot send email.");
      return NextResponse.json(
        { error: 'Email service is not configured. Please contact the administrator.' },
        { status: 500 }
      );
    }

    // 1. Send Welcome Email to Subscriber
    const welcomeMailOptions = {
      from: process.env.SMTP_USER || '"MERNcrest Solutions" <noreply@merncrest.lk>',
      to: email,
      subject: 'Welcome to MERNcrest Subscription!',
      text: `Hello,\n\nWelcome to MERNcrest Solutions!\n\nThank you for subscribing to our newsletter. We are excited to have you on board. You'll be the first to know about our latest blogs, new career opportunities, and exclusive offers.\n\nBest Regards,\nThe MERNcrest Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to MERNcrest Solutions!</h2>
          <p>Hello,</p>
          <p>Thank you for subscribing to our newsletter. We are excited to have you on board!</p>
          <p>You'll be the first to know about our latest blogs, new career opportunities, and exclusive offers.</p>
          <br/>
          <p>Best Regards,</p>
          <p><strong>The MERNcrest Team</strong></p>
        </div>
      `,
    };

    // 2. Send Notification Email to Admin
    const adminMailOptions = {
      from: process.env.SMTP_USER || '"MERNcrest Subscriptions" <noreply@merncrest.lk>',
      to: 'merncrestsolution@gmail.com',
      subject: 'New Newsletter Subscriber',
      text: `A new user has subscribed to the newsletter.\n\nEmail: ${email}\n\nPlease add them to your mailing list to keep them updated on blogs, careers, and offers.`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h3>New Newsletter Subscriber</h3>
          <p>A new user has subscribed to the newsletter.</p>
          <p><strong>Email:</strong> ${email}</p>
          <br/>
          <p><em>Please add them to your mailing list to keep them updated on blogs, careers, and offers.</em></p>
        </div>
      `,
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(welcomeMailOptions),
      transporter.sendMail(adminMailOptions),
    ]);

    return NextResponse.json(
      { message: 'Subscribed successfully!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again later.' },
      { status: 500 }
    );
  }
}
