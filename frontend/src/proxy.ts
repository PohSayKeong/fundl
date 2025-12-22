import { NextRequest, NextResponse } from "next/server";
import { getUserFromPrivy } from "@/lib/privy";

export async function proxy(req: NextRequest) {
    // Only enforce auth for POST requests; pass through others
    if (req.method !== "POST") {
        return NextResponse.next();
    }

    const idToken = req.headers.get("privy-id-token");
    if (!idToken) {
        return NextResponse.json(
            { error: "Missing Privy identity token." },
            { status: 401 }
        );
    }

    try {
        const privyUser = await getUserFromPrivy(idToken);
        if (!privyUser) {
            return NextResponse.json(
                { error: "Invalid Privy identity token." },
                { status: 401 }
            );
        }

        // Forward the verified user id to the route handlers
        const requestHeaders = new Headers(req.headers);
        if (privyUser.id) {
            requestHeaders.set("x-privy-user-id", privyUser.id);
        }

        return NextResponse.next({ request: { headers: requestHeaders } });
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        return NextResponse.json(
            { error: `Invalid Privy identity token. ${message}`.trim() },
            { status: 401 }
        );
    }
}

export const config = {
    // Apply proxy/auth to both collection and per-project API routes
    matcher: [
        "/projects/api", // matches /projects/api
        "/projects/:path*/api", // matches /projects/[id]/api and deeper nested paths
    ],
};
