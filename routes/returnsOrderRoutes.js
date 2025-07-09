const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/returnsOrderController");
// const { protect, isAdmin, isBrand } = require("../middleware/authMiddleware");

router.post("/returns", ctrl.createReturnRequest);
router.put("/returns/:id/brand", ctrl.updateReturnByBrand);
router.put("/returns/:id/admin", ctrl.updateReturnByAdmin);

router.get("/returns", ctrl.getAllReturns);
router.get("/returns/:id", ctrl.getReturnById);
router.delete("/returns/:id", ctrl.deleteReturn);
router.get("/returns/brand/:brandId", ctrl.getReturnsByBrand);

module.exports = router;
