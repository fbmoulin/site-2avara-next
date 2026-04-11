"use client"

import { useEffect } from "react"

export function VLibrasInit() {
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js"
    script.async = true
    script.onload = () => {
      // @ts-expect-error — VLibras adds Widget to window
      if (window.VLibras?.Widget) {
        // @ts-expect-error — VLibras Widget constructor
        new window.VLibras.Widget("https://vlibras.gov.br/app")
      }
    }
    document.body.appendChild(script)
  }, [])

  return null
}
