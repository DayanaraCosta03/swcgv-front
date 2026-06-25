<script setup lang="ts">
import type {
  ClientReportRow,
  InventoryReport,
  SalesReportRow,
} from "~/types/report";
import {
  DOCUMENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
} from "~/types/sale";
import { API_URL } from "~/constants/api";

definePageMeta({ layout: "private" });

const toast = useToast();
const { exportTablePdf } = usePdf();
const { exportTableExcel } = useExcel();

const token = useCookie("auth_token");
const headers = computed(() => ({
  Authorization: token.value ? `Bearer ${token.value}` : "",
}));

type ReportType = "sales" | "inventory" | "clients";

const reportType = ref<ReportType>("sales");
const startDate = ref("");
const endDate = ref("");
const loading = ref(false);

const reportOptions = [
  { value: "sales", label: "Ventas" },
  { value: "inventory", label: "Inventario" },
  { value: "clients", label: "Clientes" },
];

// Filas crudas tal como vienen del backend, según el reporte activo.
const salesRows = ref<SalesReportRow[]>([]);
const inventoryRows = ref<InventoryReport["items"]>([]);
const clientRows = ref<ClientReportRow[]>([]);

const soles = (value: number) => `S/ ${Number(value).toFixed(2)}`;
const formatDate = (value: string) =>
  new Date(value).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const load = async () => {
  loading.value = true;
  try {
    if (reportType.value === "sales") {
      const query: Record<string, string> = {};
      if (startDate.value) query.startDate = startDate.value;
      if (endDate.value) query.endDate = endDate.value;
      salesRows.value = await $fetch<SalesReportRow[]>(
        `${API_URL}/reports/sales`,
        { query, headers: headers.value },
      );
    } else if (reportType.value === "inventory") {
      const res = await $fetch<InventoryReport>(
        `${API_URL}/reports/inventory`,
        { headers: headers.value },
      );
      inventoryRows.value = res.items;
    } else {
      clientRows.value = await $fetch<ClientReportRow[]>(
        `${API_URL}/reports/clients`,
        { headers: headers.value },
      );
    }
  } catch (error) {
    toast.add({ title: "No se pudo cargar el reporte", color: "error" });
    console.error(error);
  } finally {
    loading.value = false;
  }
};

await load();
watch(reportType, load);

// --- Definición de columnas y filas para tabla + exportación ---
const statusLabel = (status: string) =>
  status === "SIN_STOCK"
    ? "Sin stock"
    : status === "STOCK_BAJO"
      ? "Stock bajo"
      : "En stock";

const view = computed(() => {
  if (reportType.value === "sales") {
    return {
      title: "Reporte de ventas",
      columns: ["N°", "Fecha", "Cliente", "Pago", "Comprobante", "Total"],
      rows: salesRows.value.map((s) => [
        s.id,
        formatDate(s.saleDate),
        s.client,
        PAYMENT_METHOD_LABELS[s.paymentMethod],
        DOCUMENT_TYPE_LABELS[s.documentType],
        soles(s.total),
      ]),
      // Filas planas con cabeceras legibles para Excel.
      excel: salesRows.value.map((s) => ({
        "N°": s.id,
        Fecha: formatDate(s.saleDate),
        Cliente: s.client,
        Pago: PAYMENT_METHOD_LABELS[s.paymentMethod],
        Comprobante: DOCUMENT_TYPE_LABELS[s.documentType],
        Total: s.total,
      })),
    };
  }
  if (reportType.value === "inventory") {
    return {
      title: "Reporte de inventario",
      columns: ["ID", "Producto", "Categoría", "Precio", "Stock", "Estado"],
      rows: inventoryRows.value.map((p) => [
        p.id,
        p.name,
        p.category,
        soles(p.price),
        p.stock,
        statusLabel(p.status),
      ]),
      excel: inventoryRows.value.map((p) => ({
        ID: p.id,
        Producto: p.name,
        Categoría: p.category,
        Precio: p.price,
        Stock: p.stock,
        Estado: statusLabel(p.status),
      })),
    };
  }
  return {
    title: "Reporte de clientes",
    columns: ["ID", "Nombre", "DNI/RUC", "Teléfono", "Correo", "Dirección"],
    rows: clientRows.value.map((c) => [
      c.id,
      c.name,
      c.dni,
      c.phoneNumber,
      c.email,
      c.address,
    ]),
    excel: clientRows.value.map((c) => ({
      ID: c.id,
      Nombre: c.name,
      "DNI/RUC": c.dni,
      Teléfono: c.phoneNumber,
      Correo: c.email,
      Dirección: c.address,
      Activo: c.isActive ? "Sí" : "No",
    })),
  };
});

const downloadPdf = () => {
  if (view.value.rows.length === 0) {
    toast.add({ title: "No hay datos para exportar", color: "warning" });
    return;
  }
  exportTablePdf(
    view.value.title,
    view.value.columns,
    view.value.rows,
    `${reportType.value}-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
};

const downloadExcel = () => {
  if (view.value.excel.length === 0) {
    toast.add({ title: "No hay datos para exportar", color: "warning" });
    return;
  }
  exportTableExcel(
    `${reportType.value}-${new Date().toISOString().slice(0, 10)}.xlsx`,
    view.value.excel,
    view.value.title,
  );
};
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-2xl bg-white px-6 py-7 shadow-sm">
      <h1 class="text-2xl font-semibold text-gray-900">REPORTES</h1>
      <p class="text-sm text-gray-500">
        Genera y exporta reportes en PDF o Excel
      </p>
    </div>

    <!-- Filtros -->
    <div
      class="flex flex-wrap items-end gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm"
    >
      <div class="min-w-44">
        <label class="mb-1 block text-xs text-gray-500">Tipo de reporte</label>
        <USelect
          v-model="reportType"
          :items="reportOptions"
          value-key="value"
          class="w-full"
        />
      </div>
      <template v-if="reportType === 'sales'">
        <div>
          <label class="mb-1 block text-xs text-gray-500">Desde</label>
          <UInput v-model="startDate" type="date" />
        </div>
        <div>
          <label class="mb-1 block text-xs text-gray-500">Hasta</label>
          <UInput v-model="endDate" type="date" />
        </div>
        <UButton
          icon="i-lucide-search"
          label="Aplicar"
          color="neutral"
          @click="load"
        />
      </template>

      <div class="ml-auto flex gap-2">
        <UButton
          icon="i-lucide-file-text"
          label="PDF"
          color="error"
          variant="soft"
          @click="downloadPdf"
        />
        <UButton
          icon="i-lucide-file-spreadsheet"
          label="Excel"
          color="success"
          variant="soft"
          @click="downloadExcel"
        />
      </div>
    </div>

    <!-- Tabla -->
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="border-b border-gray-200 bg-gray-50">
            <tr class="text-sm font-semibold text-gray-700">
              <th
                v-for="col in view.columns"
                :key="col"
                class="px-6 py-4 whitespace-nowrap"
              >
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td
                :colspan="view.columns.length"
                class="px-6 py-10 text-center text-gray-400"
              >
                Cargando reporte...
              </td>
            </tr>
            <tr v-else-if="view.rows.length === 0">
              <td
                :colspan="view.columns.length"
                class="px-6 py-10 text-center text-gray-400"
              >
                No hay datos para este reporte.
              </td>
            </tr>
            <tr
              v-for="(row, i) in view.rows"
              v-else
              :key="i"
              class="text-sm text-gray-800 hover:bg-gray-50"
            >
              <td
                v-for="(cell, j) in row"
                :key="j"
                class="px-6 py-3 whitespace-nowrap"
              >
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
