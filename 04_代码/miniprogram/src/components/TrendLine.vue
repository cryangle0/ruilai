<template>
  <view class="trend">
    <view v-if="!labels.length" class="empty">暂无趋势</view>
    <view v-else class="plot">
      <view class="grid">
        <view v-for="tick in ticks" :key="tick.t" class="grid-row" :style="{ top: tick.top + 'px' }">
          <text class="g-lab">{{ tick.label }}</text>
          <view class="g-line" />
        </view>
      </view>
      <view class="layer">
        <view v-for="(seg, i) in purchaseSegs" :key="'ps' + i" class="seg p" :style="seg" />
        <view v-for="(seg, i) in salesSegs" :key="'ss' + i" class="seg s" :style="seg" />
        <view v-for="(pt, i) in purchaseDots" :key="'pd' + i" class="dot p" :style="pt" />
        <view v-for="(pt, i) in salesDots" :key="'sd' + i" class="dot s" :style="pt" />
      </view>
      <view class="xlabels">
        <text v-for="(lb, i) in xLabels" :key="'x' + i" class="xlab" :style="lb.style">{{ lb.text }}</text>
      </view>
    </view>
    <view v-if="labels.length" class="leg">
      <view class="item"><view class="mark p" /><text>采购</text></view>
      <view class="item"><view class="mark s" /><text>销售</text></view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'

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
const pad = { l: 32, r: 10, t: 14, b: 26 }

function nums(list: Array<number | string> | undefined) {
  return (list || []).map((v) => Number(v) || 0)
}

const labels = computed(() => (props.labels || []).map(String))
const purchaseVals = computed(() => nums(props.purchase))
const salesVals = computed(() => nums(props.sales))
const maxV = computed(() => Math.max(1, ...purchaseVals.value, ...salesVals.value))

function xAt(i: number) {
  const iw = Math.max(1, w.value - pad.l - pad.r)
  const n = Math.max(1, labels.value.length - 1)
  return pad.l + (labels.value.length <= 1 ? iw / 2 : (i / n) * iw)
}
function yAt(v: number) {
  const ih = Math.max(1, h.value - pad.t - pad.b)
  return pad.t + ih - (v / maxV.value) * ih
}

const ticks = computed(() => [1, 0.5, 0].map((t) => ({
  t,
  top: yAt(maxV.value * t),
  label: String(Math.round(maxV.value * t)),
})))

function lineSegs(values: number[]) {
  const out: Array<Record<string, string>> = []
  for (let i = 0; i < values.length - 1; i++) {
    const x1 = xAt(i)
    const y1 = yAt(values[i])
    const x2 = xAt(i + 1)
    const y2 = yAt(values[i + 1])
    const dx = x2 - x1
    const dy = y2 - y1
    out.push({
      width: `${Math.hypot(dx, dy)}px`,
      left: `${x1}px`,
      top: `${y1}px`,
      transform: `rotate(${Math.atan2(dy, dx)}rad)`,
    })
  }
  return out
}

function dots(values: number[]) {
  return values.map((v, i) => ({
    left: `${xAt(i)}px`,
    top: `${yAt(v)}px`,
  }))
}

const purchaseSegs = computed(() => lineSegs(purchaseVals.value))
const salesSegs = computed(() => lineSegs(salesVals.value))
const purchaseDots = computed(() => dots(purchaseVals.value))
const salesDots = computed(() => dots(salesVals.value))
const xLabels = computed(() => {
  const step = labels.value.length > 8 ? Math.ceil(labels.value.length / 6) : 1
  return labels.value
    .map((text, i) => ({ text, i }))
    .filter(({ i }) => i % step === 0 || i === labels.value.length - 1)
    .map(({ text, i }) => ({
      text,
      style: { left: `${xAt(i)}px` },
    }))
})

function layout() {
  nextTick(() => {
    const q = uni.createSelectorQuery()
    if (instance?.proxy) q.in(instance.proxy as any)
    q.select('.plot').boundingClientRect((rect: any) => {
      if (rect?.width) w.value = Math.max(200, Math.floor(rect.width))
      if (rect?.height) h.value = Math.max(120, Math.floor(rect.height))
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
.plot {
  position: relative;
  width: 100%;
  height: 336rpx;
}
.grid { position: absolute; inset: 0; }
.grid-row {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  transform: translateY(-50%);
}
.g-lab {
  width: 56rpx;
  text-align: right;
  padding-right: 8rpx;
  color: #94a3b8;
  font-size: 20rpx;
  line-height: 1;
}
.g-line { flex: 1; height: 1px; background: #e7eeec; }
.layer { position: absolute; inset: 0; }
.seg {
  position: absolute;
  height: 4rpx;
  border-radius: 2rpx;
  transform-origin: left center;
}
.seg.p { background: #1A68D7; }
.seg.s { background: #F5A623; }
.dot {
  position: absolute;
  width: 10rpx;
  height: 10rpx;
  margin-left: -5rpx;
  margin-top: -5rpx;
  border-radius: 50%;
}
.dot.p { background: #1A68D7; }
.dot.s { background: #F5A623; }
.xlabels { position: absolute; left: 0; right: 0; bottom: 0; height: 28rpx; }
.xlab {
  position: absolute;
  transform: translateX(-50%);
  color: #94a3b8;
  font-size: 20rpx;
  line-height: 28rpx;
}
.empty { text-align: center; color: #8e8e93; font-size: 24rpx; padding: 48rpx 0; }
.leg { display: flex; justify-content: center; gap: 36rpx; margin-top: 8rpx; }
.item { display: flex; align-items: center; gap: 10rpx; font-size: 22rpx; color: #636366; }
.mark { width: 14rpx; height: 14rpx; border-radius: 50%; }
.mark.p { background: #1A68D7; }
.mark.s { background: #F5A623; }
</style>
