import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BudgetAlertNotification {
  alertName: string;
  recipientEmail: string;
  threshold: number;
  currentAmount: number;
  periodType: 'daily' | 'weekly' | 'monthly';
  status: 'exceeded' | 'warning';
  filterTeam?: string | null;
  filterService?: string | null;
  filterEnvironment?: string | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Budget alert notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification: BudgetAlertNotification = await req.json();
    console.log("Notification payload:", notification);

    const {
      alertName,
      recipientEmail,
      threshold,
      currentAmount,
      periodType,
      status,
      filterTeam,
      filterService,
      filterEnvironment,
    } = notification;

    // Validate required fields
    if (!alertName || !recipientEmail || !threshold || currentAmount === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const percentage = Math.round((currentAmount / threshold) * 100);
    const isExceeded = status === 'exceeded';

    // Build filter tags display
    const tags: string[] = [];
    if (filterTeam) tags.push(`Team: ${filterTeam}`);
    if (filterService) tags.push(`Service: ${filterService}`);
    if (filterEnvironment) tags.push(`Environment: ${filterEnvironment}`);
    const tagsHtml = tags.length > 0 
      ? `<p style="color: #6b7280; font-size: 14px; margin-top: 16px;">Filters: ${tags.join(' • ')}</p>`
      : '';

    const subject = isExceeded
      ? `🚨 Budget Alert: "${alertName}" has exceeded its threshold`
      : `⚠️ Budget Warning: "${alertName}" is approaching its limit`;

    const statusColor = isExceeded ? '#ef4444' : '#f59e0b';
    const statusText = isExceeded ? 'EXCEEDED' : 'WARNING';
    const statusDescription = isExceeded
      ? `Your ${periodType} budget has exceeded the threshold.`
      : `Your ${periodType} budget is at ${percentage}% of the threshold.`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">SpendLens</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Cloud Cost Visibility & Optimization</p>
            </div>
            
            <!-- Alert Banner -->
            <div style="background-color: ${statusColor}; color: #ffffff; padding: 16px; text-align: center;">
              <span style="font-weight: 700; font-size: 14px; letter-spacing: 0.5px;">${statusText}: ${alertName}</span>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 24px; line-height: 1.6;">
                ${statusDescription}
              </p>
              
              <!-- Stats -->
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                  <div>
                    <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px;">Current Spend</p>
                    <p style="color: ${statusColor}; font-size: 28px; font-weight: 700; margin: 0;">${formatCurrency(currentAmount)}</p>
                  </div>
                  <div style="text-align: right;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px;">Threshold</p>
                    <p style="color: #374151; font-size: 28px; font-weight: 700; margin: 0;">${formatCurrency(threshold)}</p>
                  </div>
                </div>
                
                <!-- Progress Bar -->
                <div style="background-color: #e5e7eb; border-radius: 9999px; height: 8px; overflow: hidden;">
                  <div style="background-color: ${statusColor}; height: 100%; width: ${Math.min(percentage, 100)}%; border-radius: 9999px;"></div>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0; text-align: right;">${percentage}% of budget used</p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                <strong>Period:</strong> ${periodType.charAt(0).toUpperCase() + periodType.slice(1)}
              </p>
              ${tagsHtml}
              
              <!-- CTA -->
              <div style="text-align: center; margin-top: 32px;">
                <a href="#" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">View in SpendLens Dashboard</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated alert from SpendLens. You're receiving this because you set up budget monitoring.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log("Sending email to:", recipientEmail);

    const emailResponse = await resend.emails.send({
      from: "SpendLens <onboarding@resend.dev>",
      to: [recipientEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in budget-alert-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
