import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const position = formData.get('position') as string;
    const agreeTerms = formData.get('agreeTerms') === 'true';
    const attachment = formData.get('attachment') as File | null;

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

    let emailAttachments: any[] = [];
    if (attachment && attachment.size > 0) {
      if (attachment.size > 5 * 1024 * 1024) { // 5MB limit
        return NextResponse.json(
          { error: 'File size must be less than 5MB.' },
          { status: 400 }
        );
      }

      const allowedTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'image/jpeg', 
        'image/png', 
        'image/jpg'
      ];
      if (!allowedTypes.includes(attachment.type) && !attachment.name.endsWith('.pdf') && !attachment.name.endsWith('.docx') && !attachment.name.endsWith('.doc')) {
        return NextResponse.json(
          { error: 'Invalid file type. Only PDF, DOCX, and Image files are allowed.' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await attachment.arrayBuffer());
      emailAttachments.push({
        filename: attachment.name,
        content: buffer,
        contentType: attachment.type
      });
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
Attached File: ${attachment ? attachment.name : 'N/A'}
Agreed to Terms: Yes
      `,
      html: `
        <h3>New Job Application Received</h3>
        <p><strong>Applicant Name:</strong> ${name}</p>
        <p><strong>Email Address:</strong> ${email}</p>
        <p><strong>Phone Number:</strong> ${phone}</p>
        <p><strong>Position:</strong> ${position}</p>
        <p><strong>Attached File:</strong> ${attachment ? attachment.name : 'N/A'}</p>
        <br/>
        <p><em>The applicant has checked the box confirming they agree to the terms and conditions.</em></p>
      `,
      attachments: emailAttachments,
    };

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("⚠️ SMTP credentials not configured. Cannot send application email.");
      return NextResponse.json(
        { error: 'Email service is not configured. Please contact the administrator.' },
        { status: 500 }
      );
    }

    await transporter.sendMail(mailOptions);

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
