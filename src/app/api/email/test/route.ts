import { NextResponse } from "next/server";
import { isSendLibConfigured, sendEmail } from "@/lib/email/sendlib";

export const runtime = "nodejs";

/**
 * POST /api/email/test
 * Body: { "to": "you@example.com" }
 * Sends a one-off test via SendLib. Remove or protect before public launch.
 */
export async function POST(request: Request) {
  if (!isSendLibConfigured()) {
    return NextResponse.json(
      {
        error:
          "SendLib not configured. Set SENDLIB_API_KEY (from https://sendlib.samueltuoyo.com).",
      },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { to?: string };
  const to = body.to?.trim();
  if (!to) {
    return NextResponse.json({ error: "Provide { \"to\": \"email@example.com\" }" }, { status: 400 });
  }

  const result = await sendEmail({
    to,
    subject: "Kurospace · SendLib test",
    html: `<p>SendLib is connected to Kurospace.</p><p>Docs: <a href="https://sendlib.samueltuoyo.com/docs/send">Basic Send</a></p>`,
    text: "SendLib is connected to Kurospace.",
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
