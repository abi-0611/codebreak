import { useLayoutEffect, useRef, type ReactNode } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, prefersLessMotion } from '@/lib/motion'
import { hold } from '@/lib/anchor'

type SmoothScrollProps = {
  children: ReactNode
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const instance = useRef<Lenis | null>(null)

  useLayoutEffect(() => {
    if (prefersLessMotion()) return

    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 1,
      autoRaf: false,
    })
    instance.current = lenis
    hold(lenis)

    const update = () => ScrollTrigger.update()
    lenis.on('scroll', update)

    // gsap.ticker reports seconds; Lenis wants milliseconds.
    const step = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(step)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.off('scroll', update)
      gsap.ticker.remove(step)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      instance.current = null
      hold(null)
    }
  }, [])

  return <>{children}</>
}
