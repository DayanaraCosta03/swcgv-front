<script setup lang="ts">
import {
  DOCUMENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  type Sale,
} from "~/types/sale";
import { API_URL } from "~/constants/api";

const props = defineProps<{ saleId: number | null }>();
const open = defineModel<boolean>("open", { default: false });

const token = useCookie("auth_token");
const sale = ref<Sale | null>(null);
const pending = ref(false);

const { generateReceiptPdf } = usePdf();

watch(open, async (isOpen) => {
  if (!isOpen || !props.saleId) return;
  pending.value = true;
  sale.value = null;
  try {
    sale.value = await $fetch<Sale>(`${API_URL}/sales/${props.saleId}`, {
      headers: { Authorization: `Bearer ${token.value}` },
    });
  } catch (error) {
    console.error(error);
  } finally {
    pending.value = false;
  }
});

const formatCurrency = (value: string | number) =>
  `S/ ${Number(value).toFixed(2)}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const print = () => window.print();

const downloadPdf = () => {
  if (sale.value) generateReceiptPdf(sale.value);
};
</script>

<template>
  <UModal
    v-model:open="open"
    title="Comprobante"
    :ui="{ content: 'max-w-lg' }"
  >
    <template #body>
      <div v-if="pending" class="py-10 text-center text-gray-400">
        Cargando comprobante...
      </div>

      <div v-else-if="sale" class="space-y-4">
        <!-- Comprobante imprimible -->
        <div
          id="receipt-print"
          class="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-800"
        >
          <div class="text-center">
            <p class="text-xl font-black tracking-wide text-gray-900">
              VIVERO LA HUERTA
            </p>
            <p class="mt-1 font-semibold uppercase text-primary">
              {{ DOCUMENT_TYPE_LABELS[sale.documentType] }}
            </p>
            <p class="text-xs text-gray-500">
              N° {{ String(sale.id).padStart(6, "0") }}
            </p>
          </div>

          <div class="mt-4 space-y-1 border-t border-dashed border-gray-300 pt-3">
            <p><span class="text-gray-500">Fecha:</span> {{ formatDate(sale.saleDate) }}</p>
            <p>
              <span class="text-gray-500">Cliente:</span>
              {{ sale.client?.name || "Cliente varios" }}
            </p>
            <p v-if="sale.client?.dni">
              <span class="text-gray-500">DNI/RUC:</span> {{ sale.client.dni }}
            </p>
            <p v-if="sale.client?.address">
              <span class="text-gray-500">Dirección:</span>
              {{ sale.client.address }}
            </p>
            <p>
              <span class="text-gray-500">Método de pago:</span>
              {{ PAYMENT_METHOD_LABELS[sale.paymentMethod] }}
            </p>
          </div>

          <table class="mt-4 w-full text-left text-xs">
            <thead class="border-y border-gray-300 text-gray-600">
              <tr>
                <th class="py-1">PRODUCTO</th>
                <th class="py-1 text-center">CANT.</th>
                <th class="py-1 text-right">P. UNIT.</th>
                <th class="py-1 text-right">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in sale.saleItems"
                :key="item.id"
                class="border-b border-gray-100"
              >
                <td class="py-1">{{ item.product?.name || "Producto" }}</td>
                <td class="py-1 text-center">{{ item.quantity }}</td>
                <td class="py-1 text-right">{{ formatCurrency(item.unitPrice) }}</td>
                <td class="py-1 text-right font-medium">
                  {{ formatCurrency(item.totalPrice) }}
                </td>
              </tr>
            </tbody>
          </table>

          <div
            class="mt-3 flex items-center justify-between border-t border-gray-300 pt-3"
          >
            <span class="font-semibold">TOTAL</span>
            <span class="text-lg font-bold text-primary">
              {{ formatCurrency(sale.totalAmount) }}
            </span>
          </div>

          <p class="mt-4 text-center text-xs text-gray-400">
            ¡Gracias por su compra!
          </p>
        </div>

        <!-- Acciones (no se imprimen) -->
        <div class="flex flex-wrap justify-end gap-2 print:hidden">
          <UButton
            color="neutral"
            variant="outline"
            label="Cerrar"
            @click="open = false"
          />
          <UButton
            icon="i-lucide-printer"
            color="neutral"
            label="Imprimir"
            @click="print"
          />
          <UButton
            icon="i-lucide-download"
            label="Descargar PDF"
            @click="downloadPdf"
          />
        </div>
      </div>

      <div v-else class="py-10 text-center text-gray-400">
        No se pudo cargar el comprobante.
      </div>
    </template>
  </UModal>
</template>

<style>
/* Al imprimir, solo se muestra el comprobante (aislado del resto de la app). */
@media print {
  body * {
    visibility: hidden;
  }
  #receipt-print,
  #receipt-print * {
    visibility: visible;
  }
  #receipt-print {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    border: none;
  }
}
</style>
