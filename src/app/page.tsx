import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/session";
import { DEVICE_COOKIE, SHOP_COOKIE } from "@/lib/cookies";

export default async function Home() {
  const { user } = await getUser();
  const store = await cookies();
  if (!user) redirect(store.get(DEVICE_COOKIE) ? "/kassa-kirish" : "/kirish");
  redirect(store.get(SHOP_COOKIE) ? "/bosh" : "/dokon-tanlash");
}
