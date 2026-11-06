import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  handleCors,
  createSuccessResponse,
  createErrorResponse,
} from "../_shared/response.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface FeedbackEmailRequest {
  name: string;
  email: string;
  overallExperience: number;
  toolUsefulness: number;
  perceivedValue: number;
  easeOfUse: number;
  mostUsefulFeature: string;
  improvementSuggestions: string;
  wouldRecommend: boolean;
  additionalComments: string;
}

const escapeHtml = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const getRatingStars = (rating: number): string =>
  "★".repeat(rating) + "☆".repeat(5 - rating);

const handler = async (req: Request): Promise<Response> => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const feedback: FeedbackEmailRequest = await req.json();

    if (!feedback.email || !feedback.name) {
      return createErrorResponse("Name and email are required", 400, "VALIDATION_ERROR");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(feedback.email)) {
      return createErrorResponse("Invalid email format", 400, "VALIDATION_ERROR");
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a365d; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .rating-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
          .stars { color: #f59e0b; font-size: 18px; }
          .section { margin: 20px 0; }
          .section-title { font-weight: bold; color: #1a365d; margin-bottom: 8px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
          .badge-yes { background: #10b981; color: white; }
          .badge-no { background: #ef4444; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">New User Feedback Received</h1>
            <p style="margin: 10px 0 0;">SCRF Platform Feedback</p>
          </div>
          <div class="content">
            <div class="section">
              <div class="section-title">Submitted By</div>
              <p><strong>Name:</strong> ${escapeHtml(feedback.name)}</p>
              <p><strong>Email:</strong> ${escapeHtml(feedback.email)}</p>
            </div>
            <div class="section">
              <div class="section-title">Ratings</div>
              <div class="rating-row"><span>Overall Experience</span><span class="stars">${getRatingStars(feedback.overallExperience)}</span></div>
              <div class="rating-row"><span>Tool Usefulness</span><span class="stars">${getRatingStars(feedback.toolUsefulness)}</span></div>
              <div class="rating-row"><span>Perceived Value</span><span class="stars">${getRatingStars(feedback.perceivedValue)}</span></div>
              <div class="rating-row"><span>Ease of Use</span><span class="stars">${getRatingStars(feedback.easeOfUse)}</span></div>
            </div>
            <div class="section">
              <div class="section-title">Would Recommend?</div>
              <span class="badge ${feedback.wouldRecommend ? "badge-yes" : "badge-no"}">${feedback.wouldRecommend ? "Yes" : "No"}</span>
            </div>
            ${feedback.mostUsefulFeature ? `<div class="section"><div class="section-title">Most Useful Feature</div><p>${escapeHtml(feedback.mostUsefulFeature)}</p></div>` : ""}
            ${feedback.improvementSuggestions ? `<div class="section"><div class="section-title">Improvement Suggestions</div><p>${escapeHtml(feedback.improvementSuggestions)}</p></div>` : ""}
            ${feedback.additionalComments ? `<div class="section"><div class="section-title">Additional Comments</div><p>${escapeHtml(feedback.additionalComments)}</p></div>` : ""}
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SCRF Feedback <onboarding@resend.dev>",
        to: ["ponkie@tsadinaledi.co.za"],
        subject: `New Feedback from ${escapeHtml(feedback.name)}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      throw new Error(`Resend API error: ${errorData}`);
    }

    await emailResponse.json();
    return createSuccessResponse({ sent: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("send-feedback-email error:", message);
    return createErrorResponse(message, 500, "INTERNAL_ERROR", true);
  }
};

serve(handler);
