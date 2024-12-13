"use client"

import { useEffect } from "react"
import { PGlite } from "@electric-sql/pglite"
import { live } from "@electric-sql/pglite/live"
import { PGliteProvider as PGliteProviderBase } from "@electric-sql/pglite-react"

const db = PGlite.create({
  database: 'playground',
  schema: {
    messages: {
      columns: ['id', 'role', 'content', 'annotations'],
    },
  },
})

export function PGliteProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('PGliteProvider')
  }, [])
  return <PGliteProviderBase>{children}</PGliteProviderBase>
}