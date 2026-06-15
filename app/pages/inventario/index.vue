<script setup lang="ts">
import type { Category } from "~/types/category";
import type {
  Product,
  ProductListResponse,
  ProductSortBy,
  ProductStats,
  SortOrder,
} from "~/types/product";
import { API_URL } from "~/constants/api";

definePageMeta({ layout: "private" });

const toast = useToast();

// --- Filtros (botones Buscar / Categoría / Ordenar del diseño) ---
const searchInput = ref("");
const search = ref("");
const categoryId = ref<number | undefined>(undefined);
const sortBy = ref<ProductSortBy>("name");
const order = ref<SortOrder>("ASC");
const page = ref(1);
const limit = ref(10);

// Debounce de la búsqueda para no golpear el backend en cada tecla.
let debounceTimer: ReturnType<typeof setTimeout>;
watch(searchInput, (value) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    search.value = value;
    page.value = 1;
  }, 300);
});

watch([categoryId, sortBy, order], () => {
  page.value = 1;
});

const query = computed(() => {
  const q: Record<string, string | number> = {
    sortBy: sortBy.value,
    order: order.value,
    page: page.value,
    limit: limit.value,
  };
  if (search.value) q.search = search.value;
  if (categoryId.value) q.categoryId = categoryId.value;
  return q;
});

// --- Datos: TODO sale de la BD ---
const { data, pending, refresh } = await useFetch<ProductListResponse>(
  `${API_URL}/products`,
  { query, default: () => ({ items: [], total: 0, page: 1, limit: 10, pages: 0 }) },
);

const { data: stats, refresh: refreshStats } = await useFetch<ProductStats>(
  `${API_URL}/products/stats`,
  { default: () => ({ total: 0, inStock: 0, lowStock: 0, outOfStock: 0 }) },
);

const { data: categories } = await useFetch<Category[]>(
  `${API_URL}/categories`,
  { default: () => [] },
);

const categoryItems = computed(() => [
  { label: "Todas las categorías", value: undefined },
  ...(categories.value ?? []).map((c) => ({ label: c.name, value: c.id })),
]);

const sortItems = [
  { label: "Nombre", value: "name" },
  { label: "Categoría", value: "category" },
];

const statCards = computed(() => [
  { label: "TOTAL DE PRODUCTOS", value: stats.value.total, icon: "i-lucide-boxes", color: "text-gray-900" },
  { label: "EN STOCK", value: stats.value.inStock, icon: "i-lucide-circle-check", color: "text-green-600" },
  { label: "STOCK BAJO", value: stats.value.lowStock, icon: "i-lucide-triangle-alert", color: "text-amber-500" },
  { label: "SIN STOCK", value: stats.value.outOfStock, icon: "i-lucide-circle-x", color: "text-red-600" },
]);

// --- Modal crear/editar ---
const formOpen = ref(false);
const selectedProduct = ref<Product | null>(null);

const openCreate = () => {
  selectedProduct.value = null;
  formOpen.value = true;
};

const openEdit = (product: Product) => {
  selectedProduct.value = product;
  formOpen.value = true;
};

const onSaved = () => {
  refresh();
  refreshStats();
};

// --- Eliminar ---
const deleteOpen = ref(false);
const productToDelete = ref<Product | null>(null);
const deleting = ref(false);

const askDelete = (product: Product) => {
  productToDelete.value = product;
  deleteOpen.value = true;
};

const confirmDelete = async () => {
  if (!productToDelete.value) return;
  deleting.value = true;
  try {
    await $fetch(`${API_URL}/products/${productToDelete.value.id}`, {
      method: "DELETE",
    });
    toast.add({ title: "Producto eliminado", color: "success" });
    deleteOpen.value = false;
    refresh();
    refreshStats();
  } catch (error) {
    toast.add({
      title: "No se pudo eliminar",
      description: "El producto puede tener ventas o compras asociadas.",
      color: "error",
    });
    console.error(error);
  } finally {
    deleting.value = false;
  }
};

const formatPrice = (price: string) => `S/ ${Number(price).toFixed(2)}`;
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-6 py-9 shadow-sm"
    >
      <h1 class="text-2xl font-semibold text-gray-900">
        INVENTARIO DE PRODUCTOS
      </h1>
      <UButton
        icon="i-lucide-plus"
        label="NUEVO"
        size="lg"
        class="rounded-xl font-semibold"
        @click="openCreate"
      />
    </div>

    <!-- Tarjetas de estadísticas -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="rounded-2xl border border-secondary/40 bg-white/75 p-5 shadow-sm "
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
        placeholder="Buscar..."
        class="min-w-48 flex-1"
      />
      <USelect
        v-model="categoryId"
        :items="categoryItems"
        placeholder="Categoría"
        icon="i-lucide-tag"
        class="w-52"
      />
      <USelect
        v-model="sortBy"
        :items="sortItems"
        icon="i-lucide-arrow-down-up"
        class="w-44"
      />
      <UButton
        :icon="order === 'ASC' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow'"
        color="neutral"
        variant="outline"
        class="rounded-xl"
        :label="order === 'ASC' ? 'Ascendente' : 'Descendente'"
        @click="order = order === 'ASC' ? 'DESC' : 'ASC'"
      />
    </div>

    <!-- Tabla -->
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="border-b border-gray-200 bg-gray-50">
            <tr class="text-sm font-semibold text-gray-700">
              <th class="px-6 py-4">PRODUCTO</th>
              <th class="px-6 py-4">ESTADO</th>
              <th class="px-6 py-4">PRECIO</th>
              <th class="px-6 py-4">STOCK</th>
              <th class="px-6 py-4">CATEGORÍA</th>
              <th class="px-6 py-4 text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending">
              <td colspan="6" class="px-6 py-10 text-center text-gray-400">
                Cargando productos...
              </td>
            </tr>
            <tr v-else-if="data.items.length === 0">
              <td colspan="6" class="px-6 py-10 text-center text-gray-400">
                No se encontraron productos.
              </td>
            </tr>
            <tr
              v-for="product in data.items"
              v-else
              :key="product.id"
              class="text-sm text-gray-800 hover:bg-gray-50"
            >
              <td class="px-6 py-4">
                <p class="font-medium text-gray-900">{{ product.name }}</p>
                <p v-if="product.description" class="line-clamp-1 text-xs text-gray-400">
                  {{ product.description }}
                </p>
              </td>
              <td class="px-6 py-4">
                <InventoryProductStatusBadge :status="product.status" />
              </td>
              <td class="px-6 py-4 font-medium">{{ formatPrice(product.price) }}</td>
              <td class="px-6 py-4">{{ product.stock }}</td>
              <td class="px-6 py-4">{{ product.category?.name ?? "-" }}</td>
              <td class="px-6 py-4">
                <div class="flex justify-end gap-1">
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    @click="openEdit(product)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    @click="askDelete(product)"
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
        <UPagination
          v-model:page="page"
          :total="data.total"
          :items-per-page="limit"
        />
      </div>
    </div>

    <!-- Modal crear/editar -->
    <InventoryProductFormModal
      v-model:open="formOpen"
      :categories="categories ?? []"
      :product="selectedProduct"
      @saved="onSaved"
    />

    <!-- Confirmación de borrado -->
    <UModal v-model:open="deleteOpen" title="Eliminar producto">
      <template #body>
        <p class="text-gray-600">
          ¿Seguro que deseas eliminar
          <span class="font-semibold">{{ productToDelete?.name }}</span>? Esta
          acción no se puede deshacer.
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
