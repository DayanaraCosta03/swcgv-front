<script setup lang="ts">
import type {
  Supplier,
  SupplierListResponse,
  SupplierStats,
} from "~/types/supplier";
import { API_URL } from "~/constants/api";

definePageMeta({ layout: "private" });

const toast = useToast();

// --- Filtros ---
const searchInput = ref("");
const search = ref("");
const page = ref(1);
const limit = ref(10);

// Debounce de la búsqueda para evitar saturar el backend
let debounceTimer: ReturnType<typeof setTimeout>;
watch(searchInput, (value) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    search.value = value;
    page.value = 1;
  }, 300);
});

const query = computed(() => {
  const q: Record<string, string | number> = {
    page: page.value,
    limit: limit.value,
  };
  if (search.value) q.search = search.value;
  return q;
});

const token = useCookie("auth_token");
const headers = computed(() => {
  const h: Record<string, string> = {};
  if (token.value) {
    h.Authorization = `Bearer ${token.value}`;
  }
  return h;
});

// --- Datos ---
const { data, pending, refresh } = await useFetch<SupplierListResponse>(
  `${API_URL}/suppliers`,
  {
    query,
    headers,
    default: () => ({ items: [], total: 0, page: 1, limit: 10, pages: 0 }),
  },
);

const { data: stats, refresh: refreshStats } = await useFetch<SupplierStats>(
  `${API_URL}/suppliers/stats`,
  {
    headers,
    default: () => ({ total: 0 }),
  },
);

const statCards = computed(() => [
  {
    label: "TOTAL DE PROVEEDORES",
    value: stats.value.total,
    icon: "i-lucide-truck",
    color: "text-gray-900",
  },
]);

// --- Modal crear/editar ---
const formOpen = ref(false);
const selectedSupplier = ref<Supplier | null>(null);

const openCreate = () => {
  selectedSupplier.value = null;
  formOpen.value = true;
};

const openEdit = (supplier: Supplier) => {
  selectedSupplier.value = supplier;
  formOpen.value = true;
};

const onSaved = () => {
  refresh();
  refreshStats();
};

// --- Eliminar ---
const deleteOpen = ref(false);
const supplierToDelete = ref<Supplier | null>(null);
const deleting = ref(false);

const askDelete = (supplier: Supplier) => {
  supplierToDelete.value = supplier;
  deleteOpen.value = true;
};

const confirmDelete = async () => {
  if (!supplierToDelete.value) return;
  deleting.value = true;
  try {
    await $fetch(`${API_URL}/suppliers/${supplierToDelete.value.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });
    toast.add({ title: "Proveedor eliminado", color: "success" });
    deleteOpen.value = false;
    refresh();
    refreshStats();
  } catch (error) {
    toast.add({
      title: "No se pudo eliminar",
      description: "El proveedor puede tener compras asociadas en el sistema.",
      color: "error",
    });
    console.error(error);
  } finally {
    deleting.value = false;
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-6 py-9 shadow-sm"
    >
      <h1 class="text-2xl font-semibold text-gray-900">
        DIRECTORIO DE PROVEEDORES
      </h1>
      <UButton
        icon="i-lucide-plus"
        label="NUEVO PROVEEDOR"
        size="lg"
        class="rounded-xl font-semibold"
        @click="openCreate"
      />
    </div>

    <!-- Tarjetas de estadísticas -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="rounded-2xl border border-secondary/40 bg-white/75 p-5 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold tracking-wide text-gray-500">
            {{ card.label }}
          </p>
          <UIcon :name="card.icon" :class="['size-5', card.color]" />
        </div>
        <p :class="['mt-2 text-4xl font-bold', card.color]">{{ card.value }}</p>
      </div>
    </div>

    <!-- Barra de herramientas -->
    <div
      class="flex flex-wrap items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
    >
      <UInput
        v-model="searchInput"
        icon="i-lucide-search"
        placeholder="Buscar proveedor por nombre, RUC o correo..."
        class="min-w-48 flex-1"
        aria-label="Buscar proveedor"
      />
    </div>

    <!-- Tabla -->
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="border-b border-gray-200 bg-gray-50">
            <tr class="text-sm font-semibold text-gray-700">
              <th class="px-6 py-4">PROVEEDOR</th>
              <th class="px-6 py-4">RUC</th>
              <th class="px-6 py-4">TELÉFONO</th>
              <th class="px-6 py-4">CORREO</th>
              <th class="px-6 py-4">ESTADO</th>
              <th class="px-6 py-4 text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending">
              <td colspan="6" class="px-6 py-10 text-center text-gray-400">
                Cargando proveedores...
              </td>
            </tr>
            <tr v-else-if="data.items.length === 0">
              <td colspan="6" class="px-6 py-10 text-center text-gray-400">
                No se encontraron proveedores.
              </td>
            </tr>
            <tr
              v-for="supplier in data.items"
              v-else
              :key="supplier.id"
              class="text-sm text-gray-800 hover:bg-gray-50"
            >
              <td class="px-6 py-4">
                <p class="font-medium text-gray-900">{{ supplier.name }}</p>
                <p v-if="supplier.address" class="text-xs text-gray-400">
                  {{ supplier.address }}
                </p>
              </td>
              <td class="px-6 py-4 text-xs text-gray-600">
                {{ supplier.ruc || "-" }}
              </td>
              <td class="px-6 py-4 text-xs text-gray-600">
                {{ supplier.phoneNumber || "-" }}
              </td>
              <td class="px-6 py-4 text-xs text-gray-600">
                {{ supplier.email || "-" }}
              </td>
              <td class="px-6 py-4">
                <UBadge
                  :color="supplier.isActive ? 'success' : 'neutral'"
                  variant="subtle"
                  class="rounded-md font-semibold text-xs"
                >
                  {{ supplier.isActive ? "Activo" : "Inactivo" }}
                </UBadge>
              </td>
              <td class="px-6 py-4">
                <div class="flex justify-end gap-1">
                  <UButton
                    aria-label="Editar proveedor"
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    @click="openEdit(supplier)"
                  />
                  <UButton
                    aria-label="Eliminar proveedor"
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    @click="askDelete(supplier)"
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

    <!-- Modal crear/editar -->
    <SupplierFormModal
      v-model:open="formOpen"
      :supplier="selectedSupplier"
      @saved="onSaved"
    />

    <!-- Confirmación de borrado -->
    <UModal v-model:open="deleteOpen" title="Eliminar proveedor">
      <template #body>
        <p class="text-gray-600">
          ¿Seguro que deseas eliminar a
          <span class="font-semibold">{{ supplierToDelete?.name }}</span
          >? El registro será eliminado de forma lógica.
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
            label="Eliminar"
            :loading="deleting"
            @click="confirmDelete"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
