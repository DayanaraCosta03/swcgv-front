<script setup lang="ts">
import type { Client, ClientListResponse, ClientStats } from "~/types/client";
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
const { data, pending, refresh } = await useFetch<ClientListResponse>(
  `${API_URL}/clients`,
  {
    query,
    headers,
    default: () => ({ items: [], total: 0, page: 1, limit: 10, pages: 0 }),
  },
);

const { data: stats, refresh: refreshStats } = await useFetch<ClientStats>(
  `${API_URL}/clients/stats`,
  {
    headers,
    default: () => ({ total: 0 }),
  },
);

const statCards = computed(() => [
  {
    label: "TOTAL DE CLIENTES",
    value: stats.value.total,
    icon: "i-lucide-users",
    color: "text-gray-900",
  },
]);

// --- Modal crear/editar ---
const formOpen = ref(false);
const selectedClient = ref<Client | null>(null);

const openCreate = () => {
  selectedClient.value = null;
  formOpen.value = true;
};

const openEdit = (client: Client) => {
  selectedClient.value = client;
  formOpen.value = true;
};

const onSaved = () => {
  refresh();
  refreshStats();
};

// --- Eliminar ---
const deleteOpen = ref(false);
const clientToDelete = ref<Client | null>(null);
const deleting = ref(false);

const askDelete = (client: Client) => {
  clientToDelete.value = client;
  deleteOpen.value = true;
};

const confirmDelete = async () => {
  if (!clientToDelete.value) return;
  deleting.value = true;
  try {
    await $fetch(`${API_URL}/clients/${clientToDelete.value.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });
    toast.add({ title: "Cliente eliminado", color: "success" });
    deleteOpen.value = false;
    refresh();
    refreshStats();
  } catch (error) {
    toast.add({
      title: "No se pudo eliminar",
      description: "El cliente puede tener ventas asociadas en el sistema.",
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
        DIRECTORIO DE CLIENTES
      </h1>
      <UButton
        icon="i-lucide-plus"
        label="NUEVO CLIENTE"
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
        placeholder="Buscar cliente por nombre o teléfono..."
        class="min-w-48 flex-1"
        aria-label="Buscar cliente"
      />
    </div>

    <!-- Tabla -->
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="border-b border-gray-200 bg-gray-50">
            <tr class="text-sm font-semibold text-gray-700">
              <th class="px-6 py-4">CLIENTE</th>
              <th class="px-6 py-4">TELÉFONO</th>
              <th class="px-6 py-4">NOTAS</th>
              <th class="px-6 py-4 text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending">
              <td colspan="4" class="px-6 py-10 text-center text-gray-400">
                Cargando clientes...
              </td>
            </tr>
            <tr v-else-if="data.items.length === 0">
              <td colspan="4" class="px-6 py-10 text-center text-gray-400">
                No se encontraron clientes.
              </td>
            </tr>
            <tr
              v-for="client in data.items"
              v-else
              :key="client.id"
              class="text-sm text-gray-800 hover:bg-gray-50"
            >
              <td class="px-6 py-4">
                <p class="font-medium text-gray-900">{{ client.name }}</p>
              </td>
              <td class="px-6 py-4 text-xs text-gray-600">
                {{ client.phoneNumber || "-" }}
              </td>
              <td class="px-6 py-4 text-gray-500 max-w-xs truncate">
                {{ client.notes || "-" }}
              </td>
              <td class="px-6 py-4">
                <div class="flex justify-end gap-1">
                  <UButton
                    aria-label="Editar cliente"
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    @click="openEdit(client)"
                  />
                  <UButton
                    aria-label="Eliminar cliente"
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    @click="askDelete(client)"
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
    <ClientFormModal
      v-model:open="formOpen"
      :client="selectedClient"
      @saved="onSaved"
    />

    <!-- Confirmación de borrado -->
    <UModal v-model:open="deleteOpen" title="Eliminar cliente">
      <template #body>
        <p class="text-gray-600">
          ¿Seguro que deseas eliminar a
          <span class="font-semibold">{{ clientToDelete?.name }}</span
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
