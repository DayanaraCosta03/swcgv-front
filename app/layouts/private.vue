<script setup lang="ts">
const mobileMenuOpen = ref(false);
</script>

<template>
  <div class="flex min-h-screen bg-[#274025]">
    <!-- Sidebar fijo (escritorio) -->
    <aside class="hidden w-72 shrink-0 bg-black lg:block">
      <AppSidebarNav show-logo />
    </aside>

    <!-- Drawer (móvil) -->
    <USlideover
      v-model:open="mobileMenuOpen"
      side="left"
      :ui="{ content: 'w-72 max-w-[85%]' }"
    >
      <template #content>
        <div class="flex h-full flex-col bg-black">
          <div class="flex items-center justify-between px-4 pt-4 text-white">
            <span class="text-lg font-semibold tracking-wide">MENÚ</span>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              class="text-white"
              @click="mobileMenuOpen = false"
            />
          </div>
          <AppSidebarNav show-logo @navigate="mobileMenuOpen = false" />
        </div>
      </template>
    </USlideover>

    <!-- Contenido -->
    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Topbar móvil con botón de menú -->
      <header
        class="flex items-center gap-3 bg-black px-4 py-3 text-white lg:hidden"
      >
        <UButton
          icon="i-lucide-menu"
          color="neutral"
          variant="ghost"
          class="text-white"
          @click="mobileMenuOpen = true"
        />
        <span class="text-lg font-black tracking-wide">VIVERO LA HUERTA</span>
      </header>

      <main class="relative min-w-0 flex-1 p-4 sm:p-6">
        <!-- Foto de fondo del vivero (como en el diseño), optimizada por @nuxt/image -->
        <NuxtImg
          src="/images/inventario-bg.png"
          alt=""
          aria-hidden="true"
          format="webp"
          quality="70"
          width="1752"
          height="1333"
          class="pointer-events-none absolute inset-0 size-full object-cover opacity-81"
        />
        <div class="relative">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
