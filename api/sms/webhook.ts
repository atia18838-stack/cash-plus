import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. إعدادات الهيدرز و CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // التعامل مع طلبات Preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // رفض أي طلب ليس POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: 'Only POST requests are accepted.'
    });
  }

  try {
    // 2. اختيارية: التحقق من مفتاح الأمان (Security Auth Check)
    // يمكنك إضافة WEBHOOK_SECRET في Vercel Environment Variables
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const authHeader = req.headers['authorization'] || req.headers['x-api-key'];

    if (webhookSecret && authHeader !== webhookSecret) {
      console.warn("⚠️ Unauthorized webhook attempt detected.");
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or missing security token.'
      });
    }

    const body = req.body || {};

    // 3. استخراج واستخراج بيانات الرسالة الذكي (حسب نوع تطبيق الموبايل)
    const sender = body.from || body.sender || body.address || 'Unknown Sender';
    const message = body.message || body.text || body.body || body.content || '';
    const receivedAt = body.timestamp || new Date().toISOString();

    // 4. طباعة منظمة في Vercel Logs
    console.log("==========================================");
    console.log(`📨 NEW SMS RECEIVED | ${new Date().toLocaleString()}`);
    console.log(`👤 From: ${sender}`);
    console.log(`💬 Message: ${message}`);
    console.log("📦 Full Payload:", JSON.stringify(body, null, 2));
    console.log("==========================================");

    // -------------------------------------------------------------
    // 💡 نقطة الربط القادمة (Database / Convex Integration):
    // await saveSmsToDatabase({ sender, message, receivedAt, raw: body });
    // -------------------------------------------------------------

    // 5. الرد بالنجاح على تطبيق الموبايل
    return res.status(200).json({
      success: true,
      message: 'SMS processed and logged successfully!',
      processedData: {
        sender,
        message,
        receivedAt
      },
      receivedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("❌ Error processing incoming SMS:", error);

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error?.message || 'An unexpected error occurred while processing the request.'
    });
  }
}