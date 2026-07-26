import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api.js';

const convex = new ConvexHttpClient(
  process.env.VITE_CONVEX_URL || process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    
    // 🔥 طباعة الـ Body بالكامل في الـ Logs للرؤية التحليلية
    console.log("RECEIVED PAYLOAD:", JSON.stringify(body));

    const sender = body.sender || body.from || body.address || 'VF-Cash';
    const message = body.message || body.text || body.content || body.sms || '';
    const phone = body.phone || body.sim || '01009149586';

    console.log("PARSED VALUES -> Sender:", sender, "| Phone:", phone, "| Message:", message);

    if (!message) {
      return res.status(400).json({ success: false, message: 'محتوى الرسالة فارغ' });
    }

    const result = await convex.mutation(api.webhook.parseAndProcessSms, {
      sender,
      phone,
      body: message,
    });

    console.log("CONVEX RESULT:", JSON.stringify(result));

    return res.status(200).json({
      success: true,
      message: 'تم استقبال الرسالة',
      data: result,
    });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء معالجة الرسالة',
      error: error.message || error,
    });
  }
}