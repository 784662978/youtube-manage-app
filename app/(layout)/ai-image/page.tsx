"use client"

import { AiImageProvider } from "@/components/ai-image/ai-image-provider"
import { AiImagePage } from "@/components/ai-image/ai-image-page"

export default function AiImageRoutePage() {
  return (
    <AiImageProvider>
      <AiImagePage />
    </AiImageProvider>
  )
}
