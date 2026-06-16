<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
import type { ResponseAuthLogin } from "~/types/auth";
import { USER_STORE } from "~/stores/constants";
import { API_URL } from "~/constants/api";

const isLoading = ref<boolean>(false);
const error = ref();
const router = useRouter();

const fields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: "Correo",
    placeholder: "Ingresa tu correo electrónico",
    required: true,
  },
  {
    name: "password",
    label: "Contraseña",
    type: "password",
    placeholder: "Ingresa tu contraseña",
    required: true,
  },
];

const schema = z.object({
  email: z.email("Correo invalido"),
  password: z
    .string("La contraseña es requerida")
    .min(8, "Debe tener al menos 8 caractéres"),
});

type Schema = z.output<typeof schema>;

const onSubmit = async (payload: FormSubmitEvent<Schema>) => {
  isLoading.value = true;

  try {
    const response = await $fetch<ResponseAuthLogin>(`${API_URL}/auth/login`, {
      method: "POST",
      body: payload.data,
    });

    const token = useCookie("auth_token");
    token.value = response.token;

    const userCookie = useCookie("user_info");
    userCookie.value = JSON.stringify(response.user);

    useState(USER_STORE, () => response);
    error.value = "";
    router.push("/dashboard");
  } catch {
    error.value = "Credenciales invalidas";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <UMain class="flex items-center h-screen">
    <div class="flex flex-col justify-center items-center gap-4 p-4 w-full">
      <UPageCard class="w-full max-w-md">
        <UAuthForm
          :schema="schema"
          description="Ingresa tus credenciales para acceder a tu cuenta"
          icon="i-lucide-user"
          :fields="fields"
          @submit="onSubmit"
          :loading="isLoading"
          :submit="{
            label: 'Iniciar sesión',
            class: 'text-lg rounded-xl',
          }"
        >
          <template #title>
            <h1>Inicia sesión</h1>
          </template>

          <template v-if="error" #validation>
            <LazyUAlert
              color="error"
              class="rounded-xl"
              icon="i-lucide-info"
              :title="error"
            />
          </template>
        </UAuthForm>
      </UPageCard>
    </div>
  </UMain>
</template>
