const express = require("express");
const {
  subscribe,
  unsubscribe,
  getAllSubscribers,
  deleteSubscriber,
} = require("../controllers/newsletterController");

const router = express.Router();

router.post("/subscribe", subscribe);
router.put("/unsubscribe/:email", unsubscribe);
router.get("/", getAllSubscribers);
router.delete("/:id", deleteSubscriber);

module.exports = router;
