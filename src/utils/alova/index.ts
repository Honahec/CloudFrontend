import { createAlova } from 'alova'
import VueHook from 'alova/vue'
import { axiosRequestAdapter } from '@alova/adapter-axios'
import axios, { type AxiosInstance } from 'axios'

// 1) 先创建 axios 实例
const axiosInst: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://0.0.0.0:8000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// 2) 再创建 alova 实例，并把 axios 实例交给 adapter
export const Alova = createAlova({
  baseURL: import.meta.env.VITE_API_BASE || 'http://0.0.0.0:8000',
  statesHook: VueHook,
  requestAdapter: axiosRequestAdapter({ axios: axiosInst }), // ← 传“实例”不是构造函数
  responded: {
    // axios 里数据在 resp.data（不是 resp.json()）
    onSuccess(resp) {
      const d = resp.data
      // 如果你的接口是 { code, msg, data } 这种，统一解包：
      if (d && typeof d === 'object' && 'code' in d) {
        if (d.code !== 0) throw new Error(d.msg || '接口错误')
        return d.data
      }
      return d
    },
    onError(err) {
      // 这里能拿到 AxiosError
      console.error('API error:', err)
      throw err
    },
  },
})
