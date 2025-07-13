const ShippingFee = require("../models/shippingFee");

/**
 * @api {post} /api/brand/:brandId/shipping-fee Set or update shipping fee for a city
 * @apiParam {String} brandId Brand ID
 * @apiBody {String} city City name
 * @apiBody {Number} fee Shipping fee amount
 * @apiSuccess {Object} shippingFee The created or updated shipping fee object
 * @apiError (400) {String} message City, fee, and brandId are required
 * @apiError (500) {String} message Error setting shipping fee
 */
// Add or update shipping fee for a city and brand
exports.setShippingFee = async (req, res) => {
  try {
    const { city, fee } = req.body;
    const { brandId } = req.params;
    if (!city || fee == null || !brandId) {
      return res
        .status(400)
        .json({ message: "City, fee, and brandId are required." });
    }
    // Upsert: update if exists, otherwise create
    const shippingFee = await ShippingFee.findOneAndUpdate(
      { city, brandId },
      { city, fee, brandId },
      { new: true, upsert: true }
    );
    res.status(200).json(shippingFee);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error setting shipping fee", error: error.message });
  }
};

/**
 * @api {get} /api/brand/:brandId/shipping-fee Get all shipping fees for a brand
 * @apiParam {String} brandId Brand ID
 * @apiSuccess {Array} fees List of shipping fee objects
 * @apiError (400) {String} message brandId is required
 * @apiError (500) {String} message Error fetching shipping fees
 */
// Get all shipping fees for a brand
exports.getShippingFees = async (req, res) => {
  try {
    const { brandId } = req.params;
    if (!brandId) {
      return res.status(400).json({ message: "brandId is required." });
    }
    const fees = await ShippingFee.find({ brandId });
    res.status(200).json(fees);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching shipping fees", error: error.message });
  }
};

/**
 * @api {get} /api/brand/:brandId/shipping-fee/:city Get shipping fee for a specific city
 * @apiParam {String} brandId Brand ID
 * @apiParam {String} city City name
 * @apiSuccess {Object} fee Shipping fee object for the city
 * @apiError (400) {String} message brandId is required
 * @apiError (404) {String} message Shipping fee not found for this city
 * @apiError (500) {String} message Error fetching shipping fee
 */
// Get shipping fee for a specific city and brand
exports.getShippingFeeByCity = async (req, res) => {
  try {
    const { brandId, city } = req.params;
    if (!brandId) {
      return res.status(400).json({ message: "brandId is required." });
    }
    const fee = await ShippingFee.findOne({ brandId, city });
    if (!fee)
      return res
        .status(404)
        .json({ message: "Shipping fee not found for this city." });
    res.status(200).json(fee);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching shipping fee", error: error.message });
  }
};
