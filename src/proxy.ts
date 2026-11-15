import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/kirish", "/royxatdan-otish", "/kassa-kirish"];

/** Supabase sessiyasini yangilaydi va tizimga kirmaganlarni kirish sahifasiga yuboradi. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  if (!data.user && !isPublic) {
    const url = request.nextUrl.clone();
    // Kassa qurilmasida sessiya tugasa, PIN ekraniga qaytamiz.
    url.pathname = request.cookies.get("dh_device") ? "/kassa-kirish" : "/kirish";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|woff2?)$).*)"],
};
