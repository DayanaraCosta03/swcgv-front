export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie("auth_token");

  // If token doesn't exist and the target route is not login (/), redirect to /
  if (!token.value && to.path !== "/") {
    return navigateTo("/");
  }

  // If token exists and the target route is login (/), redirect to /inventario
  if (token.value && to.path === "/") {
    return navigateTo("/inventario");
  }
});
