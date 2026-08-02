function emailTemplate(data) {
  let year = new Date().getFullYear();

  let template = `
  <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contact Form Notification</title>
</head>

<body style="margin:0; padding:0; background:#f0f2f5; font-family:'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0 60px;">
    <tr>
      <td align="center">

        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);">

          <tr>
            <td style="height:4px; background:#D8042C;"></td>
          </tr>

          <tr>
            <td style="padding:28px 32px 16px 32px;">
              <h2 style="margin:0; color:#1a1a2e; font-size:24px; font-weight:600; letter-spacing:-0.3px;">New Enquiry</h2>
              <p style="margin:8px 0 0; color:#6b7280; font-size:14px; font-weight:400;">
                Submitted via website contact form
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px;">
              <hr style="border:0; height:1px; background:#e5e7eb; margin:0;">
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 32px 32px;">

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td width="48%" style="vertical-align:top;">
                    <div>
                      <p style="margin:0; font-size:11px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px;">First Name</p>
                      <p style="margin:6px 0 0; font-size:15px; font-weight:500; color:#1f2937;">
                        {{firstName}}
                      </p>
                    </div>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="vertical-align:top;">
                    <div>
                      <p style="margin:0; font-size:11px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px;">Last Name</p>
                      <p style="margin:6px 0 0; font-size:15px; font-weight:500; color:#1f2937;">
                        {{lastName}}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <div style="margin-bottom:20px;">
                <p style="margin:0; font-size:11px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px;">Email Address</p>
                <p style="margin:6px 0 0; font-size:15px; font-weight:500; color:#1f2937;">
                  <a href="mailto:{{email}}" style="color:#D8042C; text-decoration:none;">{{email}}</a>
                </p>
              </div>

              <div style="margin-top:24px;">
                <p style="margin:0; font-size:11px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px;">Message</p>
                <div style="margin-top:10px; padding:16px; background:#f9fafb; border-radius:12px; border-left:3px solid #D8042C;">
                  <p style="margin:0; color:#374151; font-size:14px; line-height:1.6;">
                    {{message}}
                  </p>
                </div>
              </div>

            </td>
          </tr>

          <tr>
            <td style="padding:0 32px;">
              <hr style="border:0; height:1px; background:#e5e7eb; margin:0;">
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 24px 32px; text-align:center;">
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                &copy; ${year} Elitser Technologies · All Rights Reserved
              </p>
              <p style="margin:6px 0 0; font-size:11px; color:#cbd5e1;">
                This is an automated notification from your website contact form.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

  const phoneBlock = data.phone
    ? `
    <div style="margin-bottom:20px;">
      <p style="margin:0; font-size:11px; font-weight:600; color:#9ca3af;">Phone Number</p>
      <p style="margin:6px 0 0; font-size:15px; color:#1f2937;">
        ${data.phone}
      </p>
    </div>`
    : "";

  const organizationBlock = data.organization
    ? `
    <div style="margin-bottom:20px;">
      <p style="margin:0; font-size:11px; font-weight:600; color:#9ca3af;">Organization</p>
      <p style="margin:6px 0 0; font-size:15px; color:#1f2937;">
        ${data.organization}
      </p>
    </div>`
    : "";

  template = template
    .replace(/{{firstName}}/g, data.firstName)
    .replace(/{{lastName}}/g, data.lastName)
    .replace(/{{email}}/g, data.email)
    .replace(/{{message}}/g, data.message || "")
    .replace(/{{phoneBlock}}/g, phoneBlock)
    .replace(/{{organizationBlock}}/g, organizationBlock);

  return template;
}

module.exports = { emailTemplate };
