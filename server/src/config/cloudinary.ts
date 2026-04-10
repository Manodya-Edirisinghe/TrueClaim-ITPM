import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const CLOUD_NAME = process.env.CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.API_KEY ?? process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.API_SECRET ?? process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  throw new Error(
    'Missing Cloudinary environment variables. Set CLOUD_NAME/API_KEY/API_SECRET (or legacy CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET).'
  );
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true,
});

export default cloudinary;