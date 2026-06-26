<script setup lang="ts">
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { Bar, Pie } from "vue-chartjs";
import type { DashboardData } from "~/types/report";
import { PAYMENT_METHOD_LABELS } from "~/types/sale";
import { API_URL } from "~/constants/api";

definePageMeta({ layout: "private" });

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

const token = useCookie("auth_token");
const headers = computed(() => ({
  Authorization: token.value ? `Bearer ${token.value}` : "",
}));

const { data, pending } = await useFetch<DashboardData>(
  `${API_URL}/reports/dashboard`,
  {
    headers,
    default: () => ({
      sales: {
        count: 0,
        revenue: 0,
        todayCount: 0,
        todayRevenue: 0,
        monthCount: 0,
        monthRevenue: 0,
      },
      inventory: { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 },
      clients: { total: 0 },
      salesByMonth: [],
      salesByPaymentMethod: [],
      topProducts: [],
      lowStockProducts: [],
    }),
  },
);

const soles = (value: number) => `S/ ${Number(value).toFixed(2)}`;

const kpis = computed(() => [
  {
    label: "INGRESOS TOTALES",
    value: soles(data.value.sales.revenue),
    icon: "i-lucide-dollar-sign",
    iconWrap: "bg-green-100 text-green-700",
  },
  {
    label: "VENTAS DEL MES",
    value: String(data.value.sales.monthCount),
    sub: soles(data.value.sales.monthRevenue),
    icon: "i-lucide-trending-up",
    iconWrap: "bg-blue-100 text-blue-700",
  },
  {
    label: "VENTAS DE HOY",
    value: String(data.value.sales.todayCount),
    sub: soles(data.value.sales.todayRevenue),
    icon: "i-lucide-shopping-cart",
    iconWrap: "bg-cyan-100 text-cyan-700",
  },
  {
    label: "CLIENTES",
    value: String(data.value.clients.total),
    icon: "i-lucide-users",
    iconWrap: "bg-purple-100 text-purple-700",
  },
  {
    label: "ALERTAS DE STOCK",
    value: String(data.value.inventory.lowStock + data.value.inventory.outOfStock),
    sub: `${data.value.inventory.outOfStock} sin stock`,
    icon: "i-lucide-triangle-alert",
    iconWrap: "bg-amber-100 text-amber-700",
  },
]);

// --- Datos de los gráficos ---
const monthChart = computed(() => ({
  labels: data.value.salesByMonth.map((m) => m.month),
  datasets: [
    {
      label: "Ingresos (S/)",
      data: data.value.salesByMonth.map((m) => m.revenue),
      backgroundColor: "#274025",
      borderRadius: 6,
    },
  ],
}));

const paymentChart = computed(() => ({
  labels: data.value.salesByPaymentMethod.map(
    (p) => PAYMENT_METHOD_LABELS[p.method] ?? p.method,
  ),
  datasets: [
    {
      data: data.value.salesByPaymentMethod.map((p) => p.revenue),
      backgroundColor: ["#274025", "#6b9e5e", "#c2a83e", "#8a8a8a"],
    },
  ],
}));

const topProductsChart = computed(() => ({
  labels: data.value.topProducts.map((p) => p.name),
  datasets: [
    {
      label: "Unidades vendidas",
      data: data.value.topProducts.map((p) => p.quantity),
      backgroundColor: "#6b9e5e",
      borderRadius: 6,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

const horizontalOptions = {
  ...chartOptions,
  indexAxis: "y" as const,
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom" as const } },
};
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-2xl bg-white px-6 py-7 shadow-sm">
      <h1 class="text-2xl font-semibold text-gray-900">DASHBOARD</h1>
      <p class="text-sm text-gray-500">Resumen general del Vivero La Huerta</p>
    </div>

    <!-- Tarjetas KPI -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div
        v-for="kpi in kpis"
        :key="kpi.label"
        class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start gap-3">
          <div
            :class="[
              'flex size-11 shrink-0 items-center justify-center rounded-xl',
              kpi.iconWrap,
            ]"
          >
            <UIcon :name="kpi.icon" class="size-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold tracking-wide text-gray-500">
              {{ kpi.label }}
            </p>
            <p class="mt-0.5 text-2xl font-bold text-gray-900">{{ kpi.value }}</p>
            <p v-if="kpi.sub" class="text-xs text-gray-400">{{ kpi.sub }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="pending" class="rounded-2xl bg-white p-10 text-center text-gray-400 shadow-sm">
      Cargando indicadores...
    </div>

    <template v-else>
      <!-- Gráficos -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 class="mb-4 text-sm font-semibold text-gray-700">
            INGRESOS POR MES
          </h2>
          <div class="h-64">
            <ClientOnly>
              <Bar :data="monthChart" :options="chartOptions" />
            </ClientOnly>
          </div>
        </div>
        <div class="rounded-2xl bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold text-gray-700">
            VENTAS POR MÉTODO DE PAGO
          </h2>
          <div class="h-64">
            <ClientOnly>
              <Pie
                v-if="data.salesByPaymentMethod.length"
                :data="paymentChart"
                :options="pieOptions"
              />
              <p v-else class="pt-20 text-center text-sm text-gray-400">
                Sin datos
              </p>
            </ClientOnly>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <!-- Top productos -->
        <div class="rounded-2xl bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold text-gray-700">
            PRODUCTOS MÁS VENDIDOS
          </h2>
          <div class="h-64">
            <ClientOnly>
              <Bar
                v-if="data.topProducts.length"
                :data="topProductsChart"
                :options="horizontalOptions"
              />
              <p v-else class="pt-20 text-center text-sm text-gray-400">
                Aún no hay ventas
              </p>
            </ClientOnly>
          </div>
        </div>

        <!-- Alertas de stock -->
        <div class="rounded-2xl bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold text-gray-700">
            ALERTAS DE STOCK
          </h2>
          <div class="max-h-64 overflow-y-auto">
            <p
              v-if="data.lowStockProducts.length === 0"
              class="pt-16 text-center text-sm text-gray-400"
            >
              Todo el inventario está en buen nivel.
            </p>
            <ul v-else class="divide-y divide-gray-100">
              <li
                v-for="p in data.lowStockProducts"
                :key="p.id"
                class="flex items-center justify-between py-2"
              >
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ p.name }}</p>
                  <p class="text-xs text-gray-400">{{ p.category }}</p>
                </div>
                <span
                  class="rounded-full px-3 py-1 text-xs font-semibold"
                  :class="
                    p.status === 'SIN_STOCK'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  "
                >
                  {{ p.status === "SIN_STOCK" ? "Sin stock" : `${p.stock} u.` }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
