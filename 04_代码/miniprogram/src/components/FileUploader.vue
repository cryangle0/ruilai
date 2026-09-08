<template>
  <view class="file-uploader">
    <view v-if="label" class="file-uploader__head">
      <text class="file-uploader__label">{{ label }}</text>
      <text class="file-uploader__count">{{ modelValue.length }}/{{ limit }}</text>
    </view>
    <view class="file-uploader__grid">
      <view v-for="(url, index) in modelValue" :key="url + index" class="file-uploader__item" @click="preview(index)">
        <image class="file-uploader__image" :src="url" mode="aspectFill" />
        <view v-if="!readonly" class="file-uploader__remove" @click.stop="remove(index)">×</view>
      </view>
      <view
        v-if="!readonly && modelValue.length < limit"
        class="file-uploader__add"
        :class="{ busy: uploading || disabled }"
        @click="choose"
      >
        <view v-if="uploading" class="file-uploader__spinner" />
        <text v-else class="file-uploader__plus">＋</text>
        <text>{{ uploading ? '上传中' : addText }}</text>
      </view>
    </view>
    <text v-if="hint || errorText" class="file-uploader__hint" :class="{ error: !!errorText }">
      {{ errorText || hint }}
    </text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { uploadFile } from '@/service/upload'

const props = withDefaults(defineProps<{
  modelValue?: string[]
  label?: string
  hint?: string
  addText?: string
  maxCount?: 1 | 2 | 3 | 4
  readonly?: boolean
  disabled?: boolean
}>(), {
  modelValue: () => [],
  addText: '上传图片',
  maxCount: 4,
  readonly: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [string[]]
  change: [string[]]
  'upload-start': []
  'upload-success': [string]
  'upload-error': [Error]
}>()

const uploading = ref(false)
const errorText = ref('')
const MAX_IMAGE_COUNT = 4
const limit = computed(() => Math.min(MAX_IMAGE_COUNT, Math.max(1, props.maxCount || MAX_IMAGE_COUNT)))

class FileChooseError extends Error {
  readonly code = 'FILE_CHOOSE_FAILED'

  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'FileChooseError'
  }
}

function isChooseImageCancelled(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : String((error as { errMsg?: string } | null)?.errMsg || error || '')
  return /(?:^|[:\s])cancel(?:led)?(?:$|[\s,])/i.test(message)
}

function update(urls: string[]) {
  emit('update:modelValue', urls)
  emit('change', urls)
}

async function choose() {
  if (props.readonly || props.disabled || uploading.value) return
  const remaining = limit.value - props.modelValue.length
  if (remaining <= 0) return
  try {
    const result = await uni.chooseImage({ count: remaining, sizeType: ['compressed'] })
    const paths = (result.tempFilePaths || []).slice(0, remaining)
    if (!paths.length) return
    uploading.value = true
    errorText.value = ''
    emit('upload-start')
    const urls = [...props.modelValue]
    for (const path of paths) {
      try {
        const url = await uploadFile(path)
        urls.push(url)
        update([...urls])
        emit('upload-success', url)
      } catch (error) {
        const uploadError = error instanceof Error ? error : new Error('上传失败')
        errorText.value = uploadError.message
        emit('upload-error', uploadError)
        uni.showToast({ title: uploadError.message, icon: 'none' })
        break
      }
    }
  } catch (error) {
    if (isChooseImageCancelled(error)) return
    const rawMessage = error instanceof Error
      ? error.message
      : String((error as { errMsg?: string } | null)?.errMsg || '')
    const chooseError = new FileChooseError(rawMessage || '无法选择图片，请检查相册权限后重试', error)
    errorText.value = chooseError.message
    emit('upload-error', chooseError)
    uni.showToast({ title: chooseError.message, icon: 'none' })
  } finally {
    uploading.value = false
  }
}

function preview(index: number) {
  uni.previewImage({ current: index, urls: props.modelValue })
}

function remove(index: number) {
  if (props.disabled || uploading.value) return
  update(props.modelValue.filter((_, itemIndex) => itemIndex !== index))
}
</script>

<style scoped lang="scss">
@import '@/styles/theme.scss';
.file-uploader { width: 100%; }
.file-uploader__head {
  margin-bottom: 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.file-uploader__label { color: $rl-text; font-size: $rl-font-sm; font-weight: 600; }
.file-uploader__count { color: $rl-text-3; font-size: $rl-font-xs; }
.file-uploader__grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.file-uploader__item,
.file-uploader__add {
  position: relative;
  width: 148rpx;
  height: 148rpx;
  border-radius: 14rpx;
  overflow: hidden;
}
.file-uploader__item { background: $rl-fill-soft; }
.file-uploader__image { width: 100%; height: 100%; }
.file-uploader__remove {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: rgba(27, 36, 48, .72);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  line-height: 1;
}
.file-uploader__add {
  border: 2rpx dashed $rl-border-strong;
  background: $rl-fill-upload;
  color: $rl-primary;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 20rpx;
}
.file-uploader__add.busy { color: $rl-text-placeholder; opacity: .65; }
.file-uploader__plus { font-size: 42rpx; font-weight: 300; line-height: 1; }
.file-uploader__spinner {
  width: 30rpx;
  height: 30rpx;
  border: 3rpx solid $rl-border;
  border-top-color: $rl-primary;
  border-radius: 50%;
  animation: uploader-spin .8s linear infinite;
}
.file-uploader__hint {
  display: block;
  margin-top: 10rpx;
  color: $rl-text-3;
  font-size: 20rpx;
  line-height: 1.4;
}
.file-uploader__hint.error { color: $rl-danger; }
@keyframes uploader-spin { to { transform: rotate(360deg); } }
</style>
