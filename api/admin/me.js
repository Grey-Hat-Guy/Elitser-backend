const { requireAdmin } = require("../../lib/auth");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  const admin = await requireAdmin(req, res);

  if (!admin) return;

  return res.status(200).json({
    success: true,
    message: "Admin authenticated successfully",
    admin: {
      id: admin.id,
      email: admin.email,
    },
  });
};
