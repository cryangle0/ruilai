<template>
  <view class="rl-page purchase-page">
    <NavBar :title="kind === 'sales' ? '提交销售单（购物车）' : '提交采购单（购物车）'" show-back />

    <view class="purchase-content">
        <view v-if="loading" class="state-card glass">
          <view class="state-line wide" />
          <view class="state-line" />
          <view class="state-line short" />
        </view>

        <view v-else-if="loadError" class="state-card glass error-state">
          <text class="state-title">商品加载失败</text>
          <text class="state-desc">{{ loadError }}</text>
          <button class="retry-btn" @click="loadProducts">重新加载</button>
        </view>

        <template v-else-if="selectedProduct">
          <view class="card product-card">
            <text class="field-label">商品名称</text>
            <picker :range="productNames" :value="productIndex" @change="onProductChange">
              <view class="field-box">
                <text>{{ selectedProduct.name }}</text>
                <text class="field-arrow">›</text>
              </view>
            </picker>
          </view>

          <view v-if="kind === 'sales'" class="card product-card">
            <text class="field-label">二级代理</text>
            <view class="field-box" @click="pickL2">
              <text>{{ l2Name || '请选择' }}</text>
              <text class="field-arrow">›</text>
            </view>
          </view>

          <view class="tipbox">{{ productTip }}</view>

          <view class="card">
            <view class="section-title">
              <text>{{ standardSectionTitle }}</text>
              <text class="section-count">（{{ standardRows.length }}）</text>
            </view>
            <view v-if="standardRows.length">
              <view v-for="row in standardRows" :key="row.key" class="qty-row">
                <text class="qty-name">{{ row.label }}</text>
                <view class="stepper">
                  <button
                    class="step-btn minus-btn"
                    :class="{ disabled: qtyOf(standardQty, row.key) === 0 }"
                    :disabled="qtyOf(standardQty, row.key) === 0"
                    @click="adjustStandard(row.key, -1)"
                  >−</button>
                  <input
                    class="step-num step-input"
                    type="number"
                    :value="qtyOf(standardQty, row.key)"
                    @input="setStandardQty(row.key, $event)"
                  />
                  <button class="step-btn plus-btn" @click="adjustStandard(row.key, 1)">＋</button>
                </view>
              </view>
              <view class="sum-row">{{ standardTotalLabel }} <text>{{ standardTotal }}</text> 件</view>
            </view>
            <view v-else class="empty-box">{{ selectedProduct.type === 'kit' ? '该商品尚未配置标准套件' : '该商品尚未维护规格' }}</view>
          </view>

          <view v-if="selectedProduct.type === 'kit'" class="card">
            <view class="section-title"><text>非标套件</text></view>
            <view v-if="customOptions.length" class="custom-form">
              <view class="custom-col">
                <text class="mini-label">{{ componentLabels.belt }}</text>
                <picker :range="customBeltLabels" :value="customBeltIndex" @change="onCustomBeltChange">
                  <view class="mini-box"><text>{{ customBeltLabels[customBeltIndex] }}</text><text class="mini-arrow">›</text></view>
                </picker>
              </view>
              <view class="custom-col">
                <text class="mini-label">{{ componentLabels.band }}</text>
                <picker :range="customBandOptions" range-key="size" :value="customBandIndex" @change="onCustomBandChange">
                  <view class="mini-box"><text>{{ currentCustomOption?.size || '—' }}</text><text class="mini-arrow">›</text></view>
                </picker>
              </view>
              <view class="custom-col qty-col">
                <text class="mini-label">数量</text>
                <input
                  class="mini-input"
                  :value="customQty"
                  type="number"
                  :adjust-position="true"
                  :hold-keyboard="true"
                  :always-embed="true"
                  :cursor-spacing="24"
                  data-echo="1"
                  @input="customQty = eventValue($event, customQty)"
                />
              </view>
              <view class="custom-add" @click="addCustomLine">+添加</view>
            </view>
            <view v-else class="empty-box">该商品没有可下单的非标组合</view>
            <text v-if="customOptions.length" class="custom-tip">非标仅展示「本商品已维护尺码」中排除标品后的组合，可多次添加。</text>
            <view v-if="customLines.length" class="added-list">
              <view v-for="(row, index) in customLines" :key="`${row.belt}-${row.size}`" class="added-row">
                <text>{{ row.belt }}+{{ componentLabels.band }}{{ row.size }} ×{{ row.qty }}</text>
                <button class="delete-btn" @click="removeCustomLine(index)">删除</button>
              </view>
            </view>
            <view v-else-if="customOptions.length" class="empty-box">暂无非标，点「+添加」</view>
            <view class="sum-row">非标套件总计 <text>{{ customTotal }}</text> 件</view>
          </view>

          <view v-if="selectedProduct.type === 'kit'" class="card bundle-card">
            <view class="section-title"><text>可随售单品</text></view>
            <text v-if="bundleRows.length" class="bundle-tip">按规格填写数量，将作为独立 SN 行随本采购单入库。</text>
            <view v-for="single in bundleRows" :key="single.id" class="bundle-group">
              <text class="bundle-name">{{ single.name }}</text>
              <view v-for="singleSize in single.sizes" :key="singleSize" class="qty-row">
                <text class="qty-name">{{ singleSize }}</text>
                <view class="stepper">
                  <button
                    class="step-btn minus-btn"
                    :class="{ disabled: bundleQtyOf(single.id, singleSize) === 0 }"
                    :disabled="bundleQtyOf(single.id, singleSize) === 0"
                    @click="adjustBundle(single.id, singleSize, -1)"
                  >−</button>
                  <input
                    class="step-num step-input"
                    type="number"
                    :value="bundleQtyOf(single.id, singleSize)"
                    @input="setBundleQty(single.id, singleSize, $event)"
                  />
                  <button class="step-btn plus-btn" @click="adjustBundle(single.id, singleSize, 1)">＋</button>
                </view>
              </view>
            </view>
            <view v-if="!bundleRows.length" class="empty-box">该套件暂无可随售单品</view>
            <view v-else class="sum-row">随售单品总计 <text>{{ bundleTotal }}</text> 件</view>
          </view>
        </template>

        <view v-else class="state-card glass error-state">
          <text class="state-title">暂无可下单商品</text>
          <text class="state-desc">请先在商品库上架套件、单品或配件。</text>
        </view>
      </view>

      <view class="purchase-footer">
        <view class="footer-btn cancel-btn" :class="{ disabled: submitting }" @click="cancel">取消</view>
        <view class="footer-btn submit-btn" :class="{ disabled: !canSubmit || submitting }" @click="kind === 'sales' ? submitSale() : submitPurchase()">
          {{ submitting ? '提交中' : (kind === 'sales'
            ? `创建并开始扫码${lineTotal ? `（${lineTotal}件）` : ''}`
            : `提交采购单${lineTotal ? `（${lineTotal}件）` : ''}`) }}
        </view>
      </view>
  </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import { useUserStore } from '@/store/user'
import { miniApi } from '@/service'
import { inputEventValue } from '@/utils/inputValue'
import {
  buildPurchasePayload,
  bundleProducts,
  componentNames,
  nonstandardOptions,
  normalizeQuantityInput,
  payloadTotal,
  productBelts,
  productSizes,
  standardOptions,
  type CustomLine,
} from './model'

const user = useUserStore()
const kind = ref('purchase')
const products = ref<any[]>([])
const l2s = ref<any[]>([])
const productId = ref('P1')
const l2Id = ref('')
const l2Name = ref('')
const loading = ref(true)
const loadError = ref('')
const submitting = ref(false)
const standardQty = ref<Record<string, number>>({})
const customLines = ref<CustomLine[]>([])
const customQty = ref('1')
const customBeltIndex = ref(0)
const customBandIndex = ref(0)
const bundleQty = ref<Record<string, Record<string, number>>>({})

const catalogProducts = computed(() => products.value.filter((p) => (
  kind.value === 'sales' ? ['kit', 'single'] : ['kit', 'single', 'part']
).includes(p.type)))
const productNames = computed(() => catalogProducts.value.map((p) => p.name))
const productIndex = computed(() => Math.max(0, catalogProducts.value.findIndex((p) => p.id === productId.value)))
const selectedProduct = computed(() => catalogProducts.value.find((p) => p.id === productId.value) || catalogProducts.value[0])
const standardRows = computed(() => selectedProduct.value ? standardOptions(selectedProduct.value) : [])
const customOptions = computed(() => selectedProduct.value ? nonstandardOptions(selectedProduct.value) : [])
const componentLabels = computed(() => selectedProduct.value ? componentNames(selectedProduct.value) : { belt: '腰带', band: '弹力带' })
const customBelts = computed(() => [...new Set(customOptions.value.map((row) => row.belt))])
const customBeltLabels = computed(() => customBelts.value.map((value) => beltDisplay(value)))
const customBandOptions = computed(() => customOptions.value.filter((row) => row.belt === customBelts.value[customBeltIndex.value]))
const currentCustomOption = computed(() => customBandOptions.value[customBandIndex.value])
const bundleRows = computed(() => {
  if (!selectedProduct.value) return []
  return bundleProducts(selectedProduct.value, products.value).map((product) => ({
    ...product,
    sizes: productSizes(product),
  }))
})
const purchasePayload = computed(() => selectedProduct.value
  ? buildPurchasePayload({
      product: selectedProduct.value,
      products: products.value,
      standardQty: standardQty.value,
      customLines: customLines.value,
      bundleQty: bundleQty.value,
    })
  : { lines: [], customLines: [], parts: [] })
const lineTotal = computed(() => payloadTotal(purchasePayload.value))
const standardTotal = computed(() => standardRows.value.reduce((sum, row) => sum + qtyOf(standardQty.value, row.key), 0))
const customTotal = computed(() => customLines.value.reduce((sum, row) => sum + (Number(row.qty) || 0), 0))
const bundleTotal = computed(() => bundleRows.value.reduce((total, product) =>
  total + product.sizes.reduce((sum: number, item: string) => sum + bundleQtyOf(product.id, item), 0), 0))
const canSubmit = computed(() => !loading.value && !submitting.value && Boolean(selectedProduct.value)
  && lineTotal.value > 0 && (kind.value !== 'sales' || Boolean(l2Id.value)))
const standardSectionTitle = computed(() => {
  if (selectedProduct.value?.type === 'part') return '配件规格'
  if (selectedProduct.value?.type === 'single') return '尺码数量'
  return '标准套件'
})
const standardTotalLabel = computed(() => selectedProduct.value?.type === 'kit' ? '标准套件总计' : '总计')
const productTip = computed(() => {
  const product = selectedProduct.value
  if (!product) return ''
  if (product.type === 'part') return `配件可单独下单（无 SN，不占号段）。当前规格：${productSizes(product).join('/') || '—'}`
  if (product.type === 'single') return `单品按尺码下单（有 SN）。当前可选尺码：${productSizes(product).join('/') || '—'}`
  const rows = standardRows.value
  const names = componentLabels.value
  const standardText = rows.length
    ? `标品${rows.length}档：${rows.map((row) => row.label).join('；')}。`
    : '尚未配置标品组合。'
  return `${standardText}其他组合请下非标。当前可选：${names.belt} ${productBelts(product).join('/')} · ${names.band} ${productSizes(product).join('/')}`
})

onLoad(async (q) => {
  if (!user.ensureRole(['L1'])) return
  kind.value = q?.kind === 'sales' ? 'sales' : 'purchase'
  await loadProducts()
  if (kind.value === 'sales') {
    l2s.value = (await miniApi.agentsL2({ pageSize: 50, auditStatus: 'approved' })).data.list || []
  }
})

async function loadProducts() {
  loading.value = true
  loadError.value = ''
  try {
    products.value = (await miniApi.products()).data || []
    const hit = catalogProducts.value.find((p) => p.id === productId.value) || catalogProducts.value[0]
    if (hit) productId.value = hit.id
    resetPurchaseDraft()
  } catch (error: any) {
    loadError.value = error?.message || '请检查网络后重试'
  } finally {
    loading.value = false
  }
}

function pickL2() {
  const names = l2s.value.map((a) => a.name)
  if (!names.length) { uni.showToast({ title: '暂无已通过二级', icon: 'none' }); return }
  uni.showActionSheet({ itemList: names, success: (r) => {
    l2Id.value = l2s.value[r.tapIndex].id
    l2Name.value = l2s.value[r.tapIndex].name
  } })
}

function resetPurchaseDraft() {
  standardQty.value = {}
  customLines.value = []
  customQty.value = '1'
  customBeltIndex.value = 0
  customBandIndex.value = 0
  bundleQty.value = {}
}

function onProductChange(event: any) {
  const selected = catalogProducts.value[Number(event.detail.value)]
  if (!selected || selected.id === productId.value) return
  productId.value = selected.id
  resetPurchaseDraft()
}

function qtyOf(source: Record<string, number>, key: string) {
  return Math.max(0, Number(source[key]) || 0)
}

function adjustStandard(key: string, delta: number) {
  standardQty.value[key] = Math.max(0, qtyOf(standardQty.value, key) + delta)
}

function setStandardQty(key: string, event: unknown) {
  standardQty.value[key] = normalizeQuantityInput(event)
}

function bundleQtyOf(product: string, itemSize: string) {
  return qtyOf(bundleQty.value[product] || {}, itemSize)
}

function adjustBundle(product: string, itemSize: string, delta: number) {
  if (!bundleQty.value[product]) bundleQty.value[product] = {}
  bundleQty.value[product][itemSize] = Math.max(0, bundleQtyOf(product, itemSize) + delta)
}

function setBundleQty(product: string, itemSize: string, event: unknown) {
  if (!bundleQty.value[product]) bundleQty.value[product] = {}
  bundleQty.value[product][itemSize] = normalizeQuantityInput(event)
}

function beltDisplay(value: string) {
  const grade = value.includes('S') ? '小' : value.includes('M') ? '中' : value.includes('L') ? '大' : ''
  return grade ? `${grade}（${value}）` : value
}

function onCustomBeltChange(event: any) {
  customBeltIndex.value = Number(event.detail.value)
  customBandIndex.value = 0
}

function onCustomBandChange(event: any) {
  customBandIndex.value = Number(event.detail.value)
}

function addCustomLine() {
  const option = currentCustomOption.value
  const count = Math.floor(Number(customQty.value) || 0)
  if (!option) { uni.showToast({ title: '暂无可选非标组合', icon: 'none' }); return }
  if (count <= 0) { uni.showToast({ title: '数量须大于 0', icon: 'none' }); return }
  const existing = customLines.value.find((row) => row.belt === option.belt && row.size === option.size)
  if (existing) existing.qty += count
  else customLines.value.push({ belt: option.belt, size: option.size, qty: count })
  customQty.value = '1'
  uni.showToast({ title: '已添加', icon: 'none' })
}

function removeCustomLine(index: number) {
  customLines.value.splice(index, 1)
}

function eventValue(e: unknown, fallback = '') { return inputEventValue(e, fallback) }

function cancel() {
  if (submitting.value) return
  uni.navigateBack()
}

async function submitSale() {
  if (submitting.value || !canSubmit.value) {
    if (!l2Id.value) uni.showToast({ title: '请选择二级', icon: 'none' })
    else if (!lineTotal.value) uni.showToast({ title: '请至少选择 1 件商品', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    const payload = purchasePayload.value
    const created = await miniApi.createSale({
      channel: 'distribute',
      l2Id: l2Id.value,
      lines: [...payload.lines, ...payload.customLines],
      planTotal: lineTotal.value,
    })
    const soId = (created.data as any)?.id
    uni.showToast({ title: '已创建销售单', icon: 'success' })
    setTimeout(() => {
      if (soId) uni.redirectTo({ url: `/pkg/scan/index?mode=ship&soId=${soId}` })
      else uni.navigateBack()
    }, 400)
  } finally {
    submitting.value = false
  }
}

async function submitPurchase() {
  if (submitting.value || !canSubmit.value) {
    if (!canSubmit.value) uni.showToast({ title: '请至少选择 1 件商品', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await miniApi.createPurchase(purchasePayload.value)
    uni.showToast({ title: '已提交采购', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } finally {
    submitting.value = false
  }
}
</script>
<style scoped>
.purchase-page { padding-bottom: calc(124rpx + env(safe-area-inset-bottom)); }
.purchase-content { padding: 22rpx 32rpx 30rpx; }
.card {
  background: #fff;
  border: 2rpx solid #E3E9F2;
  border-radius: 20rpx;
  padding: 22rpx 24rpx;
  box-shadow: 0 8rpx 22rpx rgba(22, 32, 64, 0.05);
  margin-bottom: 22rpx;
}
.product-card { padding-top: 20rpx; padding-bottom: 22rpx; }
.field-label, .mini-label {
  display: block;
  color: #9AA6BA;
  font-size: 20rpx;
  margin-bottom: 12rpx;
}
.field-box {
  height: 72rpx;
  border: 2rpx solid #D7E3F7;
  border-radius: 14rpx;
  background: #F5F9FF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22rpx;
  font-size: 25rpx;
  font-weight: 600;
  color: #1A2B4A;
}
.field-arrow, .mini-arrow { color: #B4BECD; font-size: 34rpx; font-weight: 400; }
.tipbox {
  background: #EFF6FE;
  border: 2rpx solid #CEE1FA;
  border-radius: 16rpx;
  padding: 20rpx 22rpx;
  font-size: 21rpx;
  color: #3E6FA8;
  line-height: 1.65;
  margin-bottom: 22rpx;
}
.section-title {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  font-weight: 700;
  color: #1A2B4A;
  margin-bottom: 10rpx;
}
.section-title::before {
  content: '';
  width: 8rpx;
  height: 26rpx;
  border-radius: 4rpx;
  margin-right: 10rpx;
  background: linear-gradient(180deg, #2B7BF0, #1A68D7);
}
.section-count { font-size: 20rpx; color: #9AA6BA; font-weight: 500; }
.qty-row {
  min-height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 12rpx 2rpx;
  border-bottom: 2rpx solid #F3F5F9;
}
.qty-name { flex: 1; min-width: 0; font-size: 23rpx; color: #1A2B4A; line-height: 1.45; }
.stepper { display: flex; align-items: center; flex-shrink: 0; }
.step-btn {
  width: 52rpx;
  height: 52rpx;
  min-height: 52rpx;
  margin: 0;
  padding: 0;
  border: 2rpx solid #D7E3F7;
  border-radius: 12rpx;
  background: #F5F9FF;
  color: #1A68D7;
  font-size: 29rpx;
  font-weight: 600;
  line-height: 48rpx;
}
.step-btn::after, .custom-add::after, .delete-btn::after, .footer-btn::after, .retry-btn::after { border: 0; }
.step-btn.disabled {
  color: #C4CBD8;
  background: #F7F8FB;
  border-color: #E6EAF2;
}
.step-num {
  width: 68rpx;
  height: 52rpx;
  text-align: center;
  font-size: 26rpx;
  font-weight: 700;
  color: #1A2B4A;
  font-variant-numeric: tabular-nums;
}
.step-input { padding: 0; line-height: 52rpx; }
.sum-row {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: 6rpx;
  margin-top: 10rpx;
  font-size: 21rpx;
  color: #9AA6BA;
}
.sum-row text { color: #1A2B4A; font-weight: 700; font-size: 24rpx; }
.custom-form { display: flex; align-items: flex-end; gap: 10rpx; margin: 16rpx 0; }
.custom-col { flex: 1; min-width: 0; }
.custom-col .mini-label { font-size: 19rpx; margin-bottom: 8rpx; }
.mini-box, .mini-input {
  width: 100%;
  height: 64rpx;
  border: 2rpx solid #E3E9F2;
  border-radius: 12rpx;
  background: #FBFCFE;
  color: #1A2B4A;
  font-size: 21rpx;
  font-weight: 600;
}
.mini-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12rpx;
  white-space: nowrap;
  overflow: hidden;
}
.mini-box text:first-child { overflow: hidden; text-overflow: ellipsis; }
.mini-input { text-align: center; padding: 0 8rpx; }
.qty-col { flex: .72; }
.custom-add {
  width: 116rpx;
  height: 64rpx;
  min-height: 64rpx;
  margin: 0;
  padding: 0;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #2B7BF0, #1A68D7);
  color: #fff;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 64rpx;
  text-align: center;
  box-shadow: 0 6rpx 14rpx rgba(26, 104, 215, 0.26);
}
.custom-tip, .bundle-tip {
  display: block;
  color: #9AA6BA;
  font-size: 19rpx;
  line-height: 1.55;
  background: #F7F9FC;
  border-radius: 12rpx;
  padding: 14rpx 16rpx;
  margin-bottom: 14rpx;
}
.empty-box {
  text-align: center;
  font-size: 21rpx;
  color: #B4BECD;
  background: #FBFCFE;
  border: 2rpx dashed #E3E9F2;
  border-radius: 14rpx;
  padding: 26rpx 12rpx;
  margin: 12rpx 0 8rpx;
}
.added-list { border-top: 2rpx solid #F3F5F9; }
.added-row {
  min-height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  border-bottom: 2rpx solid #F3F5F9;
  font-size: 21rpx;
  color: #1A2B4A;
}
.delete-btn {
  min-width: 82rpx;
  height: 48rpx;
  min-height: 48rpx;
  margin: 0;
  padding: 0 12rpx;
  color: #DE4B4B;
  background: #FCEBEB;
  border-radius: 10rpx;
  font-size: 19rpx;
  line-height: 48rpx;
}
.bundle-group + .bundle-group { margin-top: 18rpx; }
.bundle-name { display: block; font-size: 22rpx; font-weight: 700; color: #5B6472; padding: 8rpx 2rpx 0; }
.purchase-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
  display: flex;
  gap: 16rpx;
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 2rpx solid #EDF1F7;
}
.footer-btn {
  flex: 1;
  height: 84rpx;
  min-height: 84rpx;
  margin: 0;
  border-radius: 16rpx;
  font-size: 25rpx;
  font-weight: 600;
  line-height: 84rpx;
  text-align: center;
}
.cancel-btn { background: #F4F6FA; color: #5B6472; border: 2rpx solid #E3E9F2; }
.submit-btn {
  flex: 1.55;
  color: #fff;
  background: linear-gradient(135deg, #2B7BF0, #1A68D7);
  box-shadow: 0 8rpx 20rpx rgba(26, 104, 215, 0.32);
}
.submit-btn.disabled { opacity: .48; box-shadow: none; pointer-events: none; }
.cancel-btn.disabled { opacity: .48; pointer-events: none; }
.state-card {
  padding: 28rpx 24rpx;
  border-radius: 20rpx;
}
.state-line { height: 24rpx; width: 70%; margin: 18rpx 0; border-radius: 12rpx; background: #EEF2F7; }
.state-line.wide { width: 100%; height: 64rpx; }
.state-line.short { width: 45%; }
.error-state { text-align: center; }
.state-title { display: block; color: #1A2B4A; font-size: 26rpx; font-weight: 700; }
.state-desc { display: block; color: #9AA6BA; font-size: 21rpx; margin: 12rpx 0 20rpx; }
.retry-btn {
  width: 210rpx;
  height: 68rpx;
  min-height: 68rpx;
  margin: 0 auto;
  border-radius: 14rpx;
  background: #EAF2FD;
  color: #1A68D7;
  font-size: 22rpx;
  line-height: 68rpx;
}
</style>
