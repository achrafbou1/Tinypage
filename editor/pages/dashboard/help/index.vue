<template>
  <section class="flex flex-col p-8 items-center overflow-x-hidden overflow-y-scroll">
    <div class="flex flex-row items-center justify-start mb-4 space-x-4 mb-4">
      <img class="w-8" src="/editor/static/icons/Rainbow.svg">
      <h1 class="text-black font-extrabold tracking-tight text-3xl w-full flex flex-row items-start lg:items-center">
        Appearance
      </h1>
    </div>
    <!-- Customization -->
    <div class="flex flex-col p-6 bg-white shadow rounded-xl w-full mb-8 mt-4">
      <div
          class="flex flex-col lg:flex-row space-y-1 lg:space-y-0 items-start lg:justify-between lg:items-center w-full mb-2"
      >
        <h2 class="text-gray-800 font-semibold text-lg">
          Under construction
        </h2>
      </div>
    </div>
  </section>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: 'Index'
});
</script>
