<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-200"
      @click.self="handleClose"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 flex flex-col select-none"
      >
        <!-- Encabezado con Icono -->
        <div class="flex items-start gap-3.5 mb-4">
          <div class="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 shadow-sm text-amber-600">
            <ShieldAlert class="w-6 h-6" />
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="text-base font-black text-slate-900 font-heading leading-tight">
              {{ title || 'Autorización Requerida' }}
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ actionDescription || 'Esta acción requiere el PIN de un Administrador para continuar.' }}
            </p>
          </div>

          <button
            @click="handleClose"
            class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Visualizador de Dígitos -->
        <div class="mb-5">
          <div class="flex justify-center items-center gap-2.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div
              v-for="i in 6"
              :key="i"
              class="w-3.5 h-3.5 rounded-full transition-all duration-150"
              :class="pin.length >= i ? 'bg-indigo-600 scale-110 shadow-xs' : 'bg-slate-200 border border-slate-300'"
            />
          </div>
          <p v-if="errorMessage" class="text-xs font-bold text-rose-600 text-center mt-2 animate-shake">
            {{ errorMessage }}
          </p>
        </div>

        <!-- Teclado Numérico Touch -->
        <div class="grid grid-cols-3 gap-2 sm:gap-2.5 mb-4">
          <button
            v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
            :key="n"
            type="button"
            @click="appendDigit(n.toString())"
            class="h-12 sm:h-13 rounded-2xl bg-slate-100/80 hover:bg-slate-200 active:bg-indigo-100 active:text-indigo-700 text-slate-800 text-lg font-black font-heading transition-all flex items-center justify-center active:scale-95"
          >
            {{ n }}
          </button>

          <button
            type="button"
            @click="clearPin"
            class="h-12 sm:h-13 rounded-2xl bg-slate-100/50 hover:bg-slate-200 text-slate-500 text-xs font-bold transition-all flex items-center justify-center active:scale-95"
          >
            BORRAR
          </button>

          <button
            type="button"
            @click="appendDigit('0')"
            class="h-12 sm:h-13 rounded-2xl bg-slate-100/80 hover:bg-slate-200 active:bg-indigo-100 active:text-indigo-700 text-slate-800 text-lg font-black font-heading transition-all flex items-center justify-center active:scale-95"
          >
            0
          </button>

          <button
            type="button"
            @click="removeDigit"
            class="h-12 sm:h-13 rounded-2xl bg-slate-100/50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-all flex items-center justify-center active:scale-95"
          >
            <Delete class="w-5 h-5" />
          </button>
        </div>

        <!-- Botones de Acción -->
        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            @click="handleClose"
            class="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="submitPin"
            :disabled="pin.length < 3 || isVerifying"
            class="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-1.5"
          >
            <span v-if="isVerifying" class="animate-spin">⏳</span>
            <span>{{ isVerifying ? 'Verificando...' : 'Autorizar' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ShieldAlert, X, Delete } from 'lucide-vue-next'
import { api } from '@/api'
import { User } from '@shared/types/user'

const props = defineProps<{
  isOpen: boolean
  title?: string
  actionDescription?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'authorized', adminUser: User): void
}>()

const pin = ref('')
const errorMessage = ref('')
const isVerifying = ref(false)

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    pin.value = ''
    errorMessage.value = ''
    isVerifying.value = false
  }
})

function appendDigit(digit: string) {
  if (pin.value.length < 10) {
    pin.value += digit
    errorMessage.value = ''
  }
}

function removeDigit() {
  pin.value = pin.value.slice(0, -1)
  errorMessage.value = ''
}

function clearPin() {
  pin.value = ''
  errorMessage.value = ''
}

function handleClose() {
  emit('close')
}

async function submitPin() {
  if (pin.value.length < 3 || isVerifying.value) return

  isVerifying.value = true
  errorMessage.value = ''

  try {
    const adminUser = await api.verifyAdminPin({ pin: pin.value })
    if (adminUser && adminUser.id) {
      emit('authorized', adminUser)
    } else {
      errorMessage.value = 'PIN de Administrador inválido'
      pin.value = ''
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Error al validar PIN'
    pin.value = ''
  } finally {
    isVerifying.value = false
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (!props.isOpen) return
  if (e.key >= '0' && e.key <= '9') {
    appendDigit(e.key)
  } else if (e.key === 'Backspace') {
    removeDigit()
  } else if (e.key === 'Escape') {
    handleClose()
  } else if (e.key === 'Enter') {
    submitPin()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>
