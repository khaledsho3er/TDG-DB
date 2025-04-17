// const multer = require("multer");
// const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
// const multerS3 = require("multer-s3");
// require("dotenv").config();

// // Cloudflare R2 Configuration
// const s3 = new S3Client({
//   region: "auto",
//   endpoint: "https://a29dbeb11704750c5e1d4b4544ae5595.r2.cloudflarestorage.com",
//   credentials: {
//     accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
//     secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
//   },
// });

// // Multer S3 Storage
// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: "images",
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     acl: "public-read",
//     key: (req, file, cb) => {
//       const fileName = file.originalname.replace(/\s+/g, "-");
//       const uniqueFileName = `${Date.now()}-${fileName}`;
//       cb(null, uniqueFileName);
//     },
//     metadata: (req, file, cb) => {
//       cb(null, { fieldName: file.fieldname });
//     },
//   }),
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     // Accept images and CAD files
//     if (file.fieldname === "images") {
//       if (file.mimetype.startsWith("image/")) {
//         cb(null, true);
//       } else {
//         cb(
//           new Error("Only image files are allowed for the images field"),
//           false
//         );
//       }
//     } else if (file.fieldname === "cadFile") {
//       // Check file extension for CAD files
//       const allowedExtensions = [".dwg", ".dxf", ".cad"];
//       const fileExtension =
//         "." + file.originalname.split(".").pop().toLowerCase();

//       if (allowedExtensions.includes(fileExtension)) {
//         cb(null, true);
//       } else {
//         cb(
//           new Error(
//             "Only CAD files (.dwg, .dxf, .cad) are allowed for the cadFile field"
//           ),
//           false
//         );
//       }
//     } else {
//       cb(new Error("Unexpected field"), false);
//     }
//   },
// });

// module.exports = upload;
const multer = require("multer");
const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
require("dotenv").config();

// Cloudflare R2 Configuration
const s3 = new S3Client({
  region: "auto",
  endpoint: "https://a29dbeb11704750c5e1d4b4544ae5595.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

// Custom file filter
const fileFilter = (req, file, cb) => {
  console.log(`Processing file: ${file.fieldname} - ${file.originalname}`);

  // 1. Handle main product images
  if (file.fieldname === "images") {
    if (file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    return cb(
      new Error("Only image files are allowed for product images"),
      false
    );
  }

  // 2. Handle CAD files
  if (file.fieldname === "cadFile") {
    const allowedExtensions = [
      ".dwg",
      ".dxf",
      ".cad",
      ".stp",
      ".step",
      ".igs",
      ".iges",
    ];
    const fileExtension =
      "." + file.originalname.split(".").pop().toLowerCase();
    if (allowedExtensions.includes(fileExtension)) {
      return cb(null, true);
    }
    return cb(new Error(`Invalid CAD file type: ${fileExtension}`), false);
  }

  // 3. Handle variant images (array field)
  if (file.fieldname.startsWith("variantImages[")) {
    if (file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    return cb(
      new Error("Only image files are allowed for variant images"),
      false
    );
  }

  // 4. Handle variant main images
  if (file.fieldname.startsWith("variantMainImages[")) {
    if (file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    return cb(
      new Error("Only image files are allowed for variant main images"),
      false
    );
  }

  return cb(new Error(`Unexpected field: ${file.fieldname}`), false);
};

// Multer S3 Storage Configuration
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "images",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    key: (req, file, cb) => {
      const fileName = file.originalname.replace(/\s+/g, "-");
      const uniqueFileName = `${Date.now()}-${fileName}`;
      cb(null, uniqueFileName);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: fileFilter,
});

// Custom error handler middleware
upload.errorHandler = (err, req, res, next) => {
  if (err) {
    console.error("Upload error:", err);
    if (err instanceof multer.MulterError) {
      switch (err.code) {
        case "LIMIT_FILE_SIZE":
          return res
            .status(400)
            .json({ message: "File size too large (max 5MB)" });
        case "LIMIT_FILE_COUNT":
          return res.status(400).json({ message: "Too many files uploaded" });
        case "LIMIT_UNEXPECTED_FILE":
          return res
            .status(400)
            .json({ message: `Unexpected file field: ${err.field}` });
        default:
          return res
            .status(400)
            .json({ message: `File upload error: ${err.message}` });
      }
    }
    return res.status(400).json({ message: err.message });
  }
  next();
};

module.exports = upload;
