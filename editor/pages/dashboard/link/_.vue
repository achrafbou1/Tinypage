<template>
  <section class="flex flex-col p-8 items-center overflow-x-hidden overflow-y-scroll">
    <div class="flex flex-row items-center justify-start mb-4 space-x-4 mb-4">
      <img class="w-8" src="/icons/Pencil.svg">
      <h1 class="text-black font-extrabold tracking-tight text-3xl w-full flex flex-row items-start lg:items-center">
        <span v-if="intent==='create'">Create element</span>
        <span v-if="intent==='edit'">Edit element</span>
      </h1>
    </div>

    <!-- Type -->
    <div
        v-show="intent !=='view'"
        class="flex flex-col mb-4 justify-start w-full"
    >
      <label class="font-semibold mb-2">Element type</label>
      <select
          v-model="pendingLink.type"
          class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
          @change="onElementTypeChanged"
      >
        <option disabled>
          Select an element type
        </option>

        <option value="divider">
          Divider
        </option>
        <option value="html">
          HTML Snippet
        </option>
        <option value="gallery">
          Gallery
        </option>
        <option value="image">
          Image
        </option>
        <option value="social">
          Social Icon
        </option>
        <option value="text">
          Text
        </option>
        <option selected value="link">
          URL (default)
        </option>
        <option value="vcard">
          vCard/Add To Contacts
        </option>
        <option value="youtube">
          Youtube Video
        </option>
      </select>
    </div>

    <!-- Label -->
    <div
        v-show="intent !=='view'"
        class="flex flex-col mb-4 justify-start w-full"
    >
      <label class="font-semibold mb-2">Label</label>

      <input
          ref="label"
          v-model="pendingLink.label"
          class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
          placeholder="e.g. Some memorable name"
          type="text"
      >
    </div>

    <!-- Label -->
    <div
        v-show="intent !=='view'"
        class="flex flex-col mb-4 justify-start w-full"
    >
      <label class="font-semibold mb-2">Hide element</label>
      <input
          id="checkbox-1"
          v-model="pendingLink.hidden"
          class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          type="checkbox"
      >
    </div>

    <div
        v-show="intent !=='view' && (pendingLink.type === 'link' || pendingLink.type === 'vcard')"
        class="flex flex-col mb-4 justify-start w-full"
    >
      <label class="font-semibold mb-2">Hide label</label>
      <input
          id="checkbox-1"
          v-model="pendingLink.metadata.hiddenLabel"
          class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          type="checkbox"
      >
    </div>

    <!-- Subtitle -->
    <div
        v-show="intent!=='view' && showOption(pendingLink.type, 'subtitle')"
        class="flex flex-col mb-4 justify-start w-full"
    >
      <label v-if="pendingLink.type === 'text'" class="font-semibold mb-2">Text</label>
      <label v-else-if="pendingLink.type === 'html'" class="font-semibold mb-2">HTML</label>
      <label v-else class="font-semibold mb-2">Subtitle (optional)</label>

      <client-only>
        <VueEditor
            v-if="pendingLink.type === 'text'"
            v-model="pendingLink.subtitle"
            class="mb-20"
        />

        <textarea
            v-else-if="pendingLink.type === 'html'"
            v-model="pendingLink.subtitle"
            class="border border-2 text-white p-2"
            rows="12"
            style="font-family: monospace; background-color: #1E1E1E"
        />

        <input
            v-else
            v-model="pendingLink.subtitle"
            class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
            placeholder="e.g. Read more about my adventures in Peru!"
            type="text"
        >
      </client-only>
    </div>

    <!-- Gallery settings -->
    <div
        v-if="pendingLink.type === 'gallery'"
        class="flex flex-col mb-8 justify-start w-full"
    >
      <label class="font-semibold mb-2">Image Urls (1:1 photos)</label>
      <button
          class="text-sm px-2 py-2 font-bold text-white rounded-2xl mb-4 bg-gdp hover:bg-blue-400 lg:mb-0 cursor-pointer"
          @click="pendingLink.items.push({url: ''})"
      >
        Add Item
      </button>
      <div
          v-for="(item, index) in pendingLink.items"
          v-if="pendingLink.items && pendingLink.items.length > 0"
          class="flex flex-row mb-4 justify-start w-full"
      >
        <input
            v-model="item.url"
            class="flex-auto p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
            placeholder="e.g. https://exampleurl.com/example"
            type="url"
        >
        <button
            v-show="pendingLink.items.length > 1"
            class="flex-auto text-sm px-2 py-2 mt-2 ml-2 font-bold text-white rounded-2xl hover:bg-red-500 bg-red-600 mb-4 lg:mb-0 cursor-pointer"
            @click="pendingLink.items.splice(index, 1);"
        >
          Delete
        </button>
      </div>
    </div>

    <!-- Divider Settings -->
    <div v-show="intent!=='view'" class="flex flex-col mb-4 justify-start w-full">
      <!-- Divider settings-->
      <label v-if="pendingLink.type === 'divider'" class="font-semibold mb-2">Divider Color</label>
      <div v-show="pendingLink.type === 'divider'">
        <input
            v-model="dividerSettings.color"
            :data-jscolor="jsColorOptions"
            class="p-3 mb-5 w-full rounded-lg bg-white text-sm text-gray-700"
            placeholder="e.g. #FFF"
        >

        <label v-if="pendingLink.type === 'divider'" class="font-semibold mt-2 mb-2">Divider Font Size</label>
        <input
            v-model="dividerSettings.fontSize"
            class="p-3 w-full rounded-lg bg-white text-sm text-gray-700"
            type="number"
        >
      </div>
    </div>

    <!-- Social Icon Settings -->
    <div v-show="intent!=='view' && pendingLink.type === 'social'" class="flex flex-col mb-4 justify-start w-full">
      <div class="flex flex-col lg:flex-row items-center justify-center items-center w-full mb-4">
        <div
            class="flex-grow text-center text-lg px-4 py-4 font-bold text-white rounded-2xl hover:bg-blue-400 bg-gdp mb-4 lg:mb-0 cursor-pointer"
            @click="addSocialIcon()"
        >
          Add Icon
        </div>
      </div>

      <div v-for="(siSettings, index) of socialIcons" class="p-4 m-2 border-2 rounded-2xl">
        <div class="flex flex-row justify-start items-center">
          <label class="font-semibold align-middle mr-5">Icon {{ index + 1 }}</label>

          <button
              class="text-sm px-2 py-2 ml-2 font-bold text-white rounded-2xl bg-gdp hover:bg-blue-400 mb-4 lg:mb-0 cursor-pointer"
              style="align-self: flex-end"
              @click="moveSocialIcon(index, 'up')"
          >
            <img alt="move up" src="/caret-up-outline.svg" style="width: 20px; height: 20px; filter: invert()">
          </button>
          <button
              class="text-sm px-2 py-2 ml-2 font-bold text-white rounded-2xl bg-gdp hover:bg-blue-400 mb-4 lg:mb-0 cursor-pointer"
              style="align-self: flex-end"
              @click="moveSocialIcon(index, 'down')"
          >
            <img alt="move up" src="/caret-down-outline.svg" style="width: 20px; height: 20px; filter: invert()">
          </button>
          <button
              class="text-sm px-2 py-2 ml-2 font-bold text-white rounded-2xl hover:bg-red-500 bg-red-600 mb-4 lg:mb-0 cursor-pointer"
              style="align-self: flex-end"
              @click="deleteSocialIcon(index)"
          >
            Delete
          </button>
        </div>

        <select
            v-model="siSettings.type"
            class="p-2 mt-2 w-full text-sm border-solid border-gray-300 rounded-2xl border"
            @change="onSocialIconTypeChange($event, siSettings)"
        >
          <option disabled selected>
            Select an icon
          </option>

          <option value="phone">
            Phone
          </option>
          <option value="text">
            Text
          </option>
          <option value="email">
            Email
          </option>

          <option value="applemusic">
            Apple Music
          </option>
          <option value="cuplr">
            Cuplr
          </option>
          <option value="discord">
            Discord
          </option>
          <option value="facebook">
            Facebook
          </option>
          <option value="instagram">
            Instagram
          </option>
          <option value="linkedin">
            LinkedIn
          </option>
          <option value="pinterest">
            Pinterest
          </option>
          <option value="soundcloud">
            SoundCloud
          </option>
          <option value="spotify">
            Spotify
          </option>
          <option value="tiktok">
            Tiktok
          </option>
          <option value="twitch">
            Twitch
          </option>
          <option value="twitter">
            Twitter
          </option>
          <option value="whatsapp">
            WhatsApp
          </option>
          <option value="youtube">
            YouTube
          </option>
          <option value="zoom">
            Zoom
          </option>
          <option value="custom">
            Custom
          </option>
        </select>

        <div class="mt-2">
          <label class="font-semibold">URL</label>
          <input
              v-model="siSettings.url"
              class="p-2 mt-2 w-full text-sm border-solid border-gray-300 rounded-2xl border"
              placeholder="e.g. https://exampleurl.com/example"
              type="url"
          >
        </div>

        <div class="flex flex-row">
          <div class="flex flex-row mt-3 mb-3">
            <label class="font-semibold mt-2 mb-2 mr-2">Scale (px)</label>
            <input
                v-model="siSettings.scale"
                class="p-3 rounded-lg bg-white text-sm text-gray-700"
                type="number"
            >
          </div>

          <div class="flex flex-row mt-3 mb-3 ml-2">
            <label class="font-semibold mt-2 mb-2 mr-2">Icon Color</label>
            <input
                v-model="siSettings.color"
                :data-jscolor="jsColorOptions"
                class="rounded-lg bg-white text-sm text-gray-700"
                placeholder="e.g. #FFF"
            >
          </div>
        </div>

        <div class="flex flex-row">
          <div class="flex flex-row mt-3 mb-3">
            <label class="font-semibold mt-2 mb-2 mr-2">Label</label>
            <input
                v-model="siSettings.label"
                class="p-3 rounded-lg bg-white text-sm text-gray-700"
                type="text"
            >
          </div>

          <div class="flex flex-row mt-3 mb-3 ml-2 end">
            <label class="font-semibold mt-2 mb-2 mr-2">Label Color</label>
            <input
                v-model="siSettings.labelColor"
                :data-jscolor="jsColorOptions"
                class="rounded-lg bg-white text-sm text-gray-700"
                placeholder="e.g. #FFF"
            >
          </div>
        </div>

        <div v-if="siSettings.type === 'custom'" class="flex flex-row">
          <div class="flex flex-row mt-3 mb-3">
            <label class="font-semibold mt-2 mb-2 mr-2">Custom SVG</label>
            <textarea
                v-model="siSettings.customSvg"
                class="border border-2 text-white"
                rows="2"
                style="font-family: monospace; background-color: #1E1E1E"
            />
          </div>

          <div
              class="flex flex-row justify-center items-center ml-2 mt-3 mb-3 p-3 text-sm rounded-lg border border-blue-600 text-blue-500 bg-blue-200"
          >
            <label :for="'importCustomSVG' + index" class="cursor-pointer text-center text-xl font-semibold">
              Import SVG
            </label>
            <input
                :id="'importCustomSVG' + index"
                accept=".svg"
                hidden
                type="file"
                @change="importCustomSVG($event, siSettings)"
            >
          </div>
        </div>

      </div>
    </div>

    <!-- URL -->
    <div
        v-show="intent!=='view' && showOption(pendingLink.type, 'url')"
        class="flex flex-col mb-8 justify-start w-full"
    >
      <label v-if="pendingLink.type === 'link'" class="font-semibold mb-2">Link URL (https only)</label>
      <label v-else-if="pendingLink.type === 'image'" class="font-semibold mb-2">Image URL</label>
      <label v-else-if="pendingLink.type === 'youtube'" class="font-semibold mb-2">Video URL</label>
      <label v-else class="font-semibold mb-2">URL</label>

      <input
          v-model="pendingLink.url"
          class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
          placeholder="e.g. https://exampleurl.com/example"
          type="url"
      >
    </div>

    <!-- Button Image URL -->
    <div
        v-if="intent!=='view' && (pendingLink.type === 'link' || pendingLink.type === 'vcard')"
        class="flex flex-col mb-8 justify-start w-full"
    >
      <label class="font-semibold mb-2">Button Image URL</label>

      <input
          v-model="buttonImageUrl"
          class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
          placeholder="e.g. https://exampleurl.com/example"
          type="url"
      >

      <div v-show="buttonImageUrl" class="mt-4">
        <label class="font-semibold mb-2">Button Image Full Width?</label>
        <br>
        <input
            v-model="buttonImageFullWidth"
            class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
            type="checkbox"
        >
      </div>
    </div>

    <!-- vCard -->
    <div
        v-show="intent!=='view' && pendingLink.type === 'vcard'"
        class="flex flex-col mb-8 justify-start w-full"
    >
      <label class="font-semibold mb-2">vCard Data (will overwrite existing vCard data)</label>

      <div class="flex flex-row space-x-3">
        <button
            class="flex flex-row justify-center items-center pl-4 pr-4 text-sm rounded-lg border border-blue-600 text-blue-500 bg-blue-200"
        >
        <span class="text-center">
             <a
                 class="font-semibold text-xl"
                 href="https://vcardmaker.com/"
                 target="_blank"
             >
            Create a .vcf file
            </a>
        </span>
        </button>

        <div
            class="flex flex-row justify-center items-center pl-4 pr-4 text-sm rounded-lg border border-blue-600 text-blue-500 bg-blue-200"
        >
          <label class="cursor-pointer text-center text-xl font-semibold" for="importVCardFileInput">
            Import a .vcf file
          </label>
          <input
              id="importVCardFileInput"
              hidden
              type="file"
              @change="importVCard"
          >
        </div>

      </div>

      <div/>

      <div class="hidden lg:flex flex-col p-6 bg-white shadow rounded-xl w-full mt-6">
        <div
            class="flex flex-col lg:flex-row space-y-1 lg:space-y-0 items-start lg:justify-between lg:items-center w-full mb-2"
        >
          <div class="flex flex-row space-x-2">
            <h2 class="text-gray-800 font-semibold">
              vCard Data Editor
            </h2>

            <div
                class="flex flex-row justify-center items-center pl-4 pr-4 text-sm rounded-lg bg-gdp text-white"
                @click="vCardShowData = !vCardShowData"
            >
              <h6 class="text-center">
                {{ vCardShowData ? 'Close Editor' : 'Open Editor' }}
              </h6>
              <img
                  :src="vCardShowData ? '/caret-up-outline.svg' : '/caret-down-outline.svg'"
                  alt="show hide CSS editor"
                  style="width: 20px; height: 20px;"
              >
            </div>
          </div>
        </div>

        <client-only v-if="vCardShowData">
          <textarea
              v-model="vCard"
              class="mt-4 border-solid border-gray-300 rounded-2xl border p-2"
              placeholder="vCard data will show up here... or enter it yourself."
              rows="8"
          />
        </client-only>
      </div>
    </div>

    <!-- Inline Style CSS -->
    <div class="hidden lg:flex flex-col p-6 bg-white shadow rounded-xl w-full mb-8">
      <div
          class="flex flex-col lg:flex-row space-y-1 lg:space-y-0 items-start lg:justify-between lg:items-center w-full mb-2"
      >
        <div class="flex flex-row space-x-2">
          <h2 class="text-gray-800 font-semibold text-lg">
            Inline Style CSS
          </h2>

          <div
              class="flex flex-row justify-center items-center pl-4 pr-4 text-sm rounded-lg bg-gdp text-white"
              @click="showStyle = !showStyle"
          >
            <h6 class="text-center">
              {{ showStyle ? 'Close Editor' : 'Open Editor' }}
            </h6>
            <img
                :src="showStyle ? '/caret-up-outline.svg' : '/caret-down-outline.svg'"
                alt="show hide CSS editor"
                style="width: 20px; height: 20px;"
            >
          </div>
        </div>

        <a
            :href="rendererUrl + '/help'"
            class="text-gray-500 text-xs hover:underline hover:text-gray-600"
            target="_blank"
        >Need help? Read our documentation</a>
      </div>

      <client-only v-if="showStyle">
        <textarea
            v-model="style"
            class="border border-2 text-white p-2"
            rows="12"
            style="font-family: monospace; background-color: #1E1E1E"
        />
      </client-only>
    </div>

    <!-- Custom CSS-->
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
            <img
                :src="showCSS ? '/caret-up-outline.svg' : '/caret-down-outline.svg'"
                alt="show hide CSS editor"
                style="width: 20px; height: 20px;"
            >
          </div>
        </div>

        <a
            :href="rendererUrl + '/help'"
            class="text-gray-500 text-xs hover:underline hover:text-gray-600"
            target="_blank"
        >Need help? Read our
          documentation</a>
      </div>

      <client-only v-if="showCSS">
        <textarea
            v-model="customCss"
            class="border border-2 text-white p-2"
            rows="12"
            style="font-family: monospace; background-color: #1E1E1E"
        />
      </client-only>
    </div>

    <!-- Buttons -->
    <div class="flex flex-col lg:flex-row items-center justify-start w-full mt-4">
      <div v-if="intent==='create'" class="button cursor-pointer" @click="addNewLink">
        Create link
      </div>
      <div
          v-if="intent==='edit'"
          class="flex-grow text-center text-lg px-8 py-4 font-bold text-white rounded-2xl hover:bg-blue-400 bg-gdp lg:mr-4 mb-4 lg:mb-0 cursor-pointer"
          @click="saveLinkChanges"
      >
        Save and Exit
      </div>
      <div
          v-if="intent==='edit'"
          class="flex-grow text-center text-lg px-8 py-4 font-bold text-white rounded-2xl hover:bg-blue-400 bg-gdp lg:mr-4 mb-4 lg:mb-0 cursor-pointer"
          @click="applyLinkChanges"
      >
        Apply
      </div>
      <div
          v-if="intent==='edit'"
          class="flex-grow text-center text-lg px-8 py-4 font-bold text-white rounded-2xl hover:bg-red-500 bg-red-600 cursor-pointer"
          @click="deleteLink"
      >
        Delete element
      </div>
    </div>

    <!-- Popups and Errors-->
    <transition name="fade">
      <div
          v-if="error"
          class="flex flex-row p-2 mb-4 bg-red-300 text-orange-600 rounded-2xl w-full justify-center items-center text-sm border border-orange-300 shadow-sm"
      >
        <img alt="caution" src="/icons/caution.svg" style="width: 12px;">
        <div class="flex flex-col ml-2">
          {{ error }}
        </div>
      </div>
    </transition>
  </section>
</template>

<script lang="ts">
import Vue from "vue";

type LinkField = "subtitle" | "url" | "icon";

export default Vue.extend({
  layout: 'dashboard',
  middleware: 'authenticated',

  data() {
    const pendingLink: EditorLink = {
      id: "",
      sortOrder: 0,
      label: "",
      type: "link",
      subtitle: "",
      customCss: "",
      url: "https://",
      hidden: false,
      metadata: {hiddenLabel: false},
      items: [{url: ''}]
    };

    return {
      jsColorOptions: "{alphaChannel: true, format: 'rgba'}",
      rendererUrl: process.env.RENDERER_URL,
      id: '',
      links: new Array<EditorLink>(),
      modalActive: false,
      modalIntent: 'create',
      pendingLink,
      user: '',
      error: '',
      intent: '',

      isLoaded: false,

      style: null as string | null | undefined,
      customCss: null as string | null | undefined,

      dividerSettings: {
        color: '#000000FF',
        fontSize: 18,
      },

      showStyle: false,
      showCSS: false,

      vCardShowData: true,
      vCard: '',

      buttonImageUrl: '',
      buttonImageFullWidth: false,

      socialIcons: [] as { type: string, color: string, scale: number, label: string, labelColor: string, customSvg: string, url: string }[],

      sortedLinks: new Array<EditorLink>()
    };
  },

  head() {
    return {
      title: 'Link panel - ' + this.$customSettings.productName,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'View, manage, and create new links from your ' + this.$customSettings.productName + ' link panel'
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: 'View, manage, and create new links from your ' + this.$customSettings.productName + ' link panel'
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: 'Link panel - ' + this.$customSettings.productName
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: 'Link panel - ' + this.$customSettings.productName
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: 'View, manage, and create new links from your ' + this.$customSettings.productName + ' link panel'
        },
      ]
    };
  },

  async beforeMount() {
    await this.getUserData();
    await this.getLinks();
    // Fetch selected link from links
    this.id = this.$route.params.pathMatch;

    if (this.id) {
      this.intent = 'edit';
    } else {
      this.intent = 'create';
    }

    for (let i = 0; i < this.links.length; i++) {
      if (this.links[i].id == this.id) {
        this.pendingLink = this.links[i];
        this.style = this.pendingLink.style;
        this.customCss = this.pendingLink.customCss;
        break;
      }
    }

    if (!this.pendingLink.hidden) {
      this.pendingLink.hidden = false;
    }

    if (!this.pendingLink.metadata) {
      this.pendingLink.metadata = {};
    }

    if (this.pendingLink.type === 'divider') {
      this.dividerSettings = this.pendingLink.metadata.dividerSettings ?? {};

      if (!this.dividerSettings.color) {
        this.dividerSettings.color = "#000000FF";
      }

      if (!this.dividerSettings.fontSize) {
        this.dividerSettings.fontSize = 18;
      }
    }

    if (this.pendingLink.type === 'social') {
      this.socialIcons = this.pendingLink.metadata.socialIcons ?? [];
    }

    if (this.pendingLink.type === 'vcard') {
      this.vCard = this.pendingLink.metadata.vCard ?? '';
    }

    if (this.pendingLink.type === 'link' || this.pendingLink.type === 'vcard') {
      this.buttonImageUrl = this.pendingLink.metadata.buttonImageUrl ?? '';
      this.buttonImageFullWidth = this.pendingLink.metadata.buttonImageFullWidth ?? false;
    }
  },

  async mounted() {
    this.$refs.label.focus();
    if (process.client) {
      await new Promise(res => setTimeout(res, 1000));

      this.$nextTick(() => {
        this.initColorPickers();
      });
    }
  },

  methods: {
    onElementTypeChanged() {
      this.$refs.label.focus();
    },
    initColorPickers() {
      const jscolor = ((window as any).jscolor) as any;
      jscolor.install();
    },

    async getUserData() {
      try {
        this.user = await this.$axios.$post('/user', {
          token: this.$store.getters['auth/getToken']
        });
      } catch (err) {
        console.log('Error getting user data');
        console.log(err);
      }
    },

    async getLinks() {
      try {
        this.links = await this.$axios.$post('/profile/links', {
          token: this.$store.getters['auth/getToken']
        });
      } catch (err) {
        console.log('Error getting profile links');
        console.log(err);
      }
    },

    async deleteLink() {
      try {
        await this.$axios.$post('/link/delete', {
          token: this.$store.getters['auth/getToken'],
          id: this.pendingLink.id,
        });

        const index = this.links.findIndex(x => x.id === this.pendingLink.id);
        this.links.splice(index, 1);

        // this.resortLinks();

        // this.closeModal();

        this.$router.push('/dashboard/');
        this.$root.$emit('refreshUserProfileView');
      } catch (err) {
        console.log('Link destruction unsuccessful');
        console.log(err);
      }
    },

    async saveLinkChanges() {

      await this.applyLinkChanges();
      this.$router.push('/dashboard/');
    },

    async applyLinkChanges() {
      if (!this.pendingLink.label) {
        this.error = 'Link label required';
        return false;
      }
      if (this.pendingLink.type === "link") {
        if (!this.pendingLink.url) {
          this.error = 'Link URL required';
          return false;
        }

        if (!this.pendingLink.url.toLowerCase().startsWith('https://')) {
          this.error = 'Link URL should start with https://';
          return false;
        }
      }

      try {
        this.addMetadata();

        await this.$axios.$post('/link/update', {
          token: this.$store.getters['auth/getToken'],
          link: {
            id: this.pendingLink.id,
            label: this.pendingLink.label,
            type: this.pendingLink.type,
            subtitle: this.pendingLink.subtitle,
            hidden: this.pendingLink.hidden,
            url: this.pendingLink.url,
            style: this.style,
            customCss: this.customCss,
            metadata: this.pendingLink.metadata,
            items: JSON.stringify(this.pendingLink.items)
          }
        });

        const index = this.links.findIndex(x => x.id === this.pendingLink.id);
        this.links[index] = this.pendingLink;

        this.$root.$emit('refreshUserProfileView');
      } catch (err) {
        console.log('Link changes unsuccessful');
        console.log(err);
      }
    },

    clearErrors() {
      this.error = '';
    },

    addMetadata() {
      if (!this.pendingLink.metadata) {
        this.pendingLink.metadata = {};
      }

      if (this.pendingLink.type === 'divider') {
        this.pendingLink.metadata.dividerSettings = this.dividerSettings;
      }

      if (this.pendingLink.type === 'social') {
        this.pendingLink.metadata.socialIcons = this.socialIcons;
      }

      if (this.pendingLink.type === 'vcard') {
        this.pendingLink.metadata.vCard = this.vCard;
      }

      if (this.pendingLink.type === 'link' || this.pendingLink.type === 'vcard') {
        this.pendingLink.metadata.buttonImageUrl = this.buttonImageUrl;
        this.pendingLink.metadata.buttonImageFullWidth = this.buttonImageFullWidth;
      }
    },

    async addNewLink(): Promise<boolean> {
      if (!this.pendingLink.label) {
        this.error = 'Link label required';
        return false;
      }

      if (this.pendingLink.type === "link") {

        if (!this.pendingLink.url) {
          this.error = 'Link URL required';
          return false;
        }

        if (!this.pendingLink.url.toLowerCase().startsWith('https://')) {
          this.error = 'Link URL should start with https://';
          return false;
        }
      }

      try {
        this.addMetadata();

        const response = await this.$axios.post('/link/create', {
          token: this.$store.getters['auth/getToken'],
          link: {
            id: this.pendingLink.id,
            label: this.pendingLink.label,
            type: this.pendingLink.type,
            subtitle: this.pendingLink.subtitle,
            url: this.pendingLink.url,
            hidden: this.pendingLink.hidden,
            style: this.style || '',
            customCss: this.customCss || '',
            metadata: this.pendingLink.metadata,
            items: JSON.stringify(this.pendingLink.items)
          }
        });

        this.links.push(response.data);
        // this.clearPending();

        // this.resortLinks();

        this.$router.push('/dashboard/');
        this.$root.$emit('refreshUserProfileView');
        return true;
      } catch (err) {
        console.log('Error adding new link to profile');
        console.log(err);
        return true;
      }
    },

    onSocialIconTypeChange(event: Event, siSettings: { type: string, color: string, scale: number, label: string, labelColor: string, customSvg: string, url: string }) {
      const selectElement = event.target as HTMLSelectElement;

      if (!selectElement) {
        return;
      }

      const val = selectElement.value;

      switch (val) {
        case "phone":
          siSettings.url = "tel:+1";
          break;
        case "text":
          siSettings.url = "sms:+1";
          break;
        case "email":
          siSettings.url = "mailto:";
          break;
        default:
          siSettings.url = "";
          break;
      }

      siSettings.label = selectElement.options[selectElement.selectedIndex].text;
    },

    addSocialIcon() {
      this.socialIcons.push({
        color: "rgba(0, 0, 0, 1)",
        scale: 40,
        type: "custom",
        url: "",
        label: "",
        labelColor: "rgba(0, 0, 0, 1)",
        customSvg: ""
      });

      this.$nextTick(() => {
        this.initColorPickers();
      });
    },

    deleteSocialIcon(index: number) {
      this.socialIcons.splice(index, 1);
    },

    moveSocialIcon(index: number, direction: "up" | "down") {
      if (direction === "up") {
        const x = index;
        let y = index - 1;

        if (y < 0) {
          y = this.socialIcons.length - 1;
        }

        const temp = this.socialIcons[y];
        this.$set(this.socialIcons, y, this.socialIcons[x]);
        this.$set(this.socialIcons, x, temp);
        this.socialIcons[x] = temp;
      } else if (direction === "down") {
        const x = index;
        let y = index + 1;

        if (y >= this.socialIcons.length) {
          y = 0;
        }

        const temp = this.socialIcons[y];
        this.$set(this.socialIcons, y, this.socialIcons[x]);
        this.$set(this.socialIcons, x, temp);
      }
    },

    async importVCard(event: Event) {
      const htmlInputEvent = event.target as HTMLInputElement;
      const files = htmlInputEvent.files;

      if (!files || files.length < 1) {
        return;
      }

      const file = files[0];

      this.vCard = await file.text();
    },

    async importCustomSVG(event: Event, siSettings: { customSvg: string }) {
      const htmlInputEvent = event.target as HTMLInputElement;
      const files = htmlInputEvent.files;

      if (!files || files.length < 1) {
        return;
      }

      const file = files[0];

      siSettings.customSvg = await file.text();
    },

    showOption(linkType: LinkType, field: LinkField): boolean {
      switch (linkType) {
        case "link":
          switch (field) {
            case "subtitle":
            case "url":
              return true;
          }
          break;

        case "social":
          switch (field) {
            case "icon":
              return true;
          }
          break;

        case "vcard":
          switch (field) {
            case "subtitle":
              return true;
          }
          break;

        case "image":
          switch (field) {
            case "url":
              return true;
          }
          break;

        case "text":
          switch (field) {
            case "subtitle":
              return true;
          }
          break;

        case "html":
          switch (field) {
            case "subtitle":
              return true;
          }
          break;

        case "youtube":
          switch (field) {
            case "url":
              return true;
          }
          break;
      }

      return false;
    },
  }
});
</script>
