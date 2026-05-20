export const config = {
  runtime: 'edge', // تشغيل المحرك فائق السرعة لـ Vercel
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { image, type } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: 'صورة الوثيقة مفقودة' }), { status: 400 });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'مفتاح الـ API للذكاء الاصطناعي غير مضبوط في Vercel' }), { status: 500 });
    }

    // صياغة الأوامر الصارمة لاستخراج البيانات الآنية الفعلية دون اللجوء لمعلومات قديمة
    let customPrompt = "";
    if (type === 'license') {
      customPrompt = `أنت نظام ذكي ومحرك OCR خبير في قراءة رخص السياقة الجزائرية. 
      حلل صورة الرخصة المرفقة بدقة بالغة واستخرج نصوصها الحالية والواقعية، ثم أرجعها حصراً كـ JSON نظيف دون نصوص إضافية:
      {
        "tenantName": "الاسم واللقب الكامل المستخرج باللاتينية"،
        "licenseNumber": "رقم رخصة السياقة بدقة"،
        "birthDatePlace": "تاريخ ومكان الميلاد الكامل"،
        "licenseIssueDate": "تاريخ الصدور"،
        "tenantAddress": "العنوان السكني المكتوب في الوثيقة"
      }`;
    } else {
      customPrompt = `أنت نظام فحص خبير في قراءة البطاقات الرمادية للسيارات بالجزائر (Carte Grise).
      اقرأ الصورة بذكاء واستخرج رقم التسجيل (اللوحة المنجمية) الحقيقي والظاهر في الورقة وأرجعه كـ JSON منظم:
      {
        "plateNumber": "رقم اللوحة المنجمية النظيف والمستخرج حقيقة"
      }`;
    }

    // الاستدعاء المباشر والخفيف عبر الـ Fetch لضمان عدم حدوث مشاكل في الـ Build
    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: customPrompt },
            { inlineData: { mimeType: "image/png", data: base64Data } }
          ]
        }]
      })
    });

    const apiData = await apiResponse.json();
    const responseText = apiData.candidates[0].content.parts[0].text;
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return new Response(cleanJson, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'فشل نظام المعالجة الحية للـ AI' }), { status: 500 });
  }
}