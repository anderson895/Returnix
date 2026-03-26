import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImage(
  file: string,
  folder: string = 'lost-found'
): Promise<string> {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: 'image',
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  })
  return result.secure_url
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

export default cloudinary
