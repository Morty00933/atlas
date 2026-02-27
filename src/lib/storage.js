import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from './constants';

export const compressImage = (file, maxWidth = 1200, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
          'image/webp',
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const uploadToStorage = async (file, folder = 'banners') => {
  const blob = await compressImage(file, folder === 'categories' ? 400 : 1200);
  const formData = new FormData();
  formData.append('file', blob, 'image.webp');
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', `atlas/${folder}`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || 'Cloudinary upload failed');
  return { url: data.secure_url, path: data.public_id };
};

export const deleteFromStorage = async (_path) => { /* no-op */ };

export const getImgSrc = (item) => item?.imageUrl || item?.image || '';
