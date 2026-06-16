<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Supplier } from "~/types/supplier";
import { API_URL } from "~/constants/api";

const props = defineProps<{
  supplier?: Supplier | null;
}>();

const emit = defineEmits<{ saved: [] }>();

const open = defineModel<boolean>("open", { default: false });

const toast = useToast();
const loading = ref(false);

const isEdit = computed(() => !!props.supplier);

const schema = z.object({
  name: z
    .string("El nombre es requerido")
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  phoneNumber: z
    .string()
    .max(15, "Máximo 15 caracteres")
    .optional()
    .or(z.literal("")),
  ruc: z
    .string()
    .max(20, "Máximo 20 caracteres")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .max(255, "Máximo 255 caracteres")
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "El formato de correo no es válido",
    })
    .or(z.literal("")),
  address: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().optional(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  name: undefined,
  phoneNumber: undefined,
  ruc: undefined,
  email: undefined,
  address: undefined,
  isActive: true,
});

const token = useCookie("auth_token");

// Fill/clear form when modal opens
watch(open, (isOpen) => {
  if (!isOpen) return;
  state.name = props.supplier?.name || "";
  state.phoneNumber = props.supplier?.phoneNumber || "";
  state.ruc = props.supplier?.ruc || "";
  state.email = props.supplier?.email || "";
  state.address = props.supplier?.address || "";
  state.isActive = props.supplier ? props.supplier.isActive : true;
});

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  loading.value = true;
  try {
    const url = isEdit.value
      ? `${API_URL}/suppliers/${props.supplier!.id}`
      : `${API_URL}/suppliers`;

    await $fetch(url, {
      method: isEdit.value ? "PATCH" : "POST",
      body: event.data,
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });

    toast.add({
      title: isEdit.value ? "Proveedor actualizado" : "Proveedor creado",
      color: "success",
    });
    open.value = false;
    emit("saved");
  } catch (error) {
    toast.add({
      title: "No se pudo guardar el proveedor",
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
    :title="isEdit ? 'Editar proveedor' : 'Agregar proveedor'"
  >
    <template #body>
      <LazyUForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <LazyUFormField label="Nombre del proveedor" name="name" required>
          <LazyUInput
            v-model="state.name"
            class="w-full"
            placeholder="Ej. Distribuidora del Norte"
            aria-label="Nombre del proveedor"
          />
        </LazyUFormField>

        <div class="grid grid-cols-2 gap-4">
          <LazyUFormField label="RUC (opcional)" name="ruc">
            <LazyUInput
              v-model="state.ruc"
              class="w-full"
              placeholder="Ej. 20123456789"
              aria-label="RUC del proveedor"
            />
          </LazyUFormField>

          <LazyUFormField label="Teléfono (opcional)" name="phoneNumber">
            <LazyUInput
              v-model="state.phoneNumber"
              class="w-full"
              placeholder="Ej. +51999999999"
              aria-label="Teléfono del proveedor"
            />
          </LazyUFormField>
        </div>

        <LazyUFormField label="Correo electrónico (opcional)" name="email">
          <LazyUInput
            v-model="state.email"
            class="w-full"
            type="email"
            placeholder="Ej. contacto@distribuidora.com"
            aria-label="Correo electrónico del proveedor"
          />
        </LazyUFormField>

        <LazyUFormField label="Dirección (opcional)" name="address">
          <LazyUInput
            v-model="state.address"
            class="w-full"
            placeholder="Ej. Av. Larco 123, Trujillo"
            aria-label="Dirección del proveedor"
          />
        </LazyUFormField>

        <LazyUFormField v-if="isEdit" label="Estado (Activo)" name="isActive">
          <div class="flex items-center gap-2 pt-1">
            <LazyUSwitch
              v-model="state.isActive"
              aria-label="Proveedor activo"
            />
            <span class="text-sm text-gray-500">
              {{ state.isActive ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
        </LazyUFormField>

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
