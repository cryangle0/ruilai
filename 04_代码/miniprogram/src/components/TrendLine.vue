<template>
  <view class="trend">
    <view v-if="!labels.length" class="empty">暂无趋势</view>
    <canvas
      v-else
      canvas-id="homeTrend"
      id="homeTrend"
      class="cv"
      :style="{ width: w + 'px', height: h + 'px' }"
    />
    <view v-if="labels.length" class="leg">
      <view class="item"><view class="dot p" /><text>采购</text></view>
      <view class="item"><view class="dot s" /><text>销售</text></view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  labels?: Array<string | number>
  purchase?: Array<number | string>
  sales?: Array<number | string>
}>(), {
  labels: () => [],
  purchase: () => [],
  sales: () => [],
})

const instance = getCurrentInstance()
const w = ref(300)
const h = ref(168)

function nums(list: Array<number | string> | undefined) {
  return (list || []).map((v) => Number(v) || 0)
}

function paint() {
  const labels = (props.labels || []).map(String)
  if (!labels.length) return
  const purchase = nums(props.purchase)
  const sales = nums(props.sales)
  const W = w.value
  const H = h.value
  const ctx = uni.createCanvasContext('homeTrend', instance?.proxy as any)
  ctx.clearRect(0, 0, W, H)
  const pad = { l: 32, r: 10, t: 14, b: 26 }
  const iw = Math.max(1, W - pad.l - pad.r)
  const ih = Math.max(1, H - pad.t - pad.b)
  const maxV = Math.max(1, ...purchase, ...sales)
  const n = Math.max(1, labels.length - 1)
  const xAt = (i: number) => pad.l + (labels.length <= 1 ? iw / 2 : (i / n) * iw)
  const yAt = (v: number) => pad.t + ih - (v / maxV) * ih

  ;[0, 0.5, 1].forEach((t) => {
    const y = yAt(maxV * t)
    ctx.setStrokeStyle('#e7eeec')
    ctx.setLineWidth(1)
    ctx.beginPath()
    ctx.moveTo(pad.l, y)
    ctx.lineTo(W - pad.r, y)
    ctx.stroke()
    ctx.setFillStyle('#94a3b8')
    ctx.setFontSize(10)
    ctx.setTextAlign('right')
    ctx.fillText(String(Math.round(maxV * t)), pad.l - 6, y + 3)
  })

  function drawSeries(values: number[], stroke: string, fill: string) {
    if (!values.length) return
    ctx.beginPath()
    ctx.moveTo(xAt(0), pad.t + ih)
    values.forEach((v, i) => ctx.lineTo(xAt(i), yAt(v)))
    ctx.lineTo(xAt(values.length - 1), pad.t + ih)
    ctx.closePath()
    ctx.setFillStyle(fill)
    ctx.fill()
    ctx.beginPath()
    values.forEach((v, i) => {
      if (i === 0) ctx.moveTo(xAt(i), yAt(v))
      else ctx.lineTo(xAt(i), yAt(v))
    })
    ctx.setStrokeStyle(stroke)
    ctx.setLineWidth(2)
    ctx.setLineJoin('round')
    ctx.setLineCap('round')
    ctx.stroke()
    values.forEach((v, i) => {
      ctx.beginPath()
      ctx.arc(xAt(i), yAt(v), 3, 0, Math.PI * 2)
      ctx.setFillStyle(stroke)
      ctx.fill()
    })
  }

  drawSeries(purchase, '#1A68D7', 'rgba(26,104,215,0.16)')
  drawSeries(sales, '#F5A623', 'rgba(245,166,35,0.14)')

  const step = labels.length > 8 ? Math.ceil(labels.length / 6) : 1
  ctx.setFillStyle('#94a3b8')
  ctx.setFontSize(10)
  ctx.setTextAlign('center')
  labels.forEach((lb, i) => {
    if (i % step === 0 || i === labels.length - 1) {
      ctx.fillText(lb, xAt(i), H - 8)
    }
  })
  ctx.draw()
}

function layout() {
  nextTick(() => {
    const q = uni.createSelectorQuery()
    if (instance?.proxy) q.in(instance.proxy as any)
    q.select('.trend').boundingClientRect((rect: any) => {
      if (rect?.width) w.value = Math.max(200, Math.floor(rect.width))
      nextTick(paint)
    }).exec()
  })
}

onMounted(layout)
watch(
  () => [props.labels, props.purchase, props.sales],
  () => layout(),
  { deep: true },
)
</script>
<style scoped lang="scss">
.trend { width: 100%; }
.cv { width: 100%; height: 336rpx; display: block; }
.empty { text-align: center; color: #8e8e93; font-size: 24rpx; padding: 48rpx 0; }
.leg { display: flex; justify-content: center; gap: 36rpx; margin-top: 8rpx; }
.item { display: flex; align-items: center; gap: 10rpx; font-size: 22rpx; color: #636366; }
.dot { width: 14rpx; height: 14rpx; border-radius: 50%; }
.dot.p { background: #1A68D7; }
.dot.s { background: #F5A623; }
</style>
