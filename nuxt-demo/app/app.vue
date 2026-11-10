<template>
  <!-- La clave por ruta completa hace que cada película monte su propia página -->
  <NuxtPage :page-key="route => route.fullPath" />
</template>
