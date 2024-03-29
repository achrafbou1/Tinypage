<template>
  <div class="flex flex-col items-center justify-center bg-gray-100 min-h-screen">
    <section class="flex items-center justify-center flex-col mt-auto w-screen">
      <img :src="`${$customSettings.icons.mainIcon}`" alt="icon" style="max-width: 100px;">
      <h1 class="font-semibold text-3xl mt-2">
        Request a password reset
      </h1>
      <p class="text-gray-700 text-sm">Remember your password? <a
          class="text-blue-600 hover:text-blue-700"
          href="/create-account"
      >Login</a></p>
      <div
          v-if="error"
          class="flex flex-row p-2 mt-4 mb-2 bg-orange-200 text-orange-600 rounded w-11/12 max-w-sm justify-center items-center text-sm border border-orange-300 shadow-sm"
      >
        <img alt="caution" src="/icons/caution.svg" style="width: 12px;">
        <div class="flex flex-col ml-2">
          {{ error }}
        </div>
      </div>
      <div
          v-if="message"
          class="flex flex-row p-2 mt-4 mb-2 bg-green-200 text-green-600 rounded w-11/12 max-w-sm justify-center items-center text-sm text-center border border-green-300 shadow-sm"
      >
        <div class="flex flex-col ml-2">
          {{ message }}
        </div>
      </div>
      <form class="w-11/12 max-w-sm mt-4 p-6 bg-white rounded-md shadow-md flex-col" @submit.prevent>
        <div class="flex flex-col mb-4">
          <label class="font-medium text-sm">Email Address</label>
          <input
              v-model="email"
              aria-label="email"
              class="p-2 mt-2 text-sm border-solid border-gray-300 rounded border"
              placeholder="e.g. jane@gmail.com"
              type="email"
              @keyup.enter="requestReset"
          >
        </div>
        <button
            class="mt-2 w-full p-3 text-center text-sm text-white bg-blue-600 hover:bg-blue-400 rounded font-semibold"
            type="button"
            @click="requestReset"
        >
          Request reset link
        </button>
      </form>
    </section>
    <section class="flex text-center text-gray-600 text-sm mt-auto mb-4">All rights reserved.<br>Copyright ©2021
      {{ $customSettings.company }}
    </section>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import {StatusCodes} from "http-status-codes";

export default Vue.extend({
  name: 'ForgotPassword',

  data: () => {
    return {
      email: '',
      password: '',
      error: '',
      message: '',
    };
  },

  head() {
    return {
      title: 'Forgot your password? - ' + this.$customSettings.productName,
      meta: [
        {charset: 'utf-8'},
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, user-scalable=no'
        },
        {
          hid: 'description',
          name: 'description',
          content: 'Request a password rest for your ' + this.$customSettings.productName + ' account.'
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: 'Request a password rest for your ' + this.$customSettings.productName + ' account.'
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: 'Forgot your password? - ' + this.$customSettings.productName
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: 'Forgot your password? - ' + this.$customSettings.productName
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: 'Request a password rest for your ' + this.$customSettings.productName + ' account.'
        },
      ],
    };
  },

  methods: {
    async requestReset() {
      try {
        const request = await this.$axios.post('/user/request-reset-password', {
          email: this.email
        });
        if (request.status && request.status === 200) {
          this.error = '';
          this.message = 'Password reset has been sent, check your inbox.';
        }
      } catch (err) {
        console.error(err);

        this.message = '';
        this.error = err.toString();

        if (err.response) {
          if (err.response.status === StatusCodes.NOT_FOUND) {
            this.error = "The email couldn't be found, please make sure it's correct.";
          }

          if (err.response.status === StatusCodes.TOO_MANY_REQUESTS) {
            this.error = `Whoa, slow down! Error: ${err.response.data.message}`;
          }

          return;
        }

        throw err;
      }
    },

    clearErrors() {
      this.error = '';
    }
  }
});
</script>

<style lang="scss">
.NeutronLogo {
  width: 180px;
}
</style>
