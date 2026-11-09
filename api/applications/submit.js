const { randomUUID } = require("crypto");
const path = require("path");

const pool = require("../../lib/db");
const supabaseAdmin = require("../../lib/supabaseAdmin");
const { applyCors } = require("../../lib/cors");
const { sendApplicationEmail } = require("../../lib/mailer");

const BUCKET = "career-resumes-temp";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedTypes = {
  pdf: {
    mime: "application/pdf",
    signature: Buffer.from("%PDF-"),
  },
  doc: {
    mime: "application/msword",
    signature: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    signature: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  },
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidResume(buffer, extension) {
  const expected = allowedTypes[extension];

  return (
    expected &&
    buffer.length >= expected.signature.length &&
    buffer.subarray(0, expected.signature.length).equals(expected.signature)
  );
}

function cleanFileName(fileName) {
  return path
    .basename(String(fileName))
    .replace(/[\r\n"]/g, "_")
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .slice(0, 150);
}

module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  let uploadedPath = null;

  try {
    const {
      jobId,
      fullName,
      email,
      mobile,
      linkedin,
      location,
      industry,
      resumePath,
      resumeFileName,
    } = req.body || {};

    if (
      !jobId ||
      !fullName ||
      !email ||
      !mobile ||
      !location ||
      !industry ||
      !resumePath ||
      !resumeFileName
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required application details.",
      });
    }

    if (
      typeof fullName !== "string" ||
      fullName.trim().length < 2 ||
      fullName.length > 150 ||
      typeof email !== "string" ||
      !isValidEmail(email) ||
      typeof mobile !== "string" ||
      !/^[0-9+()\s-]{7,20}$/.test(mobile) ||
      typeof location !== "string" ||
      location.length > 150 ||
      typeof industry !== "string" ||
      industry.length > 150
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid application details.",
      });
    }

    if (
      linkedin &&
      (typeof linkedin !== "string" ||
        linkedin.length > 300 ||
        !/^https:\/\/(www\.)?linkedin\.com\//i.test(linkedin))
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid LinkedIn URL.",
      });
    }

    // Validate job ID
    if (
      typeof jobId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        jobId,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid job selection.",
      });
    }

    if (
      typeof resumePath !== "string" ||
      !/^[0-9a-f-]{36}\.(pdf|doc|docx)$/i.test(resumePath)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid resume upload.",
      });
    }

    uploadedPath = resumePath;

    const extension = path.extname(resumePath).slice(1).toLowerCase();
    const fileConfig = allowedTypes[extension];

    const jobResult = await pool.query(
      `SELECT id, job_reference, title, department
       FROM jobs
       WHERE id = $1 AND status = 'published'`,
      [jobId],
    );

    if (jobResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "This vacancy is no longer available.",
      });
    }

    const job = jobResult.rows[0];

    const { data: file, error: downloadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(resumePath);

    if (downloadError || !file) {
      throw new Error("Unable to retrieve uploaded resume.");
    }

    const resumeBuffer = Buffer.from(await file.arrayBuffer());

    if (
      resumeBuffer.length === 0 ||
      resumeBuffer.length > MAX_FILE_SIZE ||
      !isValidResume(resumeBuffer, extension)
    ) {
      return res.status(400).json({
        success: false,
        message: "The uploaded resume is invalid or exceeds 5 MB.",
      });
    }

    await sendApplicationEmail({
      candidate: {
        fullName: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        linkedin: linkedin ? linkedin.trim() : "",
        location: location.trim(),
        industry: industry.trim(),
      },
      job,
      resumeBuffer,
      resumeFileName: cleanFileName(resumeFileName),
      resumeContentType: fileConfig.mime,
    });

    return res.status(200).json({
      success: true,
      message: "Your application has been submitted successfully!",
    });
  } catch (error) {
    console.error("Application submission error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to submit your application. Please try again.",
    });
  } finally {
    if (uploadedPath) {
      try {
        const { error } = await supabaseAdmin.storage
          .from(BUCKET)
          .remove([uploadedPath]);

        if (error) {
          console.error("Temporary resume cleanup failed:", error.message);
        }
      } catch (cleanupError) {
        console.error("Resume cleanup error:", cleanupError.message);
      }
    }
  }
};
