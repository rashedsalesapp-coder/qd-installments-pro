import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) {
    return '';
  }
  let cleanedPhone = phone.toString().trim();

  // If it already starts with '965' or '+965', it's valid.
  if (cleanedPhone.startsWith('965') || cleanedPhone.startsWith('+965')) {
    return cleanedPhone;
  }

  // If it starts with a plus, but not +965, it's ambiguous. For now, we'll assume it's an international number and leave it.
  // Or we could strip the plus and add 965. Let's strip it for consistency.
  if (cleanedPhone.startsWith('+')) {
     cleanedPhone = cleanedPhone.substring(1);
  }

  return `965${cleanedPhone}`;
}
