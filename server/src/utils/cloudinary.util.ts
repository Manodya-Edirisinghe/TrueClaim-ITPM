import { UploadApiResponse } from 'cloudinary';
import cloudinary from '../config/cloudinary';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

export async function uploadImageToCloudinary(
  buffer: Buffer,
  folder = 'lost-and-found'
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          return reject(error ?? new Error('Cloudinary upload failed'));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}