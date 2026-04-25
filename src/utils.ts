import type { MeasurementValues, Order } from './types';

export const todayIso = (): string => new Date().toISOString().slice(0, 10);

export const daysUntil = (date: string): number => {
  const now = new Date();
  const target = new Date(`${date}T23:59:59`);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const countdownTone = (days: number): 'green' | 'yellow' | 'red' => {
  if (days >= 4) return 'green';
  if (days >= 1) return 'yellow';
  return 'red';
};

export const sortByDeadline = (orders: Order[]): Order[] =>
  [...orders].sort((a, b) => a.pickupDate.localeCompare(b.pickupDate));

export const compressImage = (file: File, maxWidth = 1280, quality = 0.7): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error('Could not read image file'));

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => reject(new Error('Could not load selected image'));

    reader.readAsDataURL(file);
  });

export const formatStatus = (status: string): string =>
  status.charAt(0).toUpperCase() + status.slice(1);

export const countFilledMeasurements = (measurements: MeasurementValues): number =>
  Object.values(measurements).filter((value) => value.trim() !== '').length;

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
