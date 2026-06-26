<script setup lang="ts">
import type { Sale, SaleListResponse } from "~/types/sale";
import { API_URL } from "~/constants/api";

definePageMeta({ layout: "private" });

const toast = useToast();

// --- Filtros ---
const startDate = ref("");
const endDate = ref("");
const page = ref(1);
const limit = ref(10);

const query = computed(() => {
  const q: Record<string, string | number> = {
    page: page.value,
    limit: limit.value,
  };
  if (startDate.value) q.startDate = startDate.value;
  if (endDate.value) q.endDate = endDate.value;
  return q;
});

const token = useCookie("auth_token");
const headers = computed(() => {
  const h: Record<string, string> = {};
  if (token.value) h.Authorization = `Bearer ${token.value}`;
  return h;
});

// --- Datos ---
const { data, pending, refresh } = await useFetch<SaleListResponse>(
  `${API_URL}/sales`,
  {
    query,
    headers,
    default: () => ({ items: [], total: 0, page: 1, limit: 10, pages: 0 }),
  },
);

// --- Modal registrar venta ---
const formOpen = ref(false);
const openCreate = () => {
  formOpen.value = true;
};
const onSaved = () => refresh();

// --- Modal detalle ---
const detailOpen = ref(false);
const selectedSaleId = ref<number | null>(null);
const openDetail = (sale: Sale) => {
  selectedSaleId.value = sale.id;
  detailOpen.value = true;
};

// --- Modal comprobante ---
const receiptOpen = ref(false);
const receiptSaleId = ref<number | null>(null);
const openReceipt = (sale: Sale) => {
  receiptSaleId.value = sale.id;
  receiptOpen.value = true;
};

// --- Anular venta ---
const deleteOpen = ref(false);
const saleToDelete = ref<Sale | null>(null);
const deleting = ref(false);

const askDelete = (sale: Sale) => {
  saleToDelete.value = sale;
  deleteOpen.value = true;
};

const confirmDelete = async () => {
  if (!saleToDelete.value) return;
  deleting.value = true;
  try {
    await $fetch(`${API_URL}/sales/${saleToDelete.value.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token.value}` },
    });
    toast.add({ title: "Venta anulada y stock devuelto", color: "success" });
    deleteOpen.value = false;
    refresh();
  } catch (error) {
    toast.add({
      title: "No se pudo anular la venta",
      description: "Solo un administrador puede anular ventas.",
      color: "error",
    });
    console.error(error);
  } finally {
    deleting.value = false;
  }
};

const formatCurrency = (value: string | number) =>
  `S/ ${Number(value).toFixed(2)}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-6 py-9 shadow-sm"
    >
      <h1 class="text-2xl font-semibold text-gray-900">HISTORIAL DE VENTAS</h1>
      <UButton
        icon="i-lucide-plus"
        label="NUEVA VENTA"
        size="lg"
        class="rounded-xl font-semibold"
        @click="openCreate"
      />
    </div>

    <!-- Tarjeta de estadística -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        class="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
      >
        <div
          class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700"
        >
          <UIcon name="i-lucide-shopping-cart" class="size-6" />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold tracking-wide text-gray-500">
            TOTAL DE VENTAS
          </p>
          <p class="mt-0.5 text-3xl font-bold text-gray-900">{{ data.total }}</p>
        </div>
      </div>
    </div>

    <!-- Barra de filtros -->
    <div
      class="flex flex-wrap items-end gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
    >
      <div>
        <label class="mb-1 block text-xs text-gray-500">Desde</label>
        <UInput v-model="startDate" type="date" aria-label="Fecha desde" />
      </div>
      <div>
        <label class="mb-1 block text-xs text-gray-500">Hasta</label>
        <UInput v-model="endDate" type="date" aria-label="Fecha hasta" />
      </div>
      <UButton
        v-if="startDate || endDate"
        color="neutral"
        variant="ghost"
        icon="i-lucide-x"
        label="Limpiar"
        @click="
          startDate = '';
          endDate = '';
          page = 1;
        "
      />
    </div>

    <!-- Tabla -->
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="border-b border-gray-200 bg-gray-50">
            <tr class="text-sm font-semibold text-gray-700">
              <th class="px-6 py-4">N°</th>
              <th class="px-6 py-4">FECHA</th>
              <th class="px-6 py-4">CLIENTE</th>
              <th class="px-6 py-4 text-right">TOTAL</th>
              <th class="px-6 py-4 text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending">
              <td colspan="5" class="px-6 py-10 text-center text-gray-400">
                Cargando ventas...
              </td>
            </tr>
            <tr v-else-if="data.items.length === 0">
              <td colspan="5" class="px-6 py-10 text-center text-gray-400">
                No se encontraron ventas.
              </td>
            </tr>
            <tr
              v-for="sale in data.items"
              v-else
              :key="sale.id"
              class="text-sm text-gray-800 hover:bg-gray-50"
            >
              <td class="px-6 py-4 font-medium text-gray-900">#{{ sale.id }}</td>
              <td class="px-6 py-4 text-xs text-gray-600">
                {{ formatDate(sale.saleDate) }}
              </td>
              <td class="px-6 py-4 text-gray-700">
                {{ sale.client?.name || "Venta sin cliente" }}
              </td>
              <td class="px-6 py-4 text-right font-semibold text-gray-900">
                {{ formatCurrency(sale.totalAmount) }}
              </td>
              <td class="px-6 py-4">
                <div class="flex justify-end gap-1">
                  <UButton
                    aria-label="Ver detalle"
                    icon="i-lucide-eye"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    @click="openDetail(sale)"
                  />
                  <UButton
                    aria-label="Ver comprobante"
                    icon="i-lucide-receipt"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    @click="openReceipt(sale)"
                  />
                  <UButton
                    aria-label="Anular venta"
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    @click="askDelete(sale)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div
        v-if="data.total > limit"
        class="flex justify-end border-t border-gray-100 px-6 py-3"
      >
        <LazyUPagination
          v-model:page="page"
          :total="data.total"
          :items-per-page="limit"
        />
      </div>
    </div>

    <!-- Modal registrar venta -->
    <SaleFormModal v-model:open="formOpen" @saved="onSaved" />

    <!-- Modal detalle -->
    <SaleDetailModal v-model:open="detailOpen" :sale-id="selectedSaleId" />

    <!-- Modal comprobante (imprimir / PDF) -->
    <SaleReceiptModal v-model:open="receiptOpen" :sale-id="receiptSaleId" />

    <!-- Confirmación de anulación -->
    <UModal v-model:open="deleteOpen" title="Anular venta">
      <template #body>
        <p class="text-gray-600">
          ¿Seguro que deseas anular la venta
          <span class="font-semibold">#{{ saleToDelete?.id }}</span
          >? El stock de los productos será devuelto al inventario.
        </p>
        <div class="flex justify-end gap-2 pt-4">
          <UButton
            color="neutral"
            variant="outline"
            label="Cancelar"
            @click="deleteOpen = false"
          />
          <UButton
            color="error"
            label="Anular"
            :loading="deleting"
            @click="confirmDelete"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
