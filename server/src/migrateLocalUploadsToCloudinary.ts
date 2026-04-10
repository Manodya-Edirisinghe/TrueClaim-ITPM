import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cloudinary from './config/cloudinary';
import { Item } from './models/item.model';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/trueclaim';

async function main(): Promise<void> {
  const clearMissing = process.argv.includes('--clear-missing');
  await mongoose.connect(MONGO_URI);

  const items = await Item.find({ imageUrl: { $regex: '^/uploads/' } });
  console.log(`[migrate] Found ${items.length} item(s) with local /uploads URLs`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  let cleared = 0;

  for (const item of items) {
    const imageUrl = item.imageUrl;
    if (!imageUrl) {
      skipped += 1;
      continue;
    }

    const fileName = imageUrl.replace(/^\/uploads\//, '');
    const localPath = path.resolve(__dirname, '../uploads', fileName);

    if (!fs.existsSync(localPath)) {
      console.warn(`[migrate] Missing local file for item ${item._id}: ${localPath}`);
      if (clearMissing) {
        item.imageUrl = undefined;
        item.imagePublicId = undefined;
        await item.save();
        cleared += 1;
        console.log(`[migrate] Cleared stale local image reference for item ${item._id}`);
      }
      skipped += 1;
      continue;
    }

    try {
      const result = await cloudinary.uploader.upload(localPath, {
        folder: 'trueclaim/items',
        resource_type: 'image',
      });

      item.imageUrl = result.secure_url;
      item.imagePublicId = result.public_id;
      await item.save();

      migrated += 1;
      console.log(`[migrate] Migrated item ${item._id} -> ${result.public_id}`);
    } catch (error) {
      failed += 1;
      console.error(`[migrate] Failed item ${item._id}`, error);
    }
  }

  console.log(
    `[migrate] Done. migrated=${migrated} skipped=${skipped} cleared=${cleared} failed=${failed}`
  );
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('[migrate] Fatal error', error);
  await mongoose.disconnect();
  process.exit(1);
});
