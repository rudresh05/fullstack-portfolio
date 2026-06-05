import { Resend } from "resend";

const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

export async function sendJournalEmail(date: string, data: Record<string, string>) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey || !adminEmail) {
    console.warn("Resend API key or Admin Email missing. Email not sent.");
    return;
  }

  const resend = new Resend(apiKey);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&family=Geist+Mono:wght@400;700&display=swap');
        
        body { margin: 0; padding: 0; background-color: #000; font-family: 'Inter', -apple-system, sans-serif; color: #fff; -webkit-font-smoothing: antialiased; }
        .wrapper { padding: 80px 20px; background-color: #000; }
        .container { max-width: 540px; margin: 0 auto; }
        
        /* High-End Mono Labels */
        .mono { font-family: 'Geist Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 3px; color: #444; }
        
        /* Header */
        .header { margin-bottom: 60px; }
        .date { font-size: 42px; font-weight: 900; letter-spacing: -2px; margin: 8px 0 0 0; color: #fff; line-height: 1; }
        
        /* Metrics Grid */
        .metrics { display: table; width: 100%; border-top: 1px solid #111; border-bottom: 1px solid #111; padding: 30px 0; margin-bottom: 60px; }
        .m-col { display: table-cell; width: 33.33%; }
        .m-val { font-size: 24px; font-weight: 400; color: #fff; margin-top: 4px; }
        
        /* Content Sections */
        .section { margin-bottom: 60px; }
        .section-label { margin-bottom: 24px; display: block; }
        .content-item { margin-bottom: 32px; }
        .item-h { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 8px; display: block; }
        .item-p { font-size: 15px; line-height: 1.7; color: #777; margin: 0; font-weight: 300; }
        
        /* Impact Box - Zero Color */
        .impact-box { border: 1px solid #222; padding: 32px; border-radius: 2px; margin-top: 10px; }
        .impact-text { font-size: 16px; font-weight: 600; color: #fff; margin: 0; line-height: 1.6; }
        
        /* Tomorrow Directives */
        .directives { padding: 0; list-style: none; margin: 0; }
        .dir-item { font-size: 15px; color: #fff; padding: 12px 0; border-bottom: 1px solid #111; }
        .dir-num { color: #444; margin-right: 15px; font-weight: 700; font-family: 'Geist Mono', monospace; }
        
        /* Truth Section */
        .truth { text-align: center; padding: 60px 0; border-top: 1px solid #111; }
        .truth-p { font-size: 20px; font-weight: 300; font-style: italic; color: #fff; line-height: 1.6; margin: 0; max-width: 400px; margin: 0 auto; }

        .footer { padding-top: 40px; text-align: left; }
        .footer-text { font-size: 8px; color: #222; text-transform: uppercase; letter-spacing: 5px; font-family: 'Geist Mono', monospace; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          
          <header class="header">
            <span class="mono">Journal Archive // 01</span>
            <h1 class="date">${date}</h1>
          </header>

          <div class="metrics">
            <div class="m-col">
              <div class="mono">Flow</div>
              <div class="m-val">${data.deepWorkHours || '0h'}</div>
            </div>
            <div class="m-col">
              <div class="mono">Assets</div>
              <div class="m-val">${data.revenue || 'Rs 0'}</div>
            </div>
            <div class="m-col">
              <div class="mono">Growth</div>
              <div class="m-val">${data.networking || '0'}</div>
            </div>
          </div>

          <div class="section">
            <span class="section-label mono">Shipments</span>
            <div class="content-item">
              <span class="item-h">Engineering Log</span>
              <p class="item-p">${data.codingCompleted || 'System baseline maintained.'}</p>
            </div>
            <div class="content-item">
              <span class="item-h">Strategic Log</span>
              <p class="item-p">${data.workCompleted || 'Routine processing.'}</p>
            </div>
          </div>

          <div class="section">
            <span class="section-label mono">Major Outcome</span>
            <div class="impact-box">
              <p class="impact-text">${data.wins || 'Compounding output.'}</p>
            </div>
          </div>

          <div class="section">
            <span class="section-label mono">Directives</span>
            <div class="directives">
              <div class="dir-item"><span class="dir-num">01</span> ${data.nonNegotiable1 || 'Pending initialization.'}</div>
              <div class="dir-item"><span class="dir-num">02</span> ${data.nonNegotiable2 || 'Pending initialization.'}</div>
              <div class="dir-item" style="border: none;"><span class="dir-num">03</span> ${data.nonNegotiable3 || 'Pending initialization.'}</div>
            </div>
          </div>

          <div class="truth">
            <p class="truth-p">"${data.futureSentence || 'Moving forward without friction.'}"</p>
          </div>

          <footer class="footer">
            <div class="footer-text">RUDRESH PATEL // AUTONOMOUS_JOURNAL</div>
          </footer>

        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "Rudresh Patel <updates@rudreshp.me>",
      to: adminEmail,
      subject: `Journal Update // ${date}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send journal email:", error);
  }
}
