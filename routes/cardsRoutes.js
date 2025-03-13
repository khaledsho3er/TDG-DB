const express = require("express");
const router = express.Router();
const CardsController = require("../controllers/CardsController");

router.post("/add", CardsController.addCard);
router.get("/user/:userId", CardsController.getUserCards);
router.put("/set-default", CardsController.setDefaultCard);
router.delete("/:cardId", CardsController.deleteCard);

module.exports = router;
