import transporter from "../config/email.js";

const sendCredentialsEmail = async ({
  to,
  companyName,
  password,
  loginLink,
}) => {
  try {
    const mailOptions = {
      from: `"HRMS TOOL" <noreply@amasqis.ai>`,
      to,
      subject: `[${companyName}] Your login credentials`,
      html: `
        <div style="font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; padding: 40px; border-radius: 8px;">
                  <tr>
                    <td align="center">
                      <h2 style="color: #333;">Welcome to Amasqis.ai</h2>
                      <p style="font-size: 16px; color: #666;">Your company has been successfully registered and verified</p>
                      <p style="font-size: 16px; color: #666;">Here are your company admin login details:</p>
                      <table cellpadding="8" cellspacing="0" width="100%" style="margin: 20px 0;">
                        <tr>
                          <td style="text-align: right; font-weight: bold; width: 30%;">Email:</td>
                          <td style="text-align: left;">${to}</td>
                        </tr>
                        <tr>
                          <td style="text-align: right; font-weight: bold;">Password:</td>
                          <td style="text-align: left;">${password}</td>
                        </tr>
                      </table>
                      <a href="${loginLink}" style="display: inline-block; background: #6c4eff; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; margin-top: 20px;">
                        Log In Now
                      </a>
                      <p style="margin-top: 30px; font-size: 14px; color: #888;">
                        If the button doesn’t work, <a href="${loginLink}" style="color: #6c4eff;">click here</a>.
                      </p>
                      <p style="font-size: 12px; color: #ccc;">Please do not reply to this email.</p>
                      <p style="font-size: 10px; color: #ccc;"><a href="https://www.amasqis.ai">Amasqis.ai</a></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    // Optionally throw or return an error object
    throw new Error("Email sending failed");
  }
};

export default sendCredentialsEmail;
