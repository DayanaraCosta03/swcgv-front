<script setup lang="ts">
defineProps<{ showLogo?: boolean }>();
const emit = defineEmits<{ navigate: [] }>();

// Estructura de navegación del sistema (no son "datos", es el menú de la app).
const links = [
  { label: "Dashboard", to: "/dashboard", icon: "i-lucide-layout-dashboard" },
  { label: "Inventario", to: "/inventario", icon: "i-lucide-boxes" },
  { label: "Clientes", to: "/clientes", icon: "i-lucide-users" },
  { label: "Proveedores", to: "/proveedores", icon: "i-lucide-truck" },
  { label: "Ventas", to: "/ventas", icon: "i-lucide-shopping-cart" },
  { label: "Reportes", to: "/reportes", icon: "i-lucide-bar-chart-3" },
];
</script>

<template>
  <div class="flex h-full flex-col text-white">
    <div v-if="showLogo" class="flex flex-col items-center gap-3 px-6 pt-8 pb-6">
      <NuxtImg
        src="/images/logo-vivero.png"
        alt="Logo Vivero La Huerta"
        width="96"
        height="96"
        densities="x1 x2"
        format="webp"
        class="size-24 object-contain"
      />
      <p class="text-center text-2xl font-black leading-tight tracking-wide">
        VIVERO<br />LA HUERTA
      </p>
    </div>

    <nav class="flex-1 space-y-1 px-4 py-4">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="flex items-center gap-3 rounded-xl px-4 py-3 text-lg font-semibold transition-colors hover:bg-white/10"
        active-class="bg-secondary/25 text-secondary"
        @click="emit('navigate')"
      >
        <UIcon :name="link.icon" class="size-6 shrink-0" />
        <span>{{ link.label }}</span>
      </NuxtLink>
    </nav>

    <p class="px-6 py-5 text-center text-sm font-semibold text-white/60">
      Guadalupe - 2026
    </p>
  </div>
</template>
