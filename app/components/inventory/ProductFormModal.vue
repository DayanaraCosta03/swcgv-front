<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Category } from "~/types/category";
import type { Product } from "~/types/product";
import { API_URL } from "~/constants/api";

const props = defineProps<{
  product?: Product | null;
}>();

const emit = defineEmits<{ saved: [] }>();

const open = defineModel<boolean>("open", { default: false });

const toast = useToast();
const loading = ref(false);

const isEdit = computed(() => !!props.product);

const schema = z.object({
  name: z
    .string("El nombre es requerido")
    .min(1, "El nombre es requerido")
    .max(200, "Máximo 200 caracteres"),
  description: z.string().max(1000, "Máximo 1000 caracteres").optional(),
  price: z
    .number("El precio es requerido")
    .positive("El precio debe ser mayor a 0"),
  stock: z
    .number("El stock es requerido")
    .int("Debe ser un número entero")
    .min(0, "El stock no puede ser negativo"),
  categoryName: z
    .string("La categoría es requerida")
    .min(1, "La categoría es requerida")
    .max(50, "Máximo 50 caracteres"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  name: undefined,
  description: undefined,
  price: undefined,
  stock: undefined,
  categoryName: undefined,
});

const categoriesList = ref<Category[]>([]);
const token = useCookie("auth_token");

let searchTimeout: any = null;

// Watch categoryName changes to fetch matching categories for the datalist
watch(
  () => state.categoryName,
  (newVal) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      const searchVal = newVal?.trim() || "";
      try {
        const data = await $fetch<Category[]>(`${API_URL}/categories`, {
          query: { search: searchVal, limit: 10 },
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        });
        categoriesList.value = data;
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }, 300);
  },
  { immediate: true },
);

onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout);
});

// Rellena/limpia el formulario cada vez que se abre el modal.
watch(open, (isOpen) => {
  if (!isOpen) return;
  state.name = props.product?.name;
  state.description = props.product?.description || undefined;
  state.price = props.product ? Number(props.product.price) : undefined;
  state.stock = props.product?.stock;
  state.categoryName = props.product?.category?.name || undefined;
});

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  loading.value = true;
  try {
    const url = isEdit.value
      ? `${API_URL}/products/${props.product!.id}`
      : `${API_URL}/products`;

    await $fetch(url, {
      method: isEdit.value ? "PATCH" : "POST",
      body: event.data,
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });

    toast.add({
      title: isEdit.value ? "Producto actualizado" : "Producto creado",
      color: "success",
    });
    open.value = false;
    emit("saved");
  } catch (error) {
    // No exponemos el detalle del error; mensaje genérico al usuario.
    toast.add({
      title: "No se pudo guardar el producto",
      description: "Revisa los datos e inténtalo de nuevo.",
      color: "error",
    });
    console.error(error);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <UModal
    v-model:open="open"
    :title="isEdit ? 'Editar producto' : 'Agregar producto'"
  >
    <template #body>
      <LazyUForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <LazyUFormField label="Nombre del producto" name="name" required>
          <LazyUInput
            v-model="state.name"
            class="w-full"
            placeholder="Ej. Rosal rojo"
          />
        </LazyUFormField>

        <LazyUFormField label="Categoría" name="categoryName" required>
          <LazyUInput
            v-model="state.categoryName"
            class="w-full"
            placeholder="Escribe o selecciona una categoría"
            list="categories-list"
          />
          <datalist id="categories-list">
            <option v-for="c in categoriesList" :key="c.id" :value="c.name" />
          </datalist>
        </LazyUFormField>

        <LazyUFormField label="Descripción (opcional)" name="description">
          <LazyUTextarea
            v-model="state.description"
            class="w-full"
            :rows="3"
            placeholder="Detalles del producto"
          />
        </LazyUFormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LazyUFormField label="Precio (S/.)" name="price" required>
            <LazyUInput
              v-model.number="state.price"
              type="number"
              step="0.01"
              min="0"
              class="w-full"
              placeholder="0.00"
            />
          </LazyUFormField>

          <LazyUFormField label="Stock inicial" name="stock" required>
            <LazyUInput
              v-model.number="state.stock"
              type="number"
              min="0"
              class="w-full"
              placeholder="0"
            />
          </LazyUFormField>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <LazyUButton
            color="neutral"
            variant="outline"
            label="Cancelar"
            @click="open = false"
          />
          <LazyUButton type="submit" label="Guardar" :loading="loading" />
        </div>
      </LazyUForm>
    </template>
  </UModal>
</template>
