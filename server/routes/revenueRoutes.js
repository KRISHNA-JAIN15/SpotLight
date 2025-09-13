const express = require("express");
const router = express.Router();
const revenueController = require("../controllers/revenueController");
const { auth } = require("../middleware/auth");

// Manager revenue analytics
router.get("/manager-analytics", auth, revenueController.getManagerRevenue);

// Admin revenue analytics
router.get("/admin-analytics", auth, revenueController.getAdminRevenue);

// Financial profile management
router.get("/financial-profile", auth, revenueController.getFinancialProfile);
router.post("/withdraw", auth, revenueController.requestWithdrawal);
router.put("/bank-details", auth, revenueController.updateBankDetails);

module.exports = router;
