const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config();

// ✅ Cloudflare R2 Configuration
const s3 = new S3Client({
  region: "auto",
  endpoint: "https://a29dbeb11704750c5e1d4b4544ae5595.r2.cloudflarestorage.com", // Replace with your actual endpoint
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

// ✅ Multer Setup with S3-Compatible R2 Storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "concepts", // your R2 bucket name
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    key: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
});

module.exports = upload;
