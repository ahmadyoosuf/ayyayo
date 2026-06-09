"use client"

import { useEffect, useRef } from "react"

export function ArtifactFrame({
  html,
  loading,
  title,
}: {
  html: string
  loading?: boolean
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
        sandbox="allow-scripts allow-pointer-lock"
      />
      {loading ? (
        <div className="artifact-loading" aria-live="polite">
          <div className="artifact-spinner" aria-hidden="true" />
          <span>making it better...</span>
        </div>
      ) : null}
    </div>
  )
}
