import { sendSingleEmail } from '@/lib/notification-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { firstName, lastName, phone, email, message } = await req.json();
  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get('type');

  let typeMessage = type === 'inquiry' ? 'New Private Training Inquiry' : 'New Support Request';

  try {
    const htmlMessage = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
    
    <div style="background: #111827; color: #ffffff; padding: 16px; font-size: 18px; font-weight: bold;">
    ${typeMessage}
    </div>
    
    <div style="padding: 20px; color: #111827;">
    <p style="margin-bottom: 12px;">You have received a ${typeMessage.toLocaleLowerCase()}:</p>
    
    <table style="width: 100%; border-collapse: collapse;">
    <tr>
    <td style="padding: 8px; font-weight: bold;">Name:</td>
    <td style="padding: 8px;">${firstName} ${lastName}</td>
    </tr>
    <tr style="background: #f9fafb;">
    <td style="padding: 8px; font-weight: bold;">Email:</td>
    <td style="padding: 8px;">${email}</td>
    </tr>
    <tr>
    <td style="padding: 8px; font-weight: bold;">Phone:</td>
    <td style="padding: 8px;">${phone}</td>
    </tr>
    </table>
    
    <div style="margin-top: 20px;">
    <p style="font-weight: bold; margin-bottom: 6px;">Message:</p>
    <div style="padding: 12px; background: #f3f4f6; border-radius: 6px; line-height: 1.5;">
    ${message}
    </div>
    </div>
    </div>
    
    <div style="padding: 12px; font-size: 12px; text-align: center; color: #6b7280; border-top: 1px solid #e5e7eb;">
    System • Auto-generated email
    </div>
    
    </div>
    </div>
  `;

    const adminEmail = process.env.BULK_EMAIL_USER || null;
    await sendSingleEmail(
      htmlMessage,
      type === 'inquiry' ? 'Inquiry' : 'Support',
      adminEmail as string
    );
    return NextResponse.json({ message: 'Done' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Error sending email' }, { status: 500 });
  }
}
export const revalidate = 0;
