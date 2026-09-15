import { sendSingleEmail, sendSingleSMS } from '@/lib/notification-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { emails, msg, subject = 'Notification' } = await req.json();

  if (!emails || !msg) return NextResponse.json({ message: 'Data missing' }, { status: 400 });

  try {
    await Promise.all(
      emails.map(async (item: any) => {
        const formattedMsg = msg
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
          .replace(/\n/g, '<br/>');

        // 👇 Email for player
        const playerMessage = `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial; background:#f9fafb; padding:20px;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:8px;">
      <h2>Hello 👋</h2>

      <p>${formattedMsg}</p>

      <p style="margin-top:24px;">
        — Advanced Physical and Technical Training Team
      </p>
    </div>
  </body>
</html>
`;

        if (item?.email) {
          await sendSingleEmail(playerMessage, subject, item.email);
        }

        if (item?.parent_email) {
          const parentMessage = `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial; background:#f9fafb; padding:20px;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:8px;">
      <h2>Hello 👋</h2>

      <p>
  You are being notified as the parent/guardian of 
  <strong>${item?.name || 'Unknown'}</strong>.
</p>

<p>
  The message below has also been communicated to them:
</p>

      <p style="margin-top:16px;">
        ${formattedMsg}
      </p>

      <p style="margin-top:24px;">
        — Advanced Physical and Technical Training Team
      </p>
    </div>
  </body>
</html>
`;

          await sendSingleEmail(parentMessage, subject, item.parent_email);
        }
      })
    );

    return NextResponse.json({ message: 'Email sent' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Server Error' }, { status: 200 });
  }
}
