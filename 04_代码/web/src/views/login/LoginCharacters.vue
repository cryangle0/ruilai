<template>
  <div class="chars" aria-hidden="true">
    <div ref="tallRef" class="char char-tall" :style="tallStyle">
      <div class="eyes" :style="tallEyes">
        <EyeBall :size="18" :pupil-size="7" :max-distance="5" :blinking="tallBlink" :force-x="tallForceX" :force-y="tallForceY" />
        <EyeBall :size="18" :pupil-size="7" :max-distance="5" :blinking="tallBlink" :force-x="tallForceX" :force-y="tallForceY" />
      </div>
    </div>
    <div ref="midRef" class="char char-mid" :style="midStyle">
      <div class="eyes" :style="midEyes">
        <EyeBall :size="16" :pupil-size="6" :max-distance="4" :blinking="midBlink" :force-x="midForceX" :force-y="midForceY" />
        <EyeBall :size="16" :pupil-size="6" :max-distance="4" :blinking="midBlink" :force-x="midForceX" :force-y="midForceY" />
      </div>
    </div>
    <div ref="domeRef" class="char char-dome" :style="domeStyle">
      <div class="pupils" :style="domeEyes">
        <Pupil :size="12" :max-distance="5" :force-x="hideForceX" :force-y="hideForceY" />
        <Pupil :size="12" :max-distance="5" :force-x="hideForceX" :force-y="hideForceY" />
      </div>
    </div>
    <div ref="roundRef" class="char char-round" :style="roundStyle">
      <div class="pupils" :style="roundEyes">
        <Pupil :size="12" :max-distance="5" :force-x="hideForceX" :force-y="hideForceY" />
        <Pupil :size="12" :max-distance="5" :force-x="hideForceX" :force-y="hideForceY" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

const props = defineProps<{
  typing?: boolean
  passwordLen?: number
  showPassword?: boolean
}>()

const mouseX = ref(0)
const mouseY = ref(0)
const tallBlink = ref(false)
const midBlink = ref(false)
const lookingEachOther = ref(false)
const peeking = ref(false)
const tallRef = ref<HTMLElement | null>(null)
const midRef = ref<HTMLElement | null>(null)
const domeRef = ref<HTMLElement | null>(null)
const roundRef = ref<HTMLElement | null>(null)
const timers: number[] = []

const hiding = computed(() => (props.passwordLen || 0) > 0 && !props.showPassword)
const peekMode = computed(() => (props.passwordLen || 0) > 0 && !!props.showPassword)

function posOf(el: HTMLElement | null) {
  if (!el) return { faceX: 0, faceY: 0, bodySkew: 0 }
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 3
  const dx = mouseX.value - cx
  const dy = mouseY.value - cy
  return {
    faceX: Math.max(-15, Math.min(15, dx / 20)),
    faceY: Math.max(-10, Math.min(10, dy / 30)),
    bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
  }
}

const tallPos = computed(() => posOf(tallRef.value))
const midPos = computed(() => posOf(midRef.value))
const domePos = computed(() => posOf(domeRef.value))
const roundPos = computed(() => posOf(roundRef.value))

const hideForceX = computed(() => (peekMode.value ? -5 : undefined))
const hideForceY = computed(() => (peekMode.value ? -4 : undefined))
const tallForceX = computed(() => {
  if (peekMode.value) return peeking.value ? 4 : -4
  if (lookingEachOther.value) return 3
  return undefined
})
const tallForceY = computed(() => {
  if (peekMode.value) return peeking.value ? 5 : -4
  if (lookingEachOther.value) return 4
  return undefined
})
const midForceX = computed(() => {
  if (peekMode.value) return -4
  if (lookingEachOther.value) return 0
  return undefined
})
const midForceY = computed(() => {
  if (peekMode.value) return -4
  if (lookingEachOther.value) return -4
  return undefined
})

const tallStyle = computed(() => {
  const skew = tallPos.value.bodySkew
  let transform = `skewX(${skew}deg)`
  let height = '400px'
  if (peekMode.value) transform = 'skewX(0deg)'
  else if (props.typing || hiding.value) {
    transform = `skewX(${skew - 12}deg) translateX(40px)`
    height = '440px'
  }
  return { height, transform }
})
const midStyle = computed(() => {
  const skew = midPos.value.bodySkew
  let transform = `skewX(${skew}deg)`
  if (peekMode.value) transform = 'skewX(0deg)'
  else if (lookingEachOther.value) transform = `skewX(${skew * 1.5 + 10}deg) translateX(20px)`
  else if (props.typing || hiding.value) transform = `skewX(${skew * 1.5}deg)`
  return { transform }
})
const domeStyle = computed(() => ({
  transform: peekMode.value ? 'skewX(0deg)' : `skewX(${domePos.value.bodySkew}deg)`,
}))
const roundStyle = computed(() => ({
  transform: peekMode.value ? 'skewX(0deg)' : `skewX(${roundPos.value.bodySkew}deg)`,
}))

const tallEyes = computed(() => {
  if (peekMode.value) return { left: '20px', top: '35px' }
  if (lookingEachOther.value) return { left: '55px', top: '65px' }
  return { left: `${45 + tallPos.value.faceX}px`, top: `${40 + tallPos.value.faceY}px` }
})
const midEyes = computed(() => {
  if (peekMode.value) return { left: '10px', top: '28px' }
  if (lookingEachOther.value) return { left: '32px', top: '12px' }
  return { left: `${26 + midPos.value.faceX}px`, top: `${32 + midPos.value.faceY}px` }
})
const domeEyes = computed(() => {
  if (peekMode.value) return { left: '50px', top: '85px' }
  return { left: `${82 + domePos.value.faceX}px`, top: `${90 + domePos.value.faceY}px` }
})
const roundEyes = computed(() => {
  if (peekMode.value) return { left: '20px', top: '35px' }
  return { left: `${52 + roundPos.value.faceX}px`, top: `${40 + roundPos.value.faceY}px` }
})

function lookOffset(el: HTMLElement | null, maxDistance: number, forceX?: number, forceY?: number) {
  if (forceX != null && forceY != null) return { x: forceX, y: forceY }
  if (!el) return { x: 0, y: 0 }
  const r = el.getBoundingClientRect()
  const dx = mouseX.value - (r.left + r.width / 2)
  const dy = mouseY.value - (r.top + r.height / 2)
  const dist = Math.min(Math.hypot(dx, dy), maxDistance)
  const ang = Math.atan2(dy, dx)
  return { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist }
}

const EyeBall = defineComponent({
  name: 'EyeBall',
  props: {
    size: { type: Number, default: 48 },
    pupilSize: { type: Number, default: 16 },
    maxDistance: { type: Number, default: 10 },
    blinking: { type: Boolean, default: false },
    forceX: { type: Number, required: false },
    forceY: { type: Number, required: false },
  },
  setup(p) {
    const el = ref<HTMLElement | null>(null)
    return () => {
      const { x, y } = lookOffset(el.value, p.maxDistance, p.forceX, p.forceY)
      return h('div', {
        ref: el,
        class: 'eyeball',
        style: { width: `${p.size}px`, height: p.blinking ? '2px' : `${p.size}px` },
      }, p.blinking ? [] : [h('div', {
        class: 'pupil',
        style: { width: `${p.pupilSize}px`, height: `${p.pupilSize}px`, transform: `translate(${x}px, ${y}px)` },
      })])
    }
  },
})

const Pupil = defineComponent({
  name: 'PupilDot',
  props: {
    size: { type: Number, default: 12 },
    maxDistance: { type: Number, default: 5 },
    forceX: { type: Number, required: false },
    forceY: { type: Number, required: false },
  },
  setup(p) {
    const el = ref<HTMLElement | null>(null)
    return () => {
      const { x, y } = lookOffset(el.value, p.maxDistance, p.forceX, p.forceY)
      return h('div', {
        ref: el,
        class: 'pupil-only',
        style: { width: `${p.size}px`, height: `${p.size}px`, transform: `translate(${x}px, ${y}px)` },
      })
    }
  },
})

function scheduleBlink(flag: Ref<boolean>) {
  const wait = Math.random() * 4000 + 3000
  const t = window.setTimeout(() => {
    flag.value = true
    const t2 = window.setTimeout(() => {
      flag.value = false
      scheduleBlink(flag)
    }, 150)
    timers.push(t2)
  }, wait)
  timers.push(t)
}

function onMove(e: MouseEvent) {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
}

onMounted(() => {
  window.addEventListener('mousemove', onMove)
  scheduleBlink(tallBlink)
  scheduleBlink(midBlink)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', onMove)
  timers.forEach((t) => clearTimeout(t))
})

watch(() => props.typing, (v) => {
  if (v) {
    lookingEachOther.value = true
    const t = window.setTimeout(() => { lookingEachOther.value = false }, 800)
    timers.push(t)
  } else lookingEachOther.value = false
})
watch(peekMode, (on) => {
  peeking.value = false
  if (on) {
    const t = window.setTimeout(() => {
      peeking.value = true
      const t2 = window.setTimeout(() => { peeking.value = false }, 800)
      timers.push(t2)
    }, 2200)
    timers.push(t)
  }
})
</script>

<style scoped>
.chars { position: relative; width: 550px; height: 400px; }
.char {
  position: absolute;
  bottom: 0;
  transform-origin: bottom center;
  transition: transform .7s ease, height .7s ease;
}
.char-tall {
  left: 70px; width: 180px; height: 400px;
  background: #93C5FD; border-radius: 10px 10px 0 0; z-index: 1;
}
.char-mid {
  left: 240px; width: 120px; height: 310px;
  background: #1f2937; border-radius: 8px 8px 0 0; z-index: 2;
}
.char-dome {
  left: 0; width: 240px; height: 200px;
  background: #2B7BF0; border-radius: 120px 120px 0 0; z-index: 3;
}
.char-round {
  left: 310px; width: 140px; height: 230px;
  background: #F5A623; border-radius: 70px 70px 0 0; z-index: 4;
}
.eyes, .pupils {
  position: absolute; display: flex; gap: 24px;
  transition: left .7s ease, top .7s ease;
}
.pupils { gap: 24px; transition: left .2s ease, top .2s ease; }
:deep(.eyeball) {
  border-radius: 999px; background: #fff;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; transition: height .15s ease;
}
:deep(.pupil), :deep(.pupil-only) {
  border-radius: 999px; background: #2d2d2d;
  transition: transform .1s ease-out;
}
</style>
