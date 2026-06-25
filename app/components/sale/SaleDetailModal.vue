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
</script>

<template>
  <UModal
    v-model:open="open"
    title="Detalle de venta"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div v-if="pending" class="py-10 text-center text-gray-400">
        Cargando detalle...
      </div>

      <div v-else-if="sale" class="space-y-5">
        <!-- Cabecera -->
        <div class="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-sm">
          <div>
            <p class="text-xs text-gray-500">N° de venta</p>
            <p class="font-semibold text-gray-900">#{{ sale.id }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Fecha</p>
            <p class="font-semibold text-gray-900">
              {{ formatDate(sale.saleDate) }}
            </p>
          </div>
          <div class="col-span-2">
            <p class="text-xs text-gray-500">Cliente</p>
            <p class="font-semibold text-gray-900">
              {{ sale.client?.name || "Venta sin cliente" }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Método de pago</p>
            <p class="font-semibold text-gray-900">
              {{ PAYMENT_METHOD_LABELS[sale.paymentMethod] }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Comprobante</p>
            <p class="font-semibold text-gray-900">
              {{ DOCUMENT_TYPE_LABELS[sale.documentType] }}
            </p>
          </div>
        </div>

        <!-- Productos -->
        <div class="overflow-hidden rounded-xl border border-gray-200">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 text-xs font-semibold text-gray-600">
              <tr>
                <th class="px-4 py-2">PRODUCTO</th>
                <th class="px-4 py-2 text-right">P. UNIT.</th>
                <th class="px-4 py-2 text-center">CANT.</th>
                <th class="px-4 py-2 text-right">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in sale.saleItems" :key="item.id">
                <td class="px-4 py-2 font-medium text-gray-800">
                  {{ item.product?.name || "Producto eliminado" }}
                </td>
                <td class="px-4 py-2 text-right text-gray-600">
                  {{ formatCurrency(item.unitPrice) }}
                </td>
                <td class="px-4 py-2 text-center text-gray-600">
                  {{ item.quantity }}
                </td>
                <td class="px-4 py-2 text-right font-semibold text-gray-900">
                  {{ formatCurrency(item.totalPrice) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Total -->
        <div
          class="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3"
        >
          <span class="text-sm font-semibold text-gray-700">TOTAL</span>
          <span class="text-2xl font-bold text-primary">
            {{ formatCurrency(sale.totalAmount) }}
          </span>
        </div>

        <div class="flex justify-end pt-1">
          <UButton
            color="neutral"
            variant="outline"
            label="Cerrar"
            @click="open = false"
          />
        </div>
      </div>

      <div v-else class="py-10 text-center text-gray-400">
        No se pudo cargar la venta.
      </div>
    </template>
  </UModal>
</template>
