// const multer = require("multer");
// const path = require("path");

// // Set storage engine
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// // Initialize upload
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 10000000 }, // 10MB limit
//   fileFilter: function (req, file, cb) {
//     checkFileType(file, cb);
//   },
// });

// // Check file type
// function checkFileType(file, cb) {
//   const filetypes = /jpeg|jpg|png|gif|pdf/;
//   const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = filetypes.test(file.mimetype);

//   if (mimetype && extname) {
//     return cb(null, true);
//   } else {
//     cb("Error: Images and PDFs only!");
//   }
// }

// module.exports = upload;
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB
}).fields([
  { name: "brandlogo", maxCount: 1 },
  { name: "digitalCopiesLogo", maxCount: 10 },
  { name: "coverPhoto", maxCount: 1 },
  { name: "catalogues", maxCount: 10 },
  { name: "documents", maxCount: 10 },
]);

module.exports = upload;
