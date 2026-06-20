import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { name, email, phone, portfolio, position, agreeTerms } = await request.json();

    if (!name || !email || !phone || !position) {
      return NextResponse.json(
        { error: 'Name, email, phone, and position are required.' },
        { status: 400 }
      );
    }

    if (!agreeTerms) {
      return NextResponse.json(
        { error: 'You must agree to the Terms and Conditions.' },
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

    // Email options
    const mailOptions = {
      from: process.env.SMTP_USER || '"MERNcrest Job Application" <noreply@merncrest.lk>',
      to: 'merncrestsolution@gmail.com', // Always send applications here per requirements
      replyTo: email,
      subject: `New Job Application: ${name} for ${position}`,
      text: `
Name: ${name}
Email: ${email}
Phone: ${phone}
Position Applied For: ${position}
Portfolio/Resume Link: ${portfolio || 'N/A'}
Agreed to Terms: Yes
      `,
      html: `
        <h3>New Job Application Received</h3>
        <p><strong>Applicant Name:</strong> ${name}</p>
        <p><strong>Email Address:</strong> ${email}</p>
        <p><strong>Phone Number:</strong> ${phone}</p>
        <p><strong>Position:</strong> ${position}</p>
        <p><strong>Portfolio/Resume Link:</strong> ${portfolio ? `<a href="${portfolio}">${portfolio}</a>` : 'N/A'}</p>
        <br/>
        <p><em>The applicant has checked the box confirming they agree to the terms and conditions.</em></p>
      `,
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
    } else {
      console.warn("⚠️ SMTP credentials not configured. Mocking application email send success.");
      console.log("Mock Application Email Content:", mailOptions);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return NextResponse.json(
      { message: 'Application submitted successfully!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending application email:', error);
    return NextResponse.json(
      { error: 'Failed to submit application. Please try again later.' },
      { status: 500 }
    );
  }
}
