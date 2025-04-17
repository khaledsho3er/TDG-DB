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

// Custom file filter with enhanced field handling
const fileFilter = (req, file, cb) => {
  console.log(`Processing file: ${file.fieldname} (${file.mimetype})`);

  // Define allowed fields and their requirements
  const fieldRequirements = {
    images: {
      types: ["image/jpeg", "image/png", "image/webp"],
      maxCount: 10,
    },
    cadFile: {
      types: [
        "application/acad",
        "application/dxf",
        "application/x-dwf",
        "application/octet-stream", // For binary CAD files
      ],
      extensions: [".dwg", ".dxf", ".cad", ".stp", ".step", ".igs", ".iges"],
      maxCount: 1,
    },
    variantImages: {
      types: ["image/jpeg", "image/png", "image/webp"],
      maxCount: 50,
    },
    variantMainImages: {
      types: ["image/jpeg", "image/png", "image/webp"],
      maxCount: 10,
    },
  };

  // Check if field is allowed (including array-style fields)
  const fieldName = file.fieldname.replace(/\[\d*\]/g, ""); // Remove array brackets
  const requirements = fieldRequirements[fieldName];

  if (!requirements) {
    return cb(new Error(`Unexpected field: ${file.fieldname}`), false);
  }

  // Check file type
  if (requirements.types && !requirements.types.includes(file.mimetype)) {
    return cb(
      new Error(
        `Invalid file type for ${fieldName}. Expected: ${requirements.types.join(
          ", "
        )}`
      ),
      false
    );
  }

  // Check file extension (for CAD files)
  if (requirements.extensions) {
    const fileExtension = file.originalname.split(".").pop().toLowerCase();
    if (!requirements.extensions.includes(`.${fileExtension}`)) {
      return cb(
        new Error(
          `Invalid file extension for ${fieldName}. Allowed: ${requirements.extensions.join(
            ", "
          )}`
        ),
        false
      );
    }
  }

  // File is valid
  cb(null, true);
};

// Multer S3 Storage Configuration
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "images",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    key: (req, file, cb) => {
      // Generate unique filename with original extension
      const fileExt = file.originalname.split(".").pop();
      const uniqueFileName = `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}.${fileExt}`;

      // Organize by upload type
      let prefix = "products/";
      if (file.fieldname.includes("variant")) {
        prefix = "variants/";
      } else if (file.fieldname === "cadFile") {
        prefix = "cad/";
      }

      cb(null, prefix + uniqueFileName);
    },
    metadata: (req, file, cb) => {
      // Store original filename and upload time in metadata
      cb(null, {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
        fieldName: file.fieldname,
      });
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 100, // Maximum total files
  },
  fileFilter: fileFilter,
});

// Enhanced error handling middleware
upload.errorHandler = (err, req, res, next) => {
  if (err) {
    console.error("Upload Error:", {
      error: err.message,
      stack: err.stack,
      field: err.field,
      code: err.code,
    });

    let status = 400;
    let message = err.message;

    if (err instanceof multer.MulterError) {
      switch (err.code) {
        case "LIMIT_FILE_SIZE":
          message = "File size exceeds 10MB limit";
          break;
        case "LIMIT_FILE_COUNT":
          message = "Too many files uploaded";
          break;
        case "LIMIT_UNEXPECTED_FILE":
          message = `Unexpected file field: ${err.field}`;
          break;
        case "LIMIT_FIELD_KEY":
          message = "Field name too long";
          break;
        default:
          message = `File upload error: ${err.code}`;
      }
    }

    return res.status(status).json({
      success: false,
      error: message,
      details: {
        field: err.field,
        code: err.code,
      },
    });
  }
  next();
};

module.exports = upload;
