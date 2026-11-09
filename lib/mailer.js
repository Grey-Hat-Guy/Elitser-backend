const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

async function sendApplicationEmail({
  candidate,
  job,
  resumeBuffer,
  resumeFileName,
  resumeContentType,
}) {
  const html = `
    <h2>New Job Application</h2>

    <h3>Candidate Details</h3>
    <p><strong>Name:</strong> ${escapeHtml(candidate.fullName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(candidate.email)}</p>
    <p><strong>Mobile:</strong> ${escapeHtml(candidate.mobile)}</p>
    <p><strong>LinkedIn:</strong> ${escapeHtml(candidate.linkedin || "Not provided")}</p>
    <p><strong>Location:</strong> ${escapeHtml(candidate.location)}</p>
    <p><strong>Industry:</strong> ${escapeHtml(candidate.industry)}</p>

    <hr />

    <h3>Applied Position</h3>
    <p><strong>Job Reference:</strong> ${escapeHtml(job.job_reference)}</p>
    <p><strong>Job Title:</strong> ${escapeHtml(job.title)}</p>
    <p><strong>Department:</strong> ${escapeHtml(job.department || "Not specified")}</p>
  `;

  return transporter.sendMail({
    from: `"Elitser Careers" <${process.env.SMTP_USER}>`,
    to: process.env.HR_EMAIL,
    replyTo: candidate.email,
    subject: `New Application: ${job.title} (${job.job_reference})`,
    html,
    attachments: [
      {
        filename: resumeFileName,
        content: resumeBuffer,
        contentType: resumeContentType,
      },
    ],
  });
}

module.exports = { sendApplicationEmail };
