import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) {
    return '';
  }
  let cleanedPhone = phone.toString().trim().replace(/^\+/, '');

  if (cleanedPhone.startsWith('965')) {
    return `+${cleanedPhone}`;
  }

  return `+965${cleanedPhone}`;
}
