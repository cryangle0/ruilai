export const REGIONS = [
  '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '广西', '海南',
  '重庆', '四川', '贵州', '云南', '西藏',
  '陕西', '甘肃', '青海', '宁夏', '新疆',
  '香港', '澳门', '台湾',
] as const

export const BAND_SIZES = ['SS', 'S', 'M', 'L', 'LL'] as const

export const BELTS = ['腰带SS', '腰带S', '腰带M', '腰带L', '腰带LL'] as const

export const PO_STATUS: Record<string, string> = {
  pending: '待处理',
  cosigning: '会签中',
  approved: '已完成',
  rejected: '已驳回',
}

export const SO_STATUS: Record<string, string> = {
  pending: '待出货',
  scanning: '扫码中',
  done: '已完成',
}

export const RT_STATUS: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  done: '已处理',
  rejected: '已驳回',
}

export const SN_STATUS: Record<string, string> = {
  warehouse: '原厂仓',
  l1: '一级在库',
  l2: '二级在库',
  bound: '已激活',
}

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: '平台',
  L1: '一级代理',
  L2: '二级代理',
  SUB: '子账号',
}

export function greetingText() {
  const h = new Date().getHours()
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

export function ruilaiShareMessage() {
  return {
    title: '锐涞经销商',
    path: '/pages/home/index',
    imageUrl: '/static/logo/share.png',
  }
}
