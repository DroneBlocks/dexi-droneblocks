import { ref, computed } from 'vue'
import ROSLIB from 'roslib'

export type DexiPlatform = 'ark_cm4' | 'cm5' | 'pi5' | 'unity_sim' | 'jetson' | 'unknown'

const isDevMode = process.env.NODE_ENV === 'development'

const platform = ref<DexiPlatform>(isDevMode ? 'unity_sim' : 'unknown')
const keyboardControlEnabled = ref(isDevMode)
const paramsLoaded = ref(false)

const isSim = computed(() => platform.value === 'unity_sim')
const isHardware = computed(() => platform.value !== 'unknown' && !isSim.value)

const queryParam = (ros: ROSLIB.Ros, name: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const param = new ROSLIB.Param({ ros, name })
    param.get(
      (value) => resolve(value),
      (error) => reject(error)
    )
  })
}

const loadPlatformParams = async (ros: ROSLIB.Ros) => {
  try {
    const [platformValue, keyboardValue] = await Promise.allSettled([
      queryParam(ros, '/dexi_platform_params:dexi_platform'),
      queryParam(ros, '/dexi_platform_params:dexi_keyboard_control'),
    ])

    if (platformValue.status === 'fulfilled' && platformValue.value) {
      platform.value = platformValue.value as DexiPlatform
      console.log(`DEXI platform: ${platform.value}`)
    }

    if (keyboardValue.status === 'fulfilled') {
      // Handle string 'true'/'false' from launch args as well as boolean
      const val = keyboardValue.value
      keyboardControlEnabled.value = val === true || val === 'true' || val === 'True'
      console.log(`DEXI keyboard control: ${keyboardControlEnabled.value}`)
    }
  } catch (error) {
    console.warn('Failed to load DEXI platform params:', error)
  } finally {
    paramsLoaded.value = true
  }
}

export const useDexiPlatform = () => {
  return {
    platform,
    keyboardControlEnabled,
    paramsLoaded,
    isSim,
    isHardware,
    loadPlatformParams,
  }
}
