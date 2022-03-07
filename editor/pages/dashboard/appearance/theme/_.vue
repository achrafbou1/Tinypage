<template>
  <section
      class="flex flex-shrink-0 flex-col p-8 items-center flex-grow overflow-x-hidden overflow-y-scroll"
  >
    <div class="flex flex-col lg:flex-row justify-start lg:justify-between items-center mb-4 w-full">
      <h1 class="text-gray-800 font-extrabold tracking-tight text-3xl">
        <span v-if="intent==='create'">Create</span>
        <span v-if="intent==='edit'">Edit</span>
        theme
      </h1>
    </div>
    <div v-if="intent!=='view'" class="flex flex-col mb-4 justify-start w-full">
      <label class="font-semibold mb-2">Display name</label>
      <input
          v-model="theme.label"
          class="p-3 p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
          placeholder="e.g. My beautiful theme"
          type="text"
      >
    </div>
    <div class="hidden lg:flex flex-col p-6 bg-white shadow rounded-lg w-full mb-6">
      <div
          class="flex flex-col lg:flex-row space-y-1 lg:space-y-0 items-start lg:justify-between lg:items-center w-full mb-2"
      >
        <h2 class="text-gray-800 font-semibold text-lg">
          Customization
        </h2>
        <a
            class="text-gray-500 text-xs hover:underline hover:text-gray-600"
            href="/help"
            target="_blank"
        >Need help? Read our documentation</a>
      </div>
      <Builder v-if="builderLoaded" v-model="builderCss"/>
    </div>
    <div class="hidden lg:flex flex-col p-6 bg-white shadow rounded-lg w-full mb-6">
      <div
          class="flex flex-col lg:flex-row space-y-1 lg:space-y-0 items-start lg:justify-between lg:items-center w-full mb-2"
      >
        <h2 class="text-gray-800 font-semibold text-lg">
          Custom HTML
        </h2>
        <a
            class="text-gray-500 text-xs hover:underline hover:text-gray-600"
            href="/help"
            target="_blank"
        >Need help? Read our documentation</a>
      </div>
      <textarea
          v-model="theme.customHtml"
          class="border border-2 text-white p-2"
          style="font-family: monospace; background-color: #1E1E1E"
          rows="12"
      />
    </div>
    <div class="hidden lg:flex flex-col p-6 bg-white shadow rounded-lg w-full">
      <div
          class="flex flex-col lg:flex-row space-y-1 lg:space-y-0 items-start lg:justify-between lg:items-center w-full mb-2"
      >
        <h2 class="text-gray-800 font-semibold text-lg">
          Custom CSS
        </h2>
        <a
            class="text-gray-500 text-xs hover:underline hover:text-gray-600"
            href="/help"
            target="_blank"
        >Need help? Read our documentation</a>
      </div>
      <textarea
          v-model="editorCss"
          class="border border-2 text-white p-2"
          style="font-family: monospace; background-color: #1E1E1E"
          rows="12"
      />
    </div>

    <div class="flex flex-col lg:flex-row items-center justify-start w-full mt-4">
      <div
          v-if="intent==='create'"
          class="px-6 py-3 font-semibold text-white rounded-lg bg-gdp hover:bg-blue-300 lg:mr-4 mb-4 lg:mb-0 cursor-pointer"
          @click="saveCreateTheme"
      >
        Create theme
      </div>
      <div
          v-if="intent==='edit'"
          class="px-6 py-3 font-semibold text-white rounded-lg bg-gdp hover:bg-blue-300 lg:mr-4 mb-4 lg:mb-0 cursor-pointer"
          @click="saveEditTheme"
      >
        Save changes
      </div>
      <div
          class="px-6 py-3 font-semibold text-white rounded-lg bg-gdp hover:bg-blue-300 lg:mr-4 mb-4 lg:mb-0 cursor-pointer"
          @click="applyChanges"
      >
        Apply changes
      </div>
      <div
          v-if="intent==='edit'"
          class="px-6 py-3 font-semibold text-white rounded-lg hover:bg-red-500 bg-red-600 cursor-pointer"
          @click="deleteTheme"
      >
        Delete theme
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import Vue from "vue";
import Builder from "~/components/no-code/builder.vue";

export default Vue.extend({
  layout: 'dashboard',
  middleware: 'authenticated',

  components: {
    Builder
  },

  head() {
    return {
      title: 'Theme editing - ' + this.$customSettings.productName,
      meta: [
        {
          hid: 'robots',
          name: 'robots',
          content: 'noindex'
        }
      ]
    };
  },

  data() {
    return {
      id: null as string | null,
      themes: [] as EditorTheme[],
      builderCss: '',
      editorCss: '',
      theme: {
        label: null,
        customHtml: null,
        customCss: null
      } as unknown as EditorTheme,
      intent: 'edit',
      builderLoaded: false,
      error: '',
    };
  },

  mounted() {
    this.id = this.$route.path.replace('/dashboard/appearance/theme/', '');
    if (this.id !== 'create') {
      this.loadThemes();
    } else {
      this.intent = 'create';
      this.builderLoaded = true;

      if (process.client) {
        let copyToNewThemeRaw = localStorage.getItem("copyToNewTheme");

        if (copyToNewThemeRaw) {
          let copyToNewTheme: { builderCss: string } = JSON.parse(copyToNewThemeRaw);
          this.builderCss = copyToNewTheme.builderCss;

          this.theme.label = "Appearance Theme (Cloned)";
          localStorage.removeItem("copyToNewTheme");
        }
      }
    }
  },

  methods: {
    async loadThemes() {
      try {
        // Grab themes from response
        this.themes = await this.$axios.$post('/themes', {
          token: this.$store.getters['auth/getToken'],
          includeGlobal: false
        });
        for (let i = 0; i < this.themes.length; i++) {
          if (this.themes[i].id === this.id) {
            this.theme = this.themes[i];

            if (!this.theme) {
              continue;
            }

            if (this.theme.customCss) {
              const strings = this.theme.customCss.split('/* SL-NO-CODE */');

              this.editorCss = strings[0];

              if (strings.length > 1) {
                this.builderCss = strings[1];
                this.builderLoaded = true;
              } else {
                this.builderLoaded = true;
              }
            }
          }
        }

        // console.log(this.themes);
      } catch (error) {
        console.log('Failed to get themes');
        console.log(error);
      }
    },
    async saveCreateTheme() {
      try {
        const response = await this.$axios.$post('/theme/create', {
          token: this.$store.getters['auth/getToken'],
          label: this.theme.label,
          customCss: this.editorCss + '/* SL-NO-CODE */' + this.builderCss,
          customHtml: this.theme.customHtml,
        });
        /* if (close) {
            this.closeModal();
            return;
        } */
        // console.log('Created');
        // console.log(response);
        window.location.replace("/dashboard/appearance");
      } catch (error) {
        this.error = 'Failed to create theme';
        console.log('Failed to create theme');
      }
    },
    async saveEditTheme() {
      try {
        const response = await this.$axios.$post('/theme/update', {
          token: this.$store.getters['auth/getToken'],
          id: this.theme.id,
          label: this.theme.label,
          customCss: this.editorCss + '/* SL-NO-CODE */' + this.builderCss,
          customHtml: this.theme.customHtml,
        });
        /* const themeId = response.id;
        const index = this.themes.findIndex(x => x.id === themeId);
        this.themes[index] = this.theme;
        if (this.theme.global) {
            const token = this.$store.getters['auth/getToken'];
            await this.$axios.$post('theme/admin/set-global', {
                token,
                id: response.id,
                global: this.theme.global
            });
        } */

        window.location.replace("/dashboard/appearance");
        return;
      } catch (error) {
        console.log(error);
        this.error = 'Failed to edit theme';
        console.log('Failed to edit theme');
      }
    },
    async applyChanges() {
      try {
        if (this.intent === 'create') {
          const response = await this.$axios.$post('/theme/create', {
            token: this.$store.getters['auth/getToken'],
            label: this.theme.label,
            customCss: this.editorCss + '/* SL-NO-CODE */' + this.builderCss,
            customHtml: this.theme.customHtml,
          });

          let href = window.location.href;
          window.location.replace(href.replace("/create", `/${response.id}`));
        } else {
          const response = await this.$axios.$post('/theme/update', {
            token: this.$store.getters['auth/getToken'],
            id: this.theme.id,
            label: this.theme.label,
            customCss: this.editorCss + '/* SL-NO-CODE */' + this.builderCss,
            customHtml: this.theme.customHtml,
          });
        }

        /* const themeId = response.id;
        const index = this.themes.findIndex(x => x.id === themeId);
        this.themes[index] = this.theme;
        if (this.theme.global) {
            const token = this.$store.getters['auth/getToken'];
            await this.$axios.$post('theme/admin/set-global', {
                token,
                id: response.id,
                global: this.theme.global
            });
        } */

        this.$root.$emit('refreshUserProfileView');
        return;
      } catch (error) {
        console.log(error);
        this.error = 'Failed to edit theme';
        console.log('Failed to edit theme');
      }
    },
    async deleteTheme() {
      try {
        const response = await this.$axios.$post('/theme/delete', {
          token: this.$store.getters['auth/getToken'],
          id: this.theme.id,
        });
        const themeId = response.id;
        const index = this.themes.findIndex(x => x.id === themeId);
        this.themes.splice(index, 1);
        this.closeModal();
        window.location.replace("/dashboard/appearance");
        return;
      } catch (error) {
        this.error = 'Failed to create theme';
        console.log('Failed to create theme');
      }
    },
    closeModal() {

    }
  }
});
</script>
