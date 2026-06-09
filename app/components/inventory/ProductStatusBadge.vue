<script setup lang="ts">
import type { ProductStatus } from "~/types/product";

const props = defineProps<{ status: ProductStatus }>();

const config = computed(() => {
  switch (props.status) {
    case "EN_STOCK":
      return { label: "EN STOCK", color: "success" as const };
    case "STOCK_BAJO":
      return { label: "STOCK BAJO", color: "warning" as const };
    default:
      return { label: "SIN STOCK", color: "error" as const };
  }
});
</script>

<template>
  <UBadge :color="config.color" variant="subtle" class="font-semibold">
    {{ config.label }}
  </UBadge>
</template>
