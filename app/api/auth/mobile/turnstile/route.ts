import { NextResponse } from "next/server";

/** Minimal Turnstile page for Connect WebView / iframe embedding. */
export async function GET() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";

  if (!siteKey) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:16px;color:#64748b">
        <p>Security check not configured. You may continue.</p>
        <script>window.parent.postMessage({type:"turnstile",token:""}, "*");</script>
      </body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12px; background: #f4f6fb; font-family: Inter, system-ui, sans-serif; }
    .wrap { display: flex; justify-content: center; align-items: center; min-height: 72px; }
    .label { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 8px; }
  </style>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>
</head>
<body>
  <p class="label">Protected by Cloudflare</p>
  <div class="wrap"><div id="turnstile"></div></div>
  <script>
    function sendToken(token) {
      var payload = { type: "turnstile", token: token || "" };
      window.parent.postMessage(payload, "*");
      if (window.TurnstileChannel && window.TurnstileChannel.postMessage) {
        window.TurnstileChannel.postMessage(token || "");
      }
    }
    function renderWidget() {
      if (!window.turnstile) return setTimeout(renderWidget, 100);
      window.turnstile.render("#turnstile", {
        sitekey: ${JSON.stringify(siteKey)},
        theme: "light",
        callback: sendToken,
        "expired-callback": function() { sendToken(""); },
        "error-callback": function() { sendToken(""); }
      });
    }
    renderWidget();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy":
        "frame-ancestors 'self' http://localhost:* http://127.0.0.1:* https://system.merncrest.lk",
    },
  });
}
