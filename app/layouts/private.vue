<script setup lang="ts">
const mobileMenuOpen = ref(false);
</script>

<template>
  <div class="flex min-h-screen bg-gray-50">
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

      <!-- Fondo sólido claro (gris suave): máxima legibilidad y look moderno. -->
      <main class="min-w-0 flex-1 bg-gray-50 p-4 sm:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
