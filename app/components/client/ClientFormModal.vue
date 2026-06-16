<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Client } from "~/types/client";
import { API_URL } from "~/constants/api";

const props = defineProps<{
  client?: Client | null;
}>();

const emit = defineEmits<{ saved: [] }>();

const open = defineModel<boolean>("open", { default: false });

const toast = useToast();
const loading = ref(false);

const isEdit = computed(() => !!props.client);

const schema = z.object({
  name: z
    .string("El nombre es requerido")
    .min(1, "El nombre es requerido")
    .max(255, "Máximo 255 caracteres"),
  phoneNumber: z
    .string()
    .max(15, "Máximo 15 caracteres")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(255, "Máximo 255 caracteres")
    .optional()
    .or(z.literal("")),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  name: undefined,
  phoneNumber: undefined,
  notes: undefined,
});

const token = useCookie("auth_token");

// Fill/clear form when modal opens
watch(open, (isOpen) => {
  if (!isOpen) return;
  state.name = props.client?.name || "";
  state.phoneNumber = props.client?.phoneNumber || "";
  state.notes = props.client?.notes || "";
});

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  loading.value = true;
  try {
    const url = isEdit.value
      ? `${API_URL}/clients/${props.client!.id}`
      : `${API_URL}/clients`;

    await $fetch(url, {
      method: isEdit.value ? "PATCH" : "POST",
      body: event.data,
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });

    toast.add({
      title: isEdit.value ? "Cliente actualizado" : "Cliente creado",
      color: "success",
    });
    open.value = false;
    emit("saved");
  } catch (error) {
    toast.add({
      title: "No se pudo guardar el cliente",
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
    :title="isEdit ? 'Editar cliente' : 'Agregar cliente'"
  >
    <template #body>
      <LazyUForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <LazyUFormField label="Nombre del cliente" name="name" required>
          <LazyUInput
            v-model="state.name"
            class="w-full"
            placeholder="Ej. Juan Pérez"
            aria-label="Nombre del cliente"
          />
        </LazyUFormField>

        <LazyUFormField label="Teléfono (opcional)" name="phoneNumber">
          <LazyUInput
            v-model="state.phoneNumber"
            class="w-full"
            placeholder="Ej. +51999999999"
            aria-label="Teléfono del cliente"
          />
        </LazyUFormField>

        <LazyUFormField label="Notas (opcional)" name="notes">
          <LazyUTextarea
            v-model="state.notes"
            class="w-full"
            :rows="3"
            placeholder="Ej. Cliente frecuente, prefiere entrega por las mañanas..."
            aria-label="Notas del cliente"
          />
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
