import Approach from '@/sections/Approach'
import Ethos from '@/sections/Ethos'
import Routebook from '@/sections/Routebook'
import Ridge from '@/sections/Ridge'
import Safety from '@/sections/Safety'
import Logistics from '@/sections/Logistics'
import Permits from '@/sections/Permits'
import Journal from '@/sections/Journal'

/**
 * The scroll narrative, in order. Each scene owns its ground and its motion;
 * this file owns nothing but the sequence.
 *
 * The grounds cool as you descend and warm again at the bottom — pale sage,
 * cold sky, bone, near-black, bone, warm dark. That temperature arc is the
 * cinematic move and no animation is spent on it. Two scenes are pinned and
 * scrubbed, the hero and the ridge; everything in between is a calm block
 * that reveals once on enter and then stays put.
 */
export default function Home() {
  return (
    <>
      <Approach />
      <Ethos />
      <Routebook />
      <Ridge />
      <Safety />
      <Logistics />
      <Permits />
      <Journal />
    </>
  )
}
