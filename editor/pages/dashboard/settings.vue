<template>
  <section class="flex flex-col p-8 items-center overflow-x-hidden overflow-y-scroll">
    <div class="flex flex-row items-center justify-start mb-4 space-x-4 mb-4">
      <img class="w-8" src="/icons/Settings.svg">
      <h1 class="text-black font-extrabold tracking-tight text-3xl w-full flex flex-row items-start lg:items-center">
        Page Settings
      </h1>
    </div>
    <div class="flex flex-col p-6 bg-white shadow rounded-2xl w-full mb-8">
      <transition name="fade">
        <div
            v-if="error"
            class="flex flex-row p-2 mb-4 bg-orange-200 text-orange-600 rounded-2xl w-full justify-center items-center text-sm border border-orange-300 shadow-sm"
        >
          <img alt="caution" src="/icons/caution.svg" style="width: 12px;">
          <div class="flex flex-col ml-2">
            {{ error }}
          </div>
        </div>
      </transition>

      <h2 class="text-black font-bold text-xl w-full mb-2">
        Site details
      </h2>
      <form class="flex flex-col w-full">
        <div class="flex flex-col lg:flex-row mb-3">
          <div class="flex flex-col w-full lg:w-1/2 mr-4 mb-3 lg:mb-0">
            <label class="font-bold opacity-70 text-sm text-black" for="name">Headline</label>
            <input
                id="name"
                v-model="user.activeProfile.headline"
                class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
                placeholder="e.g. Jane Doe, 21"
                type="text"
            >
          </div>
          <div class="flex flex-col w-full lg:w-1/2">
            <label class="font-bold opacity-70 text-sm text-black" for="subtitle">Subtitle</label>
            <input
                id="subtitle"
                v-model="user.activeProfile.subtitle"
                class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
                placeholder="e.g. Developer at Neutron from Raleigh NC"
                type="text"
            >
          </div>
        </div>

        <div class="flex flex-col lg:flex-row mb-4">
          <div class="flex flex-col w-full lg:w-1/2 mr-3 mb-3 lg:mb-0">
            <label class="font-bold opacity-70 text-sm text-black" for="handle">Handle</label>
            <div class="flex flex-row rounded-2xl border border-solid border-gray-300 text-sm mt-2 overflow-hidden">
              <span
                  class="flex p-2 bg-gray-100 border text-gray-900 border-solid border-gray-300 border-t-0 border-l-0 border-b-0"
              >{{ rendererUrl }}/</span>
              <input
                  id="handle"
                  v-model="user.activeProfile.handle"
                  autocomplete="off"
                  class="p-2 flex-grow"
                  placeholder="e.g. janedoe"
                  type="text"
              >
            </div>
          </div>
          <div class="flex flex-col w-full lg:w-1/2">
            <label class="font-bold opacity-70 text-sm text-black">Visibility {{ getFormattedProfileUsage() }}</label>
            <select
                id="visibility"
                v-model="user.activeProfile.visibility"
                class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
            >
              <option value="unpublished">
                Unpublished, not viewable
              </option>
              <option value="published">
                Public, no sensitive content (Most used)
              </option>
              <option value="published-18+">
                Public, sensitive content warning
              </option>
            </select>
          </div>
        </div>

        <div class="flex flex-row items-center justify-center space-x-4 mb-4">
          <!--          <input-->
          <!--            id="avatar_url"-->
          <!--            v-model="user.activeProfile.imageUrl"-->
          <!--            class="simple-file-upload"-->
          <!--            name="avatar_url"-->
          <!--            type="hidden"-->
          <!--          >-->
          <div class="flex flex-col lg:flex-row w-auto flex-grow flex-1">
            <div class="flex flex-col w-full lg:w-1/2 mr-3 mb-3 lg:mb-0">
              <label class="font-bold opacity-70 text-sm text-black" for="image_url">Avatar Image URL</label>
              <input
                  id="image_url"
                  v-model="user.activeProfile.imageUrl"
                  class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
                  placeholder="e.g. https://uifaces.co/our-content/donated/rSuiu_Hr.jpg"
                  type="text"
              >
            </div>
            <div class="flex flex-col w-full lg:w-1/2">
              <label class="font-bold opacity-70 text-sm text-black" for="image_url">Cover Image URL</label>
              <input
                  id="cover_image_url"
                  v-model="user.activeProfile.metadata.coverImage"
                  class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
                  placeholder="e.g. https://i.imgur.com/KM7HbTC.png"
                  type="text"
              >
            </div>
          </div>
        </div>

        <!--        <div class="flex flex-col w-full mb-6">-->
        <!--          &lt;!&ndash; Custom domain&ndash;&gt;-->
        <!--          <div-->
        <!--              class="flex flex-col lg:flex-row space-y-1 lg:space-y-0 items-start lg:justify-between lg:items-center w-full"-->
        <!--          >-->
        <!--            <label class="font-bold text-sm text-black opacity-70" for="custom_domain">Custom domain</label>-->
        <!--            <a-->
        <!--                class="text-black font-bold opacity-50 text-xs hover:underline hover:opacity-80"-->
        <!--                href="https://www.notion.so/neutroncreative/Setting-up-your-custom-domain-907421b1ac3841dbbd8d9a7d41d17f9a"-->
        <!--            >Need help? Read our documentation</a>-->
        <!--          </div>-->

        <!--          <input-->
        <!--              id="custom_domain"-->
        <!--              v-model="user.activeProfile.customDomain"-->
        <!--              class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"-->
        <!--              placeholder="e.g. neutroncreative.com (no http/https)"-->
        <!--              type="text"-->
        <!--          >-->

        <!--          <div-->
        <!--              class="flex flex-col lg:flex-row space-y-1 lg:space-y-0 p-4 items-start lg:justify-between lg:items-center w-full"-->
        <!--          >-->
        <!--            <label class="font-bold text-sm text-black opacity-70" for="custom_domain">-->
        <!--              Make sure you set this TXT Record in your DNS options.<br>-->
        <!--              <span class="bg-blue-200">{{ getTXTRecord }}</span>-->
        <!--            </label>-->
        <!--          </div>-->
        <!--        </div>-->

        <!-- Use Gravatar toggle -->
        <div class="flex flex-row w-full mb-6 items-start">
          <input
              v-model="user.activeProfile.metadata.showAvatar"
              aria-label="show avatar"
              class="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
              style="margin-top:3px;"
              type="checkbox"
          >

          <label
              class="ml-4 block text-sm leading-5 text-black font-bold opacity-70"
          >
            Show Avatar
          </label>
        </div>

        <!-- Watermark Toggle -->
        <div class="flex flex-row w-full mb-6 items-start">
          <input
              id="themeGlobal"
              v-model="user.activeProfile.showWatermark"
              class="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
              style="margin-top:3px;"
              type="checkbox"
          >

          <label
              class="ml-4 flex font-bold text-sm leading-5 opacity-70 w-full lg:w-auto flex-col"
              for="themeGlobal"
              style="max-width:calc(100% - 32px)"
          >
            Display Watermark ("Proudly built with {{ app_name }}!")
            <br>
            <span
                v-show="showWatermarkNotice"
                class="mt-2 flex text-gdp p-1 px-4 rounded-full bg-opaqueIndigo font-bold text-xs lg:text-sm"
            >
              This is completely optional, but it really helps us out! Would you help us spread the word about
              {{ app_name }}?
            </span>
          </label>
        </div>

        <!-- Privacy mode toggle -->
        <div class="flex flex-row w-full mb-6 items-start">
          <input
              v-model="user.activeProfile.metadata.privacyMode"
              aria-label="privacy mode"
              class="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
              style="margin-top:3px;"
              type="checkbox"
          >

          <label class="ml-4 block text-sm leading-5 text-black font-bold opacity-70">
            Privacy mode (Disables site analytics, discovery, and event tracking)
          </label>
        </div>

        <!-- Share button toggle -->
        <div class="flex flex-row w-full mb-6 items-start">
          <input
              v-model="user.activeProfile.metadata.shareMenu"
              aria-label="privacy mode"
              class="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
              style="margin-top:3px;"
              type="checkbox"
          >

          <label class="ml-4 block text-sm leading-5 text-black font-bold opacity-70">
            Show Share Menu
          </label>
        </div>

        <!-- Page HTML -->
        <div class="flex flex-col mb-4 justify-start w-full">

          <div class="flex flex-row justify-start items-center">
            <label class="font-semibold mb-2 mr-4">Page HTML</label>

            <div class="flex flex-row space-x-2">
              <div
                  class="flex flex-row justify-center items-center pl-4 pr-4 text-sm rounded-lg bg-gdp text-white"
                  @click="showHTML = !showHTML"
              >
                <h6 class="text-center">
                  {{ showHTML ? 'Close Editor' : 'Open Editor' }}
                </h6>
                <img
                    :src="showHTML ? '/caret-up-outline.svg' : '/caret-down-outline.svg'"
                    alt="show hide HTML editor"
                    style="width: 20px; height: 20px;"
                >
              </div>
            </div>
          </div>

          <label class="font-normal mb-2 text-sm">Use for this HTML snippets like Facebook Pixel.</label>

          <a
              class="text-gray-500 text-xs hover:underline hover:text-gray-600 mb-1"
              :href="rendererUrl + '/help'"
              target="_blank"
          >Need help? Read our
            documentation</a>

          <client-only v-if="showHTML">
            <textarea
                v-model="user.activeProfile.metadata.pageHtml"
                class="border border-2 text-white p-2"
                style="font-family: monospace; background-color: #1E1E1E"
                rows="12"
            />
          </client-only>
        </div>

        <!-- Save Button-->
        <button
            class="mt-2 inline-flex p-3 text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold w-auto max-w-xs justify-center align-center"
            type="button"
            @click="saveChanges"
        >
          Save changes
        </button>
      </form>
    </div>

    <div
        v-if="alerts.googleLinked !== null && alerts.googleLinked"
        class="flex flex-col lg:flex-row justify-center items-center p-3 rounded-2xl bg-green-300 shadow w-full mb-8"
    >
      <p class="text-black opacity-70 font-semibold">
        Successfully linked Google!
      </p>
    </div>
    <div
        v-else-if="alerts.googleLinked !== null && !alerts.googleLinked"
        class="flex flex-col lg:flex-row justify-center items-center p-3 rounded-2xl bg-red-300 shadow w-full mb-8"
    >
      <p class="text-black opacity-70 font-semibold">
        Failed to link Google!
      </p>
    </div>

    <!-- Delete site -->
    <div class="flex flex-col lg:flex-row p-6 bg-white shadow rounded-2xl justify-center items-center w-full mb-8">
      <div class="flex flex-col mr-auto w-full lg:w-1/2">
        <h2 class="text-black font-bold text-lg w-full">
          Delete this page
        </h2>
        <p class="text-black opacity-70 font-semibold">Done with this page? Click the button on your right to delete
          this page and all related content.</p>
      </div>
      <button
          class="w-full lg:w-auto mt-4 lg:mt-0 ml-2 flex p-3 px-6 text-white text-center bg-red-600 hover:bg-red-700 rounded-2xl font-bold w-1/3 justify-center align-center"
          type="button"
          @click="setDeleteProfileModalActive(true)"
      >
        Delete this page
      </button>
    </div>

    <!-- Manage SSO -->
    <div class="flex flex-col lg:flex-row p-6 bg-white shadow rounded-2xl justify-center items-center w-full mb-8">
      <div class="flex flex-col mr-auto w-full lg:w-1/2">
        <h2 class="text-black font-bold text-lg w-full">
          Manage SSO
        </h2>
        <p class="text-black opacity-70 font-semibold">
          Link up your social media accounts for easy single sign-on access.
        </p>
      </div>
      <div>
        <a
            class="flex flex-row items-center font-bold justify-center cursor-pointer rounded-full px-8 py-2 my-2 text-md border-gray-300 hover:border-gray-600"
            style="border-width:3px;border-style:solid;"
            @click="assignGoogleAccount()"
        >
          <img class="w-5 mr-4" src="/icons/google-icon.png">
          Link with Google
        </a>
        <!--        <a-->
        <!--          class="flex flex-row items-center font-bold justify-center rounded-full px-8 py-2 my-2 text-md border-gray-300 hover:border-gray-600"-->
        <!--          style="border-width:3px;border-style:solid;"-->
        <!--          @click="assignGitHubAccount()"-->
        <!--        >-->
        <!--          <img src="/icons/google-icon.png" class="w-5 mr-4">-->
        <!--          Link with GitHub-->
        <!--        </a>-->
      </div>
    </div>

    <!-- Import / Export Profile -->
    <div class="flex flex-col lg:flex-row p-6 bg-white shadow rounded-2xl justify-center items-center w-full mb-8">
      <div class="flex flex-col mr-auto w-full lg:w-1/2">
        <h2 class="text-black font-bold text-lg w-full">
          Import/Export profile data
        </h2>
        <p class="text-black opacity-70 font-semibold">
          Importing profile data will completely replace this profile with the data you import.
        </p>
      </div>

      <div class="flex flex-col space-y-2">
        <div>
          <label
              class="w-full lg:w-auto mt-4 lg:mt-0 ml-2 flex p-3 px-6 text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold w-1/3 justify-center align-center"
              for="importProfileButton"
          >Import</label>

          <input
              id="importProfileButton"
              type="file"
              hidden
              @change="importProfile"
          >
        </div>

        <button
            class="w-full lg:w-auto mt-4 lg:mt-0 ml-2 flex p-3 px-6 text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold w-1/3 justify-center align-center"
            type="button"
            @click="exportProfile"
        >
          Export
        </button>
      </div>
    </div>

    <!-- Import from Linktree -->
    <div class="flex flex-col lg:flex-row p-6 bg-white shadow rounded-2xl justify-center items-center w-full mb-8">
      <div class="flex flex-col mr-auto w-full lg:w-1/2">
        <h2 class="text-black font-bold text-lg w-full">
          Import from Linktree
        </h2>
        <p class="text-black opacity-70 font-semibold">
          Replace all of your profile links with links from your linktree profile.
        </p>
        <div class="flex flex-row rounded-2xl border border-solid border-gray-300 text-sm mt-2 overflow-hidden">
          <span
              class="flex p-2 bg-gray-100 border text-gray-900 border-solid border-gray-300 border-t-0 border-l-0 border-b-0"
          >https://linktr.ee/</span>
          <input
              id="linktreeUrl"
              autocomplete="off"
              class="p-2 flex-grow"
              placeholder="e.g. janedoe"
              type="text"
          >
        </div>
      </div>
      <div class="flex flex-col space-y-2">
        <button
            v-if="alerts.linktreeImported === null"
            class="w-full lg:w-auto mt-4 lg:mt-0 ml-2 flex p-3 px-6 text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold w-1/3 justify-center align-center"
            type="button"
            @click="importLinktree"
        >
          Import
        </button>
        <div
            v-if="alerts.linktreeImported !== null && alerts.linktreeImported"
            class="flex flex-col lg:flex-row justify-center items-center p-3 rounded-2xl bg-green-300 shadow max-w-xs mt-4"
        >
          <p class="text-black opacity-70 font-semibold">
            Successfully imported Linktree links
          </p>
        </div>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row p-6 bg-white shadow rounded-2xl justify-center items-center w-full mb-8">
      <div class="flex flex-col mr-auto w-full lg:w-7/12">
        <h2 class="text-black font-bold text-lg w-full">
          Account settings
        </h2>
        <p class="text-black opacity-70 font-semibold">
          Need to configure the account managing your micro-sites?
        </p>
      </div>
      <n-link
          class="w-full lg:w-auto mt-4 lg:mt-0 ml-2 flex p-3 px-6 text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold w-1/3 justify-center align-center"
          to="/dashboard/account"
      >
        Go to account settings
      </n-link>
    </div>

    <transition name="fade">
      <!-- Confirm site deletion modal -->
      <div
          v-if="deleteProfileModalActive"
          class="h-screen absolute top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center"
          style="background: rgba(0,0,0,.5); backdrop-filter: saturate(180%) blur(5px);"
          @click="setDeleteProfileModalActive(false)"
      >
        <div class="flex flex-col p-6 bg-white shadow rounded-2xl w-full max-w-lg" @click.stop>
          <h2 class="text-black font-semibold text-xl">
            Are you sure?
          </h2>
          <p class="text-gray-800 text-sm">
            Deleting this site is irreversible, please confirm to continue.
          </p>
          <button
              class="mt-4 w-full p-4 text-center text-md text-black bg-red-600 hover:bg-red-700 rounded-2xl font-semibold"
              type="button"
              @click="deleteProfile"
          >
            Yes, delete this site
          </button>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <!-- Password reset confirmation modal -->
      <div
          v-if="resetPasswordModalActive"
          class="h-screen absolute top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center"
          style="background: rgba(0,0,0,.5); backdrop-filter: saturate(180%) blur(5px);"
          @click="resetPasswordModalActive = false"
      >
        <div class="flex flex-col p-6 bg-white shadow rounded-2xl w-full max-w-lg" @click.stop>
          <h2 class="text-black font-semibold text-xl">
            {{ passwordError ? 'Error on password request!' : 'Password reset requested' }}
          </h2>
          <p v-if="!passwordError" class="text-gray-800 text-sm">A password reset link has been sent to your account
            email inbox successfully.
            Make sure to check your spam folder.</p>

          <p v-if="passwordError" class="text-gray-800 text-sm">
            <i class="fas fa-exclamation-triangle"/>
            {{ passwordError }}
          </p>
          <button
              class="mt-4 p-3 text-center text-md text-black bg-blue-600 hover:bg-blue-400 rounded-2xl font-semibold"
              type="button"
              @click="resetPasswordModalActive = false"
          >
            Close
          </button>
        </div>
      </div>
    </transition>

  </section>
</template>

<script lang="ts">
import Vue from "vue";
import {StatusCodes} from "http-status-codes";

export default Vue.extend({
  name: 'DashboardSettings',
  layout: 'dashboard',
  middleware: 'authenticated',

  data() {
    return {
      showHTML: false,

      loaded: false,
      resetPasswordModalActive: false,
      deleteProfileModalActive: false,
      originalHandle: '',

      user: {
        name: '',
        emailHash: '',
        activeProfile: {
          id: '',
          imageUrl: '',
          headline: '',
          subtitle: '',
          handle: '',
          customDomain: '',
          visibility: '',
          showWatermark: false,
          rendererUrl: process.env.RENDERER_URL,
          metadata: {
            privacyMode: false as boolean | null | undefined,
            unlisted: false as boolean | null | undefined,
            coverImage: null as boolean | null | undefined,
            pageHtml: null as boolean | null | undefined,
            shareMenu: true as boolean | null | undefined,
            showAvatar: true as boolean | null | undefined
          },
        }
      },

      error: '',
      passwordError: '',
      showWatermarkNotice: false,
      app_name: this.$customSettings.productName,
      rendererUrl: process.env.RENDERER_URL,

      profileUsage: {
        published: 0,
        allowed: 0
      },

      alerts: {
        googleLinked: null as boolean | null,
        linktreeImported: null as boolean | null,
      }
    };
  },

  head() {
    return {
      title: 'Page Settings - ' + this.$customSettings.productName,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Take administrative control over your microsites through the settings panel.'
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: 'Take administrative control over your microsites through the settings panel.'
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: 'Page Settings - ' + this.$customSettings.productName
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: 'Page Settings - ' + this.$customSettings.productName
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: 'Take administrative control over your microsites through the settings panel.'
        },
      ],
    };
  },

  computed: {
    getTXTRecord() {
      const profileId = this.$data.user.activeProfile.id;

      return "sl-verification-id=" + profileId;
    }
  },

  watch: {
    'user.activeProfile.showWatermark': {
      handler(val) {
        this.showWatermarkNotice = (!val && this.loaded);
      }
    }
  },

  async mounted() {
    if (process.env.NODE_ENV === 'production') {
      await this.getUserData();

      if (this.$route.query.googleLinked) {
        this.$data.alerts.googleLinked = this.$route.query.googleLinked === 'true';
      }

      await this.updateProfileUsage();
    }
    this.loaded = true;
  },

  methods: {
    async updateProfileUsage() {
      const token = this.$store.getters['auth/getToken'];

      this.profileUsage = await this.$axios.$post('/profile/allowed-pages', {
        token
      }) as { published: number, allowed: number };
    },

    getFormattedProfileUsage(): string {
      return `(${this.profileUsage.published}/${this.profileUsage.allowed} pages public)`;
    },

    async getUserData() {
      try {
        const token = this.$store.getters['auth/getToken'];

        const userResponse = await this.$axios.$post('/user', {
          token
        });

        const profileResponse = await this.$axios.$post('/profile/active-profile', {
          token
        });

        this.user.name = userResponse.name;
        this.user.emailHash = userResponse.emailHash;

        this.user.activeProfile = profileResponse;

        this.originalHandle = this.user.activeProfile.handle;
      } catch (err) {
        console.log('Error getting user data');
        console.log(err);
      }
    },

    async importProfile(event: Event) {
      if (process.client) {
        const htmlInputEvent = event.target as HTMLInputElement;
        const files = htmlInputEvent.files;

        if (!files || files.length < 1) {
          return;
        }

        const file = files[0];

        const data = await file.text();

        const token = this.$store.getters['auth/getToken'];

        await this.$axios.post('/profile/import', {
          token,
          profileData: data
        });

        // Success, reload
        window.location.replace('/dashboard');
      }
    },

    async exportProfile() {
      if (process.client) {
        const token = this.$store.getters['auth/getToken'];

        const response = await this.$axios.post('/profile/export', {
          token
        });

        let filename = "data.json";
        const disposition = response.headers['content-disposition'];
        if (disposition && disposition.includes('filename')) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        const blob = new Blob([JSON.stringify(response.data)], {type: 'application/pdf'});
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },

    async importLinktree() {
      const linktreeInput: HTMLInputElement = (document.getElementById('linktreeUrl')) as HTMLInputElement;
      const linktreeHandle: string = linktreeInput.value;
      const result = await this.$axios.$post('/profile/linktree_import', {
        token: this.$store.getters['auth/getToken'],
        handle: linktreeHandle
      });
      linktreeInput.value = '';
      this.$data.alerts.linktreeImported = true;
    },

    async saveChanges() {
      // Update profile
      try {

        const avatarUpload: HTMLInputElement = (document.getElementById('avatar_url')) as HTMLInputElement;
        let avatarString = null;

        if (avatarUpload && avatarUpload.value) {
          avatarString = avatarUpload.value;
        }

        await this.$axios.$post('/profile/update', {
          token: this.$store.getters['auth/getToken'],
          imageUrl: avatarString ?? this.user.activeProfile.imageUrl ?? null,
          headline: this.user.activeProfile.headline ?? null,
          subtitle: this.user.activeProfile.subtitle ?? null,
          handle: this.user.activeProfile.handle ?? null,
          visibility: this.user.activeProfile.visibility ?? null,
          customDomain: this.user.activeProfile.customDomain ?? null,
          showWatermark: this.user.activeProfile.showWatermark ?? true,
          metadata: this.user.activeProfile.metadata ?? {privacyMode: false}
        });

        if (process.client) {
          if (this.user.activeProfile.handle !== this.originalHandle) {
            location.reload();
            return;
          }

          this.$root.$emit('refreshUserProfileView');
        }
      } catch (err) {
        if (err.response) {
          if (err.response.status === StatusCodes.CONFLICT) {
            console.error("This handle is already being used by another profile.");
            this.error = "This handle is already being used by another profile.";

            return;
          }
        }

        throw err;
      }
    },

    setDeleteProfileModalActive(active: boolean) {
      this.deleteProfileModalActive = active;
    },

    async deleteProfile() {
      this.$nuxt.$loading.start();

      await this.$axios.$post('/profile/delete', {
        token: this.$store.getters['auth/getToken']
      });

      this.$nuxt.$loading.finish();

      window.location.replace("/dashboard");
    },

    async assignGoogleAccount() {
      const response = await this.$axios.post('/auth/google/assign', {
        token: this.$store.getters['auth/getToken']
      });

      window.location.assign(response.data);
    },
  }
});
</script>

<style lang="scss">
.fade-enter-active, .fade-leave-active {
  transition: opacity .25s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

* {
  outline: none !important;
}

iframe.widgetFrame {
  margin-left: 0 !important;
}
</style>
