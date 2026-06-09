exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { imageBase64, occasion } = JSON.parse(event.body);
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  const prompt = `You are an expert makeup artist and beauty consultant with deep knowledge of how to work with different skin tones, undertones, face shapes, and features — especially for women of colour and Afro-Caribbean heritage.

Analyse this person's selfie carefully and generate a detailed, personalized makeup profile for the occasion: "${occasion}".

Structure your response EXACTLY as valid JSON with these keys:
{
  "face_analysis": "2-3 sentences describing their skin tone, undertones, face shape, and standout features you notice",
  "occasion_vibe": "1-2 sentences describing the look direction for this occasion",
  "eyes": "Specific eyeshadow colours, technique, liner style that suits their eye shape and skin tone",
  "brows": "Brow shape, fill technique, and product type recommendation",
  "skin": "Foundation undertone match, coverage level, finish (matte/dewy), and any skin prep tips",
  "cheeks": "Blush shade family, placement technique for their face shape, highlight if relevant",
  "lips": "Lip colour family, specific shade description, finish (matte/gloss/satin)",
  "products": [
    { "category": "Foundation", "name": "Product name", "why": "Why it suits them" },
    { "category": "Eyeshadow palette", "name": "Product name", "why": "Why it suits them" },
    { "category": "Lip colour", "name": "Product name", "why": "Why it suits them" },
    { "category": "Blush", "name": "Product name", "why": "Why it suits them" },
    { "category": "Highlighter", "name": "Product name", "why": "Why it suits them" }
  ],
  "pro_tip": "One specific technique tip that will make the biggest difference for their features"
}

Be specific, warm, and genuinely helpful. Recommend real products that actually exist. Focus especially on what works for deeper/medium-brown skin tones with warm undertones. Return ONLY the JSON, no other text.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
            { text: prompt }
          ]
        }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1200 }
      })
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result: clean })
  };
};
