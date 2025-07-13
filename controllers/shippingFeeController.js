const ShippingFee = require("../models/shippingFee");

/**
 * @api {post} /api/brand/shipping-fee Set or update shipping fee for a city
 * @apiBody {String} city City name
 * @apiBody {Number} fee Shipping fee amount
 * @apiSuccess {Object} shippingFee The created or updated shipping fee object
 * @apiError (400) {String} message City and fee are required
 * @apiError (500) {String} message Error setting shipping fee
 */
// Add or update shipping fee for a city and brand
exports.setShippingFee = async (req, res) => {
  try {
    const { city, fee } = req.body;
    const brandId = req.user.id; // assuming req.user is set by auth middleware
    if (!city || fee == null) {
      return res.status(400).json({ message: "City and fee are required." });
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
 * @api {get} /api/brand/shipping-fee Get all shipping fees for the authenticated brand
 * @apiSuccess {Array} fees List of shipping fee objects
 * @apiError (500) {String} message Error fetching shipping fees
 */
// Get all shipping fees for a brand
exports.getShippingFees = async (req, res) => {
  try {
    const brandId = req.user.id; // assuming req.user is set by auth middleware
    const fees = await ShippingFee.find({ brandId });
    res.status(200).json(fees);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching shipping fees", error: error.message });
  }
};

/**
 * @api {get} /api/brand/shipping-fee/:city Get shipping fee for a specific city
 * @apiParam {String} city City name
 * @apiSuccess {Object} fee Shipping fee object for the city
 * @apiError (404) {String} message Shipping fee not found for this city
 * @apiError (500) {String} message Error fetching shipping fee
 */
// Get shipping fee for a specific city and brand
exports.getShippingFeeByCity = async (req, res) => {
  try {
    const brandId = req.user.id;
    const { city } = req.params;
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
