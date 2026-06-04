import { redirect } from 'next/navigation'

export default function Home() {
  // Serve the real BizBoost design app (verbatim, 1:1) from /public/studio
  redirect('/studio/index.html')
}
