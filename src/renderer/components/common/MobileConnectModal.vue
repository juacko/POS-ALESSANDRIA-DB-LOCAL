<template>
  <Modal
    :is-open="isOpen"
    title="Conectar Celular o Tablet (Comandera Móvil)"
    max-width="md"
    @close="$emit('close')"
  >
    <template #icon>
      <Smartphone class="w-5 h-5 text-indigo-600" />
    </template>

    <div class="space-y-4 text-center">
      <!-- Selector y Refresco de Red IP -->
      <div class="bg-slate-100/90 p-3 rounded-2xl border border-slate-200 text-left space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Wifi class="w-3.5 h-3.5 text-indigo-600" />
            <span>Red o Adaptador de Conexión:</span>
          </label>
          <button
            @click="refreshNetworkInfo"
            :disabled="isRefreshing"
            class="px-2 py-1 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs"
            title="Volver a consultar las interfaces de red de la PC"
          >
            <RefreshCw class="w-3 h-3 text-indigo-600" :class="{ 'animate-spin': isRefreshing }" />
            <span>Actualizar Red</span>
          </button>
        </div>

        <!-- Desplegable de Adaptadores Detectados -->
        <div v-if="!isManualIpMode" class="relative">
          <select
            v-model="selectedIp"
            @change="handleIpChange"
            class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer truncate"
          >
            <option
              v-for="net in networkInterfaces"
              :key="net.ip"
              :value="net.ip"
            >
              {{ net.name }} — {{ net.ip }} {{ net.isDefault ? '⭐ (Recomendado)' : '' }}
            </option>
          </select>
        </div>

        <!-- Campo Manual de IP -->
        <div v-else class="flex items-center gap-2">
          <input
            v-model="manualIpInput"
            @input="handleManualIpInput"
            type="text"
            placeholder="Ej: 192.168.1.50"
            class="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>

        <!-- Alternar entre selector automático y manual -->
        <div class="flex justify-between items-center text-[10px] pt-0.5">
          <span class="text-slate-400">
            {{ isManualIpMode ? 'Ingresando dirección personalizada' : 'Detección automática de adaptadores físicos' }}
          </span>
          <button
            @click="toggleManualMode"
            class="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
          >
            {{ isManualIpMode ? 'Usar lista detectada' : 'Ingresar IP manual' }}
          </button>
        </div>
      </div>

      <!-- Tarjeta de Código QR y Enlace -->
      <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200">
        <p class="text-xs text-slate-600 font-medium leading-relaxed">
          Escanea este código QR con la cámara de tu celular o tablet para abrir la comandera:
        </p>

        <!-- Canvas Código QR -->
        <div class="my-3 flex justify-center">
          <div class="p-3 bg-white rounded-2xl shadow-md border border-slate-200 inline-block relative">
            <canvas ref="qrCanvas"></canvas>
            <div
              v-if="isRefreshing"
              class="absolute inset-0 bg-white/80 backdrop-blur-xs rounded-2xl flex items-center justify-center"
            >
              <RefreshCw class="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          </div>
        </div>

        <!-- Enlace Directo con botón de copiar -->
        <div class="space-y-1.5">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">O escribe esta URL en el navegador móvil:</span>
          <div class="flex items-center gap-2">
            <div class="flex-1 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-950 font-black font-heading text-sm select-all truncate text-center">
              {{ serverUrl || 'Calculando dirección...' }}
            </div>
            <button
              @click="copyUrl"
              class="px-3 py-2 rounded-xl border text-xs font-bold transition-all shrink-0 flex items-center gap-1"
              :class="copied
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'"
            >
              <Check v-if="copied" class="w-3.5 h-3.5" />
              <Copy v-else class="w-3.5 h-3.5" />
              <span>{{ copied ? '¡Copiado!' : 'Copiar' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Indicaciones y Diagnóstico de Red -->
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5 text-left text-xs text-amber-900">
        <Wifi class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div class="space-y-1">
          <p class="font-bold leading-tight">Requisitos de conexión:</p>
          <ul class="text-[11px] text-amber-800 list-disc list-inside space-y-0.5">
            <li>El celular debe estar conectado al <strong>mismo Wi-Fi</strong> o punto de acceso.</li>
            <li>Si el celular no carga la página, asegúrate de que el <strong>Firewall de Windows</strong> permita el puerto 3000 en Red Privada.</li>
          </ul>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        @click="$emit('close')"
        class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all font-heading"
      >
        LISTO, ENTENDIDO
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import QRCode from 'qrcode'
import { api } from '@/api'
import Modal from '@/components/common/Modal.vue'
import { Smartphone, Wifi, RefreshCw, Copy, Check } from 'lucide-vue-next'
import { NetworkInterfaceItem } from '../../../preload/api'

const props = defineProps<{
  isOpen: boolean
}>()

defineEmits(['close'])

const port = ref(3000)
const selectedIp = ref('')
const serverUrl = ref('')
const networkInterfaces = ref<NetworkInterfaceItem[]>([])
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const isRefreshing = ref(false)
const copied = ref(false)
const isManualIpMode = ref(false)
const manualIpInput = ref('')

watch(() => props.isOpen, async (open) => {
  if (open) {
    await refreshNetworkInfo()
  }
})

async function refreshNetworkInfo() {
  isRefreshing.value = true
  try {
    const info = await api.getNetworkInfo()
    port.value = info.port || 3000
    networkInterfaces.value = info.interfaces || []

    // Si no había selección previa o no está en la lista, elegir la predeterminada
    if (!isManualIpMode.value) {
      const defaultIf = networkInterfaces.value.find(n => n.isDefault) || networkInterfaces.value[0]
      selectedIp.value = defaultIf ? defaultIf.ip : (info.ip || '127.0.0.1')
      updateUrlAndQR(selectedIp.value)
    } else if (manualIpInput.value) {
      updateUrlAndQR(manualIpInput.value)
    }
  } catch (e) {
    console.error('Error consultando información de red:', e)
  } finally {
    isRefreshing.value = false
  }
}

function handleIpChange() {
  updateUrlAndQR(selectedIp.value)
}

function handleManualIpInput() {
  const ip = manualIpInput.value.trim()
  if (ip) {
    updateUrlAndQR(ip)
  }
}

function toggleManualMode() {
  isManualIpMode.value = !isManualIpMode.value
  if (isManualIpMode.value) {
    manualIpInput.value = selectedIp.value
    updateUrlAndQR(manualIpInput.value)
  } else {
    const defaultIf = networkInterfaces.value.find(n => n.isDefault) || networkInterfaces.value[0]
    selectedIp.value = defaultIf ? defaultIf.ip : '127.0.0.1'
    updateUrlAndQR(selectedIp.value)
  }
}

async function updateUrlAndQR(ip: string) {
  serverUrl.value = `http://${ip}:${port.value}`
  await nextTick()
  if (qrCanvas.value && serverUrl.value) {
    try {
      await QRCode.toCanvas(qrCanvas.value, serverUrl.value, {
        width: 190,
        margin: 1,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff'
        }
      })
    } catch (err) {
      console.error('Error generando QR canvas:', err)
    }
  }
}

async function copyUrl() {
  if (!serverUrl.value) return
  try {
    await navigator.clipboard.writeText(serverUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Fallback de copiado
    const input = document.createElement('input')
    input.value = serverUrl.value
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}
</script>
