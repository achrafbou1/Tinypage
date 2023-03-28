<template>
  <section class="bg-white dark:bg-gray-900">
    <div class="max-w-screen-xl justify-center">
      <div class="max-w-screen-md text-center mb-8 lg:mb-12"/>
      <div class="flex flex-row justify-center space-x-4">
        <!-- Pricing Card -->
        <div
            class="flex flex-col p-6 text-center text-gray-900 rounded-lg border shadow"
        >
          <h3 class="mb-4 text-2xl font-semibold">
            Monthly
          </h3>
          <div class="flex justify-center items-baseline my-8">
            <span class="mr-2 text-5xl font-extrabold">$5</span>
            <span class="text-gray-500 dark:text-gray-400">/month</span>
          </div>
          <ul role="list" class="mb-8 space-y-4 text-left">
            <li class="flex items-center space-x-3">
              <svg
                  class="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
              >
                <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                />
              </svg>
              <span>Publish one page</span>
            </li>
          </ul>
          <button
              type="button"
              class="w-full flex py-3 px-6 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold justify-center align-center"
              @click="initCheckout('price_1L9wX4EM2KnB58E0PRlDeLYk')"
          >Get
            started
          </button>
        </div>
        <div
            class="flex flex-col p-6 text-center text-gray-900 rounded-lg border shadow"
        >
          <h3 class="mb-4 text-2xl font-semibold">
            Yearly
          </h3>
          <div class="flex justify-center items-baseline my-8">
            <span class="mr-2 text-5xl font-extrabold">$49</span>
            <span class="text-gray-500 dark:text-gray-400">/year</span>
          </div>
          <ul role="list" class="mb-8 space-y-4 text-left">
            <li class="flex items-center space-x-3">
              <svg
                  class="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
              >
                <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                />
              </svg>
              <span>Publish one page</span>
            </li>
          </ul>
          <button
              type="button"
              class="w-full flex py-3 px-6 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold justify-center align-center"
              @click="initCheckout('price_1MVjYvEM2KnB58E0OYuhWmBJ')"
          >Get
            started
          </button>
        </div>
        <div
            class="flex flex-col p-6 text-center text-gray-900 rounded-lg border shadow"
        >
          <h3 class="mb-4 text-2xl font-semibold">
            Lifetime
          </h3>
          <div class="flex justify-center items-baseline my-8">
            <span class="mr-2 text-5xl font-extrabold">$49</span>
          </div>
          <ul role="list" class="mb-8 space-y-4 text-left">
            <li class="flex items-center space-x-3">
              <svg
                  class="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
              >
                <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                />
              </svg>
              <span>Publish one page</span>
            </li>
          </ul>
          <button
              type="button"
              class="w-full flex py-3 px-6 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold justify-center align-center"
              @click="initCheckout('price_1MVjV2EM2KnB58E0B8wEzxEC')"
          >Get
            started
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: 'PricingComponent',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  methods: {
    async initCheckout(priceId: string) {
      try {
        const token = this.$store.getters['auth/getToken'];

        const response = await this.$axios.post('/stripe/create-checkout-session', {
          token,
          profileId: this.data.id,
          priceId
        });

        window.location.replace(response.data);
      } catch (err) {
        console.error(err);
      }
    },
  }
});
</script>
