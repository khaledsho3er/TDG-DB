const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
require("dotenv").config();

// Cloudflare R2 Configuration
const s3 = new S3Client({
  region: "auto", // Cloudflare R2 uses 'auto' for region
  endpoint: "https://a29dbeb11704750c5e1d4b4544ae5595.r2.cloudflarestorage.com", // Replace with your actual R2 endpoint
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

// Multer S3 Storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "images", // Replace with your Cloudflare R2 bucket name
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read", // or "private" if you want private files
    key: (req, file, cb) => {
      const fileName = file.originalname.replace(/\s+/g, "-");
      cb(null, `${Date.now()}-${fileName}`);
    },
  }),
});

module.exports = upload;
