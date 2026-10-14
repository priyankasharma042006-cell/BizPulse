import { createRemoteJWKSet, jwtVerify } from "npm:jose@5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "bizpulse-v1";
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

/** Returns the Firebase UID if the request carries a valid Firebase ID token, otherwise null. */
async function verifyFirebaseUser(req: Request): Promise<string | null> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch (err) {
    console.error("Token verification failed:", err);
    return null;
  }
}

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are BizPulse, an AI business co-pilot for small business owners in India.
You help with cash flow, demand forecasting, inventory, and growth decisions.
The user speaks simply and may not be financially literate.

Rules:
- Answer in plain, simple language. No jargon.
- Use the business data provided to give specific, actionable advice.
- Always explain WHY something is happening and suggest ONE concrete action.
- Keep answers concise (3-5 sentences max unless asked for detail).
- If data is insufficient, say so and suggest what to log.
- You are guidance only, not financial advice. The owner always decides.
- Use INR (₹) for money. Be encouraging but honest about risks.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Only signed-in BizPulse users may spend the AI quota.
  const uid = await verifyFirebaseUser(req);
  if (!uid) return json({ error: "Please sign in again." }, 401);

  try {
    const raw = await req.text();
    if (raw.length > 30_000) return json({ error: "Request too large" }, 413);
    const { question: rawQuestion, context } = JSON.parse(raw);
    const question = typeof rawQuestion === "string" ? rawQuestion.trim().slice(0, 500) : "";

    if (!question) return json({ error: "Question is required" }, 400);

    // If no API key, return a helpful fallback
    if (!GROQ_API_KEY) {
      const fallback = generateRuleBasedAnswer(question, context);
      return new Response(
        JSON.stringify({ answer: fallback, source: "rules" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contextStr = JSON.stringify(context, null, 2);

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Here is my business data (aggregated, no personal info):\n\n${contextStr}\n\nMy question: ${question}`,
      },
    ];

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", response.status, errText);
      const fallback = generateRuleBasedAnswer(question, context);
      return new Response(
        JSON.stringify({ answer: fallback, source: "rules" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      const fallback = generateRuleBasedAnswer(question, context);
      return new Response(
        JSON.stringify({ answer: fallback, source: "rules" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ answer, source: "groq" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateRuleBasedAnswer(question: string, context: any): string {
  const q = question.toLowerCase();
  const s = context?.summary ?? {};
  const items = context?.low_stock_items ?? [];
  const bills = context?.pending_bills ?? [];

  if (q.includes("cash") || q.includes("balance") || q.includes("flow") || q.includes("runway")) {
    const balance = s.current_balance ?? 0;
    const runway = s.runway_days;
    if (runway && runway <= 30) {
      return `Your current balance is ₹${balance}. Based on your spending pattern, your balance may go negative in about ${runway} days. I suggest collecting any receivables now and delaying non-essential expenses until your cash position improves.`;
    }
    return `Your current balance is ₹${balance}. No cash shortfall is projected in the next 30 days — your runway looks healthy. Keep logging daily to improve forecast accuracy.`;
  }

  if (q.includes("reorder") || q.includes("stock") || q.includes("inventory")) {
    if (items.length === 0) {
      return `All your items are above their reorder levels. No restocking needed right now. Check back after logging more sales.`;
    }
    const itemList = items.map((i: any) => `${i.name} (${i.stock} ${i.unit} left)`).join(", ");
    return `You have ${items.length} items at or below reorder level: ${itemList}. Order the most critical ones first — prioritize items that sell daily.`;
  }

  if (q.includes("health") || q.includes("score")) {
    const score = s.health_score ?? 0;
    const reasons = s.health_reasons ?? [];
    if (reasons.length === 0) {
      return `Your health score is ${score}/100 — that's a strong score. Keep logging sales and expenses daily to maintain accuracy.`;
    }
    const reasonList = reasons.map((r: any) => r.label).join(", ");
    return `Your health score is ${score}/100. The main factors pulling it down are: ${reasonList}. Focus on the highest-point items first to improve your score.`;
  }

  if (q.includes("expense") || q.includes("spend")) {
    const expenses = s.total_expenses ?? 0;
    return `Your total logged expenses are ₹${expenses}. Check your Dashboard for the 30-day cash projection to see how expenses affect your runway.`;
  }

  if (q.includes("sale") || q.includes("revenue") || q.includes("income")) {
    const sales = s.total_sales ?? 0;
    return `Your total logged sales are ₹${sales}. The 7-day forecast on your Dashboard predicts future sales based on your recent pattern.`;
  }

  if (q.includes("bill") || q.includes("pay") || q.includes("due")) {
    if (bills.length === 0) {
      return `You have no pending bills. Great — your payables are clear.`;
    }
    const billList = bills.map((b: any) => `${b.payee}: ₹${b.amount} due ${b.due_date}`).join(", ");
    return `You have ${bills.length} pending bills: ${billList}. Pay the overdue ones first to avoid penalties.`;
  }

  if (q.includes("digest") || q.includes("summary") || q.includes("week")) {
    const change = s.sales_change_pct ?? 0;
    const direction = change >= 0 ? "up" : "down";
    return `This week your sales are ${direction} ${Math.abs(change)}%. Your health score is ${s.health_score}/100 with ${s.runway_days ? s.runway_days + " days of cash runway" : "a healthy runway"}. Focus on the top 3 actions on your Digest page.`;
  }

  return `I can help with cash flow, inventory, health score, sales, expenses, and bills. Try asking "How is my cash flow?" or "What should I reorder?" for specific advice based on your data.`;
}
