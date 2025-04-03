"use client"

import { useServerInsertedHTML } from "next/navigation"
import { CacheProvider } from "@emotion/react"
import createCache from "@emotion/cache"
import { useState } from "react"

export default function MUIRegistry({ children }) {
  const [cache] = useState(() => {
    const cache = createCache({ key: "mui" })
    cache.compat = true
    return cache
  })

  useServerInsertedHTML(() => {
    return (
      <style
        data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(" ")}`}
        dangerouslySetInnerHTML={{
          __html: Object.values(cache.inserted).join(" "),
        }}
      />
    )
  })

  return <CacheProvider value={cache}>{children}</CacheProvider>
}

