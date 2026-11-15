function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Muhit o‘zgaruvchisi topilmadi: ${name}. .env.example faylini ko‘ring.`);
  }
  return value;
}

/** Brauzer ham ko‘rishi mumkin bo‘lgan qiymatlar. */
export const publicEnv = {
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  },
};
