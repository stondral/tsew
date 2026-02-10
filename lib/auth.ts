import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { cache } from "react";

/**
 * Memoized authentication check for Server Components.
 * Reduces redundant database calls during a single request.
 */
export const getServerSideUser = cache(async () => {
    const payload = await getPayload({ config });
    const requestHeaders = await headers();
    
    const { user } = await payload.auth({
        headers: requestHeaders,
    });

    return user;
});
