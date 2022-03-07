<template>
  <section class="flex flex-col p-8 items-center overflow-x-hidden overflow-y-scroll">
    <div class="flex flex-row items-center justify-start mb-4 space-x-4 mb-4">
      <img class="w-8" src="/icons/Rainbow.svg">
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
          Customization
        </h2>
        <a
            class="text-gray-500 text-xs hover:underline hover:text-gray-600"
            href="/dashboard/help"
            target="_blank"
        >Need help? Read our documentation</a>
      </div>
      <Builder v-if="builderCssLoaded" v-model="builderCss"/>

      <div class="flex flex-row justify-center items-center flex-grow space-x-2">
        <button
            class="mt-4 p-3 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-xl font-semibold w-full"
            style="max-width: 19rem;"
            type="button"
            @click="saveChanges"
        >
          Save changes
        </button>

        <button
            class="mt-4 p-3 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-xl font-semibold w-full"
            style="max-width: 19rem;"
            type="button"
            @click="copyToNewTheme"
        >
          Copy to New Theme
        </button>
      </div>
    </div>

    <!-- Mobile Warning -->
    <div class="flex lg:hidden flex-col p-4 bg-orange-200 border border-orange-600 rounded-xl w-full mb-8">
              <span class="text-orange-500 text-sm text-center mx-auto w-full">
                View on desktop to edit custom HTML & CSS
              </span>
    </div>

    <!-- Custom HTML -->
    <div class="hidden lg:flex flex-col p-6 bg-white shadow rounded-xl w-full mb-8">
      <div
          class="flex flex-col lg:flex-row space-y-1 lg:space-y-0 items-start lg:justify-between lg:items-center w-full mb-2"
      >
        <div class="flex flex-row space-x-2">
          <h2 class="text-gray-800 font-semibold text-lg">
            Custom HTML
          </h2>

          <div
              class="flex flex-row justify-center items-center pl-4 pr-4 text-sm rounded-lg bg-gdp text-white"
              @click="showHTML = !showHTML"
          >
            <h6 class="text-center">
              {{ showHTML ? 'Close Editor' : 'Open Editor' }}
            </h6>
            <transition name="fade">
              <img :src="showHTML ? '/caret-up-outline.svg' : '/caret-down-outline.svg'"
                   style="width: 20px; height: 20px;"
                   alt="show hide HTML editor"
              />
            </transition>
          </div>
        </div>

        <a
            class="text-gray-500 text-xs hover:underline hover:text-gray-600"
            href="/dashboard/help"
            target="_blank"
        >Need help? Read our
          documentation</a>
      </div>

      <client-only v-if="showHTML">
        <textarea
            v-model="customHtml"
            class="border border-2 text-white p-2"
            style="font-family: monospace; background-color: #1E1E1E"
            rows="12"
        />
      </client-only>
      <button
          class="inline-flex mt-4 p-3 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-xl font-semibold w-auto max-w-xs justify-center align-center"
          type="button"
          @click="saveChanges"
      >
        Save changes
      </button>
    </div>

    <!-- Custom CSS -->
    <div class="hidden lg:flex flex-col p-6 bg-white shadow rounded-xl w-full mb-8">
      <div
          class="flex flex-col lg:flex-row space-y-1 lg:space-y-0 items-start lg:justify-between lg:items-center w-full mb-2"
      >
        <div class="flex flex-row space-x-2">
          <h2 class="text-gray-800 font-semibold text-lg">
            Custom CSS
          </h2>

          <div
              class="flex flex-row justify-center items-center pl-4 pr-4 text-sm rounded-lg bg-gdp text-white"
              @click="showCSS = !showCSS"
          >
            <h6 class="text-center">
              {{ showCSS ? 'Close Editor' : 'Open Editor' }}
            </h6>
            <transition name="fade">
              <img :src="showCSS ? '/caret-up-outline.svg' : '/caret-down-outline.svg'"
                   style="width: 20px; height: 20px;"
                   alt="show hide CSS editor"
              />
            </transition>
          </div>
        </div>

        <a
            class="text-gray-500 text-xs hover:underline hover:text-gray-600"
            href="/dashboard/help"
            target="_blank"
        >Need help? Read our
          documentation</a>
      </div>

      <client-only v-if="showCSS">
        <textarea
            v-model="editorCss"
            class="border border-2 text-white p-2"
            style="font-family: monospace; background-color: #1E1E1E"
            rows="12"
        />
      </client-only>
      <button
          class="inline-flex mt-4 p-3 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-xl font-semibold w-auto max-w-xs justify-center align-center"
          type="button"
          @click="saveChanges"
      >
        Save changes
      </button>
    </div>

    <!-- Your Themes-->
    <div class="flex flex-col p-6 bg-white shadow rounded-xl w-full mt-8 mb-8">
      <theme-list
          :active="activeThemeId"
          :cols="2"
          :extended="false"
          :themes="themes"
          icon="edit"
          name="Your themes"
      />
      <a
          class="inline-flex mt-4 p-3 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-xl font-semibold w-auto max-w-xs justify-center align-center"
          href="/dashboard/appearance/theme/create"
          type="button"
      >
        Create new theme
      </a>

      <button
          class="inline-flex mt-4 p-3 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-xl font-semibold w-auto max-w-xs justify-center align-center"
          @click="resetTheme"
      >
        Remove Theme
      </button>
    </div>

  </section>
</template>

<script lang="ts">
import Vue from "vue";
import Builder from "~/components/no-code/builder.vue";

type ThemeModalIntent = "create" | "edit" | "view";

export default Vue.extend({
  name: 'DashboardAppearance',

  components: {
    Builder
  },

  layout: 'dashboard',
  middleware: 'authenticated',

  data() {
    return {
      showHTML: false,
      showCSS: false,

      error: '',
      themes: new Array<EditorTheme>(),
      globalThemes: new Array<EditorTheme>(),
      activeThemeId: '',
      editorCss: '',
      builderCss: '',
      customCss: '',
      customHtml: '',
      modalActive: false,
      modalIntent: 'create' as ThemeModalIntent,

      pendingTheme: {
        id: '',
        label: '',
        global: false,
        customCss: undefined,
        customHtml: undefined,
      } as EditorTheme,

      userId: '',

      customization: {
        background: null,
        header: {
          size: null,
          color: null,
          family: null,
          weight: null,
        },
        subtitle: {
          size: null,
          color: null,
          family: null,
          weight: null
        },
        items: {
          padding: null,
          background: null,
          font: {
            size: null,
            color: null,
            family: null,
            weight: null
          },
        }
      },

      isAdmin: false,
      builderCssLoaded: false
    };
  },

  beforeMount() {
    this.getUserData();
    this.loadThemes();
  },

  methods: {
    async getUserData() {
      try {
        const token = this.$store.getters['auth/getToken'];
        const profileResponse = await this.$axios.$post<Profile>('/profile/active-profile', {
          token
        });
        this.activeThemeId = profileResponse.themeId ?? null;
        this.customCss = profileResponse.customCss ?? '';
        const strings = this.customCss.split('/* SL-NO-CODE */');

        this.editorCss = strings[0];

        if (strings.length > 1) {
          this.builderCss = strings[1];
        }

        this.builderCssLoaded = true;
        this.customHtml = profileResponse.customHtml ?? '';
      } catch (err) {
        console.log('Error getting user data');
        console.log(err);
      }
    },

    async loadThemes() {
      try {
        // Grab themes from response
        this.themes = (await this.$axios.$post<EditorTheme[]>('/themes', {
          token: this.$store.getters['auth/getToken'],
          includeGlobal: false
        }));
      } catch (error) {
        console.log('Failed to get themes');
        console.log(error);
      }
    },

    setPending(theme: EditorTheme | null) {
      if (!theme) {
        this.pendingTheme = this.getNewTheme();
      } else {
        this.pendingTheme = theme;
      }
    },

    openModal(intent: ThemeModalIntent) {
      this.modalIntent = intent;
      this.modalActive = true;
    },

    closeModal() {
      this.setPending(null);
      this.modalActive = false;
    },

    async saveChanges() {
      try {
        // console.log('Builder CSS');
        // console.log(this.builderCss);
        await this.$axios.$post('/profile/update', {
          token: this.$store.getters['auth/getToken'],
          customCss: this.editorCss + '/* SL-NO-CODE */' + this.builderCss,
          customHtml: this.customHtml
        });
        this.$root.$emit('refreshUserProfileView');
      } catch (err) {
        console.log(err);
      }
    },

    copyToNewTheme() {
      if (process.client) {
        localStorage.setItem("copyToNewTheme", JSON.stringify({
          builderCss: this.builderCss
        }));
        location.replace('/dashboard/appearance/theme/create');
      }
    },

    getNewTheme(): EditorTheme {
      return {
        id: '',
        label: '',
        global: false,
        customCss: undefined,
        customHtml: undefined,
      };
    },

    async resetTheme() {
      try {
        const response = await this.$axios.$post('/profile/activate-theme', {
          token: this.$store.getters['auth/getToken'],
          id: null,
        });

        this.activeThemeId = response.themeId;
        // window.location.reload();
        this.$root.$emit('refreshUserProfileView');
      } catch (error) {
        console.log('Failed to activate theme');
        console.log(error);
      }
    }
  },
});
</script>
