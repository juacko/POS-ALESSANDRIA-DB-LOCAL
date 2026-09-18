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

    <div class="space-y-5 text-center">
      <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200">
        <p class="text-xs text-slate-600 font-medium leading-relaxed">
          Escanea el código QR con la cámara de tu smartphone o tablet para abrir la comandera de mesas.
        </p>

        <!-- Canvas Código QR -->
        <div class="my-4 flex justify-center">
          <div class="p-3 bg-white rounded-2xl shadow-md border border-slate-200 inline-block">
            <canvas ref="qrCanvas"></canvas>
          </div>
        </div>

        <!-- Enlace Directo -->
        <div class="space-y-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">O escribe esta URL en el navegador:</span>
          <div class="px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 font-black font-heading text-base select-all">
            {{ serverUrl || 'Obteniendo dirección local...' }}
          </div>
        </div>
      </div>

      <!-- Indicación de Red Wi-Fi -->
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3 text-left">
        <Wifi class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div class="text-xs text-amber-900">
          <span class="font-bold block">Importante: Misma Red Wi-Fi</span>
          El dispositivo móvil debe estar conectado a la misma red Wi-Fi que esta computadora principal para poder comunicarse.
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
import { Smartphone, Wifi } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
}>()

defineEmits(['close'])

const serverUrl = ref('')
const qrCanvas = ref<HTMLCanvasElement | null>(null)

watch(() => props.isOpen, async (open) => {
  if (open) {
    try {
      const info = await api.getNetworkInfo()
      serverUrl.value = info.url

      await nextTick()
      if (qrCanvas.value && serverUrl.value) {
        await QRCode.toCanvas(qrCanvas.value, serverUrl.value, {
          width: 190,
          margin: 1,
          color: {
            dark: '#1e1b4b',
            light: '#ffffff'
          }
        })
      }
    } catch (e) {
      console.error('Error al generar código QR', e)
    }
  }
})
</script>
