import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  handleCors,
  createSuccessResponse,
  createErrorResponse,
  corsHeaders,
} from "../_shared/response.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) rateLimitStore.delete(key);
  }
}

function isRateLimited(ip: string): { limited: boolean; remaining: number; resetIn: number } {
  cleanupRateLimitStore();
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { limited: true, remaining: 0, resetIn: entry.resetTime - now };
  }
  entry.count++;
  return { limited: false, remaining: MAX_REQUESTS_PER_WINDOW - entry.count, resetIn: entry.resetTime - now };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const handler = async (req: Request): Promise<Response> => {
  const cors = handleCors(req);
  if (cors) return cors;

  const clientIP =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const rateLimit = isRateLimited(clientIP);
  if (rateLimit.limited) {
    return createErrorResponse(
      "Too many requests. Please try again later.",
      429,
      "RATE_LIMIT_EXCEEDED",
      true,
    );
  }

  try {
    const { name, email, company, message } = await req.json();

    if (!name || !email || !message) {
      return createErrorResponse("Name, email, and message are required", 400, "VALIDATION_ERROR");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse("Invalid email format", 400, "VALIDATION_ERROR");
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SCRF Contact Form <onboarding@resend.dev>",
        to: ["ponkie@tsadinaledi.co.za"],
        subject: `New Contact Form Submission from ${name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Company:</strong> ${escapeHtml(company || "Not provided")}</p>
          <h3>Message:</h3>
          <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error("Resend API error:", errorData);
      return createErrorResponse("Failed to send email", 500, "EMAIL_SEND_FAILED", true);
    }

    await resendResponse.json();
    return createSuccessResponse({ sent: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("send-contact-email error:", message);
    return createErrorResponse(message, 500, "INTERNAL_ERROR", true);
  }
};

serve(handler);
