<template>
  <div class="w-screen min-h-screen flex flex-col lg:flex-row text-black">
    <section class="w-full flex flex-col lg:h-screen p-12 items-start justify-center">
      <div class="flex flex-col max-w-lg w-full mx-auto">
        <h1 class="text-5xl font-bold">
          Login
        </h1>
        <p class="opacity-70 font-bold text-2xl mb-8">
          Manage and monitor your
          {{ $customSettings.productName }} sites.
        </p>
        <a
          class="flex flex-row items-center font-bold justify-center rounded-full w-full px-8 py-4 text-lg border-gray-300 hover:border-gray-600"
          href="#"
          style="border-width:3px;border-style:solid;"
          @click="attemptGoogleLogin"
        >
          <img class="w-5 mr-4" src="/icons/google-icon.png">
          Sign in with Google
        </a>
        <div class="w-full flex flex-row items-center justify-center opacity-60 my-4">
          <div class="line"/>
          <p class="mx-4 font-bold">
            Or, sign in with email
          </p>
          <div class="line"/>
        </div>
        <div class="input-group flex flex-col w-full mb-4">
          <label>Email address</label>
          <input v-model="email" placeholder="e.g. jane@email.com" type="text">
        </div>
        <div class="input-group flex flex-col w-full mb-4">
          <label>Password</label>
          <input v-model="password" placeholder="Minimum 8 characters" type="password">
        </div>
        <div class="flex flex-row items-center justify-apart w-full my-4">
          <div class="flex flex-row justify-start items-center" style="width:150px;">
            <input
              id="remember-me"
              v-model="rememberMe"
              name="remember_me"
              style="border-radius:3px;width:15px;height:15px;"
              type="checkbox"
            >
            <label
              class="opacity-50 ml-3 font-bold"
              for="remember-me"
              style="margin-bottom:0;width:105px;font-size: 14px;"
            >
              <nobr>Remember me?</nobr>
            </label>
          </div>
          <a class="text-blue-500 hover:underline ml-auto font-bold" href="/forgot-password">Forgot your password?</a>
        </div>
        <div class="button cursor-pointer" @click="attemptEmailLogin()">Login to your account</div>
        <div v-if="error" class="error">
          {{ error }}
        </div>
        <a class="mx-auto text-center font-bold text-blue-500 mb-4 text-sm hover:underline font-bold"
           href="/create-account">Don't have an
          account? Get started free</a>
        <span class="mx-auto font-bold text-center opacity-50 text-sm">©{{
            new Date().getFullYear()
          }} {{ $customSettings.company }}, All rights reserved.</span>
      </div>
    </section>

    <section
      class="hidden lg:flex order-first lg:order-last right w-full lg:w-1/2 xl:w-7/12 flex-col lg:h-screen text-center items-center justify-center p-12 text-white"
    >
      <img class="w-full max-w-sm" src="/integrations.png">
      <h3 class="text-4xl font-bold max-w-sm mb-4">
        Integrations for all of your favorite apps
      </h3>
      <p class="text-2xl opacity-80 max-w-md">Connect your micro-site with your content from all your favorite
        platforms</p>
    </section>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import {StatusCodes} from "http-status-codes";

export default Vue.extend({
  name: 'Index',
  middleware: 'unauthenticated',

  data: () => {
    return {
      email: '',
      password: '',
      error: '',
      rememberMe: false,
      hostname: process.env.HOSTNAME,
      app_name: process.env.APP_NAME,
      icon_url: process.env.ICON_URL,
      organization: process.env.ORGANIZATION,
      free_signup: process.env.FREE_SIGNUP,
      icon_width: process.env.ICON_WIDTH,
      errorIntervalHandler: undefined as any
    };
  },

  head() {
    return {
      title: 'Login - ' + this.$customSettings.productName,
      meta: [
        {charset: 'utf-8'},
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, user-scalable=no'
        },
        {
          hid: 'description',
          name: 'description',
          content: 'Login to your ' + this.$customSettings.productName + ' account.'
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: 'Login to your ' + this.$customSettings.productName + ' account.'
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: 'Login - ' + this.$customSettings.productName
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: 'Login - ' + this.$customSettings.productName
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: 'Login to your ' + this.$customSettings.productName + ' account.'
        },
      ],
    };
  },

  methods: {
    async attemptEmailLogin() {
      this.$nuxt.$loading.start();

      if (!this.email) {
        this.error = 'Email address is required to login.';

        if (this.errorIntervalHandler !== undefined)
          clearInterval(this.errorIntervalHandler);

        this.errorIntervalHandler = setInterval(this.clearErrors, 5000);

        this.$nuxt.$loading.finish();
        return;
      }

      if (!this.password) {
        this.error = 'Password is required to login.';

        if (this.errorIntervalHandler !== undefined)
          clearInterval(this.errorIntervalHandler);

        this.errorIntervalHandler = setInterval(this.clearErrors, 5000);

        this.$nuxt.$loading.finish();
        return;
      }

      this.$cookies.set("remember_auth", this.rememberMe);

      try {
        const response = await this.$axios.post('/user/login', {
          email: this.email,
          password: this.password
        });

        this.$store.commit('auth/login', response.data.token);
        localStorage.setItem("email", this.email);

        this.$nuxt.$loading.finish();
        this.$router.push('/dashboard');
      } catch (err) {
        console.log('Login failed');

        if (err.response.status === StatusCodes.FORBIDDEN) {
          this.error = err.response.data.error;

          if (this.errorIntervalHandler !== undefined)
            clearInterval(this.errorIntervalHandler);

          this.errorIntervalHandler = setInterval(this.clearErrors, 5000);

          await this.$nuxt.$loading.finish();
          return;
        } else if (err.response.status === StatusCodes.UNAUTHORIZED) {
          this.error = 'Your email or password is incorrect!';

          if (this.errorIntervalHandler !== undefined)
            clearInterval(this.errorIntervalHandler);

          this.errorIntervalHandler = setInterval(this.clearErrors, 5000);

          await this.$nuxt.$loading.finish();
          return;
        }

        await this.$nuxt.$loading.finish();
      }
    },

    async attemptGoogleLogin() {
      this.$cookies.set("remember_auth", this.rememberMe);

      const response = await this.$axios.post('/auth/google/request-login');

      window.location.assign(response.data);
    },

    clearErrors() {
      this.error = '';
    }
  }
});
</script>

<style>
body {
  background: #FEFEFE;
}

.NeutronLogo {
  width: 180px;
}

* {
  outline: none !important;
}

.right {
  background-color: #478ecc;
  background-image: url('/login-lightning.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: top left;
}

.line {
  height: 1px;
  width: auto;
  flex-grow: 1;
  background: rgba(0, 0, 0, .2);
}

label {
  @apply mb-2 text-lg font-bold;
}

.input-group input {
  @apply w-full rounded-full px-8 py-3 text-lg text-gray-800 font-bold outline-none;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, .1);
  transition: .1s ease-in;
}

.input-group input:focus {
  box-shadow: 0 0 0 4.5px rgba(71, 142, 204, 0.8);
}

.button {
  color: #FFF !important;
}

.button {
  @apply mb-8 w-full font-bold rounded-full px-8 py-4 text-lg text-center;
  background: #478ecc;
  background: linear-gradient(to bottom, #478ecc, #1063ab);
  box-shadow: inset 0 0 0 3px rgba(255, 255, 255, .2), 0 2px 25px rgba(71, 142, 204, 0.25);
  transition: .1s ease-in;
}

.button:hover {
  transform: scale(1.01);
  box-shadow: inset 0 0 0 4px rgba(255, 255, 255, .4), 0 2px 15px rgba(71, 142, 204, 0.75);
}

.button:focus {
  transform: scale(1);
  box-shadow: inset 0 0 0 5px rgba(255, 255, 255, .5), 0 2px 20px rgb(0, 15, 242);
}

.error {
  @apply bottom-0 rounded-lg shadow border border-gray-200;
  color: mintcream;
  background-color: #ff4a4a;
  padding: 7px;
  z-index: 25;
}

</style>
