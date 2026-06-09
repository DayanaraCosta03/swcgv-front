<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Category } from "~/types/category";
import type { Product } from "~/types/product";
import { API_URL } from "~/constants/api";

const props = defineProps<{
  categories: Category[];
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
  categoryId: z.number("Selecciona una categoría"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  name: undefined,
  description: undefined,
  price: undefined,
  stock: undefined,
  categoryId: undefined,
});

const categoryItems = computed(() =>
  props.categories.map((c) => ({ label: c.name, value: c.id })),
);

// Rellena/limpia el formulario cada vez que se abre el modal.
watch(open, (isOpen) => {
  if (!isOpen) return;
  state.name = props.product?.name;
  state.description = props.product?.description || undefined;
  state.price = props.product ? Number(props.product.price) : undefined;
  state.stock = props.product?.stock;
  state.categoryId = props.product?.categoryId;
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
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Nombre del producto" name="name" required>
          <UInput v-model="state.name" class="w-full" placeholder="Ej. Rosal rojo" />
        </UFormField>

        <UFormField label="Categoría" name="categoryId" required>
          <USelect
            v-model="state.categoryId"
            :items="categoryItems"
            class="w-full"
            placeholder="Selecciona una categoría"
          />
        </UFormField>

        <UFormField label="Descripción (opcional)" name="description">
          <UTextarea
            v-model="state.description"
            class="w-full"
            :rows="3"
            placeholder="Detalles del producto"
          />
        </UFormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField label="Precio (S/.)" name="price" required>
            <UInput
              v-model.number="state.price"
              type="number"
              step="0.01"
              min="0"
              class="w-full"
              placeholder="0.00"
            />
          </UFormField>

          <UFormField label="Stock inicial" name="stock" required>
            <UInput
              v-model.number="state.stock"
              type="number"
              min="0"
              class="w-full"
              placeholder="0"
            />
          </UFormField>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            color="neutral"
            variant="outline"
            label="Cancelar"
            @click="open = false"
          />
          <UButton type="submit" label="Guardar" :loading="loading" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
