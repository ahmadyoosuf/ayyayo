"use client"

import { useEffect, useRef } from "react"
import { IconBolt } from "@/components/icons"

export function ArtifactFrame({
  html,
  building,
  title,
}: {
  html: string
  building?: boolean
  title?: string
}) {
  const ref = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const frame = ref.current
    if (!frame) return
    // srcdoc swap gives an instant live render of the kid's creation
    frame.srcdoc = html
  }, [html])

  return (
    <div className="artifact-stage">
      <iframe
        ref={ref}
        title={title || "Your creation"}
        className="artifact-iframe"
        sandbox="allow-scripts allow-pointer-lock allow-downloads"
      />
      {building && !html ? (
        <div className="artifact-loading" aria-live="polite">
          <div className="artifact-spinner" aria-hidden="true" />
          <span>building it...</span>
        </div>
      ) : null}
      {building && html ? (
        <div className="artifact-building" aria-live="polite">
          <IconBolt size={18} className="breathe" />
          <span>building...</span>
        </div>
      ) : null}
    </div>
  )
}
