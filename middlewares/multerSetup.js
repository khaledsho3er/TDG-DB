// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = path.join(__dirname, "https://a29dbeb11704750c5e1d4b4544ae5595.r2.cloudflarestorage.com/images");
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const upload = multer({ storage });
// module.exports = upload;

const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
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

// Multer S3 Storage
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
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and CAD files
    if (file.fieldname === "images") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(
          new Error("Only image files are allowed for the images field"),
          false
        );
      }
    } else if (file.fieldname === "cadFile") {
      // Check file extension for CAD files
      const allowedExtensions = [".dwg", ".dxf", ".cad"];
      const fileExtension =
        "." + file.originalname.split(".").pop().toLowerCase();

      if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "Only CAD files (.dwg, .dxf, .cad) are allowed for the cadFile field"
          ),
          false
        );
      }
    } else {
      cb(new Error("Unexpected field"), false);
    }
  },
});

module.exports = upload;
