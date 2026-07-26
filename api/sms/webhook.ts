import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

// تهيئة الاتصال بقاعدة بيانات Convex
const convex = new ConvexHttpClient(
  process.env.VITE_CONVEX_URL || process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // قبول طلبات POST فقط
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};

    // استخراج بيانات الرسالة والموبايل
    const sender = body.sender || body.from || 'VF-Cash';
    const message = body.message || body.text || body.content || '';
    const phone = body.phone || body.sim || '01009149586';

    if (!message) {
      return res.status(400).json({ success: false, message: 'محتوى الرسالة مطلوب' });
    }

    // استدعاء Mutation للـ Convex لتفكيك الرسالة وتسجيل العملية وتحديث الرصيد
    const result = await convex.mutation(api.webhook.parseAndProcessSms, {
      sender,
      phone,
      body: message,
    });

    return res.status(200).json({
      success: true,
      message: 'تم استقبال الرسالة وتحديث البيانات بنجاح!',
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