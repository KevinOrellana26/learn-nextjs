import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

//inicializamos NextAuth.js con el objeto authConfig y exportando la propiedad auth.
export default NextAuth(authConfig).auth;

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}