<script setup lang="ts">
import type { Client, ClientListResponse } from "~/types/client";
import type { Product, ProductListResponse } from "~/types/product";
import type {
  CreateSalePayload,
  DocumentType,
  PaymentMethod,
} from "~/types/sale";
import {
  DOCUMENT_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from "~/types/sale";
import { API_URL } from "~/constants/api";

const emit = defineEmits<{ saved: [] }>();

const open = defineModel<boolean>("open", { default: false });

const toast = useToast();
const loading = ref(false);
const token = useCookie("auth_token");

const headers = computed(() => ({
  Authorization: token.value ? `Bearer ${token.value}` : "",
}));

// --- Opciones (clientes y productos) ---
const clients = ref<Client[]>([]);
const products = ref<Product[]>([]);

const loadOptions = async () => {
  try {
    const [clientRes, productRes] = await Promise.all([
      $fetch<ClientListResponse>(`${API_URL}/clients`, {
        query: { limit: 100 },
        headers: headers.value,
      }),
      $fetch<ProductListResponse>(`${API_URL}/products`, {
        query: { limit: 100 },
        headers: headers.value,
      }),
    ]);
    clients.value = clientRes.items;
    products.value = productRes.items;
  } catch (error) {
    toast.add({
      title: "No se pudieron cargar clientes/productos",
      color: "error",
    });
    console.error(error);
  }
};

const clientItems = computed(() =>
  clients.value.map((c) => ({ label: c.name, value: c.id })),
);

const productItems = computed(() =>
  products.value.map((p) => ({
    label: `${p.name} — S/ ${Number(p.price).toFixed(2)} (stock: ${p.stock})`,
    value: p.id,
  })),
);

// --- Estado del formulario ---
interface CartLine {
  productId: number;
  name: string;
  unitPrice: number;
  stock: number;
  quantity: number;
}

const selectedClientId = ref<number | undefined>(undefined);
const paymentMethod = ref<PaymentMethod>("EFECTIVO");
const documentType = ref<DocumentType>("TICKET");
const cart = ref<CartLine[]>([]);
const productToAdd = ref<number | undefined>(undefined);
const quantityToAdd = ref<number>(1);

// Reiniciar y cargar opciones al abrir
watch(open, (isOpen) => {
  if (!isOpen) return;
  selectedClientId.value = undefined;
  paymentMethod.value = "EFECTIVO";
  documentType.value = "TICKET";
  cart.value = [];
  productToAdd.value = undefined;
  quantityToAdd.value = 1;
  loadOptions();
});

const addLine = () => {
  if (!productToAdd.value) {
    toast.add({ title: "Selecciona un producto", color: "warning" });
    return;
  }

  const product = products.value.find((p) => p.id === productToAdd.value);
  if (!product) return;

  const qty = Number(quantityToAdd.value);
  if (!qty || qty < 1) {
    toast.add({ title: "La cantidad debe ser al menos 1", color: "warning" });
    return;
  }

  const existing = cart.value.find((l) => l.productId === product.id);
  const alreadyInCart = existing ? existing.quantity : 0;

  // Validación de stock en el cliente (el backend la vuelve a validar).
  if (qty + alreadyInCart > product.stock) {
    toast.add({
      title: "Stock insuficiente",
      description: `Solo hay ${product.stock} unidades de "${product.name}".`,
      color: "error",
    });
    return;
  }

  if (existing) {
    existing.quantity += qty;
  } else {
    cart.value.push({
      productId: product.id,
      name: product.name,
      unitPrice: Number(product.price),
      stock: product.stock,
      quantity: qty,
    });
  }

  productToAdd.value = undefined;
  quantityToAdd.value = 1;
};

const removeLine = (productId: number) => {
  cart.value = cart.value.filter((l) => l.productId !== productId);
};

const total = computed(() =>
  cart.value.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
);

const formatCurrency = (value: number) => `S/ ${value.toFixed(2)}`;

const onSubmit = async () => {
  if (cart.value.length === 0) {
    toast.add({ title: "Agrega al menos un producto", color: "warning" });
    return;
  }

  loading.value = true;
  try {
    const payload: CreateSalePayload = {
      clientId: selectedClientId.value,
      paymentMethod: paymentMethod.value,
      documentType: documentType.value,
      items: cart.value.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
      })),
    };

    await $fetch(`${API_URL}/sales`, {
      method: "POST",
      body: payload,
      headers: headers.value,
    });

    toast.add({ title: "Venta registrada con éxito", color: "success" });
    open.value = false;
    emit("saved");
  } catch (error) {
    toast.add({
      title: "No se pudo registrar la venta",
      description: "Revisa el stock disponible e inténtalo de nuevo.",
      color: "error",
    });
    console.error(error);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <UModal v-model:open="open" title="Registrar nueva venta" :ui="{ content: 'max-w-2xl' }">
    <template #body>
      <div class="space-y-5">
        <!-- Cliente (opcional) -->
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            Cliente (opcional)
          </label>
          <USelectMenu
            v-model="selectedClientId"
            :items="clientItems"
            value-key="value"
            placeholder="Venta sin cliente / selecciona uno"
            class="w-full"
          />
        </div>

        <!-- Método de pago y tipo de comprobante -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Método de pago
            </label>
            <USelect
              v-model="paymentMethod"
              :items="PAYMENT_METHOD_OPTIONS"
              value-key="value"
              class="w-full"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Tipo de comprobante
            </label>
            <USelect
              v-model="documentType"
              :items="DOCUMENT_TYPE_OPTIONS"
              value-key="value"
              class="w-full"
            />
          </div>
        </div>

        <!-- Agregar producto -->
        <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p class="mb-3 text-sm font-semibold text-gray-700">
            Agregar producto
          </p>
          <div class="flex flex-wrap items-end gap-3">
            <div class="min-w-48 flex-1">
              <label class="mb-1 block text-xs text-gray-500">Producto</label>
              <USelectMenu
                v-model="productToAdd"
                :items="productItems"
                value-key="value"
                placeholder="Selecciona un producto"
                class="w-full"
              />
            </div>
            <div class="w-24">
              <label class="mb-1 block text-xs text-gray-500">Cantidad</label>
              <UInput
                v-model.number="quantityToAdd"
                type="number"
                :min="1"
                class="w-full"
              />
            </div>
            <UButton
              icon="i-lucide-plus"
              label="Agregar"
              color="neutral"
              @click="addLine"
            />
          </div>
        </div>

        <!-- Carrito -->
        <div class="overflow-hidden rounded-xl border border-gray-200">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 text-xs font-semibold text-gray-600">
              <tr>
                <th class="px-4 py-2">PRODUCTO</th>
                <th class="px-4 py-2 text-right">P. UNIT.</th>
                <th class="px-4 py-2 text-center">CANT.</th>
                <th class="px-4 py-2 text-right">SUBTOTAL</th>
                <th class="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="cart.length === 0">
                <td colspan="5" class="px-4 py-6 text-center text-gray-400">
                  Aún no has agregado productos.
                </td>
              </tr>
              <tr v-for="line in cart" v-else :key="line.productId">
                <td class="px-4 py-2 font-medium text-gray-800">
                  {{ line.name }}
                </td>
                <td class="px-4 py-2 text-right text-gray-600">
                  {{ formatCurrency(line.unitPrice) }}
                </td>
                <td class="px-4 py-2 text-center text-gray-600">
                  {{ line.quantity }}
                </td>
                <td class="px-4 py-2 text-right font-semibold text-gray-900">
                  {{ formatCurrency(line.unitPrice * line.quantity) }}
                </td>
                <td class="px-4 py-2 text-right">
                  <UButton
                    aria-label="Quitar producto"
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    @click="removeLine(line.productId)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Total -->
        <div class="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
          <span class="text-sm font-semibold text-gray-700">TOTAL</span>
          <span class="text-2xl font-bold text-primary">
            {{ formatCurrency(total) }}
          </span>
        </div>

        <!-- Acciones -->
        <div class="flex justify-end gap-2 pt-1">
          <UButton
            color="neutral"
            variant="outline"
            label="Cancelar"
            @click="open = false"
          />
          <UButton
            label="Registrar venta"
            icon="i-lucide-check"
            :loading="loading"
            @click="onSubmit"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
