import { useEffect, useState } from "react";
import { httpClient } from "../api/httpClient";

const OWN_API_IMAGE_ROUTE = /^\/api\/companies\/[^/]+\/catalog\/products\/[^/]+\/image$/;

// The product image endpoint requires authentication like every other catalog route, so a plain
// <img src="..."> cannot reach it directly (browsers never attach custom auth headers to <img>
// requests). For that one case (a SelfHosted-uploaded image, recognized by its own served path)
// this fetches the bytes through the authenticated httpClient and exposes a local object URL --
// mirroring how registration document downloads already work. Any other src (an external URL
// pasted in Cloud mode, or a static asset path) passes through unchanged, exactly as before.
export function useResolvedImageSrc(src: string | null | undefined) {
  const needsAuth = Boolean(src) && OWN_API_IMAGE_ROUTE.test(src as string);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(needsAuth ? null : (src ?? null));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);

    if (!needsAuth) {
      setResolvedSrc(src ?? null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    httpClient
      .get(src as string, { responseType: "blob" })
      .then((response) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(response.data as Blob);
        setResolvedSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, needsAuth]);

  return { src: resolvedSrc, failed };
}
