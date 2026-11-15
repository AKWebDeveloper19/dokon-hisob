export const SHOP_COOKIE = "dh_shop";
export const DEVICE_COOKIE = "dh_device";
export const LOCK_COOKIE = "dh_lock";

const secure = process.env.NODE_ENV === "production";

export const shopCookieOptions = {
  httpOnly: true,
  secure,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

/** Qurilma tokeni: brauzerlar maksimal 400 kun saqlaydi. */
export const deviceCookieOptions = {
  httpOnly: true,
  secure,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 400,
};

export const lockCookieOptions = {
  httpOnly: true,
  secure,
  sameSite: "lax" as const,
  path: "/",
};
