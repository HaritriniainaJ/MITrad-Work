import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import NProgress from 'nprogress';

export async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
  NProgress.start();
  try {
    const result = await fn();
    return result;
  } finally {
    NProgress.done();
  }
}
