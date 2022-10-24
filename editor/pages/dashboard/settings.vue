<template>
  <section class="flex flex-col p-8 items-center overflow-x-hidden overflow-y-scroll">
    <div class="flex flex-row items-center justify-start mb-4 space-x-4 mb-4">
      <img class="w-8" src="/icons/Settings.svg" alt="Settings">
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
      <div v-if="profileUsage.published === profileUsage.allowed" class="warning">
        Unpublished pages are used for design and testing at no charge. To publish your page, please add a page
        <NuxtLink style="text-decoration: underline;" to="/dashboard/account">
          here
        </NuxtLink>
        then set it's visibility to "Public" on the page settings.
      </div>
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
                :disabled="profileUsage.published === profileUsage.allowed"
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

        <h2 class="text-black font-bold text-xl w-full mb-2">
          Customize your preview link
        </h2>
        <div class="flex flex-col w-full lg:w-1/2 mr-3 mb-3 lg:mb-0">
          <label class="font-bold opacity-70 text-sm text-black" for="image_url_2">Image URL (We recommend using a 16:9
            image)</label>
          <input
              id="image_url"
              v-model="user.activeProfile.metadata.previewImageUrl"
              class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
              placeholder="e.g. https://uifaces.co/our-content/donated/rSuiu_Hr.jpg"
              type="text"
          >
        </div>
        <div class="flex flex-col w-full lg:w-1/2 mr-3 mb-3 lg:mb-0 mt-2">
          <label class="font-bold opacity-70 text-sm text-black" for="title">Title of your link</label>
          <input
              id="image_url"
              v-model="user.activeProfile.metadata.previewTitle"
              class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
              placeholder="e.g. Tinypage"
              type="text"
          >
        </div>
        <div class="flex flex-col w-full lg:w-1/2 mr-3 mb-3 lg:mb-0 mt-2">
          <label class="font-bold opacity-70 text-sm text-black" for="title">Description of your link</label>
          <input
              id="image_url"
              v-model="user.activeProfile.metadata.previewDescription"
              class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
              placeholder="e.g. The simple micro-site platform."
              type="text"
          >
        </div>

        <!-- Page HTML -->
        <div class="flex flex-col mt-2 mb-4 justify-start w-full">

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
              :href="rendererUrl + '/help'"
              class="text-gray-500 text-xs hover:underline hover:text-gray-600 mb-1"
              target="_blank"
          >Need help? Read our
            documentation</a>

          <client-only v-if="showHTML">
            <textarea
                v-model="user.activeProfile.metadata.pageHtml"
                class="border border-2 text-white p-2"
                rows="12"
                style="font-family: monospace; background-color: #1E1E1E"
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
    <!-- Leave page -->
    <div
        v-if="user.activeProfile.userId !== user.id"
        class="flex flex-col p-6 bg-white shadow rounded-2xl w-full mb-8"
    >
      <div class="flex flex-col mr-auto w-full lg:w-full">
        <h2 class="text-black font-bold text-lg w-full">
          Leave this page
        </h2>
        <p class="text-black opacity-70 font-semibold">
          Leave this page (only works for pages you've been invited to).
        </p>
      </div>
      <button
          class="w-full lg:w-auto mt-4 flex p-3 px-6 text-white text-center bg-red-600 hover:bg-red-700 rounded-2xl font-bold w-1/3 justify-center align-center"
          type="button"
          @click="$modal.show('leave-page'); $modal.hide('delete-page');"
      >
        Leave this page
      </button>
    </div>

    <div class="bg-white py-8 shadow rounded-2xl justify-center items-start w-full mb-8">
      <div class="flex space-x-48 flex-row">
        <div>
          <h2 class="text-black font-bold text-lg w-full px-6">
            Manage your team
          </h2>
        </div>
        <div class="flex-initial w-64 data-table-search-filter mb-6">
          <span>search:</span><input type="search" @input="filterTeams">
        </div>
      </div>
      <div class="w-full bg-gray-200" style="height:1px;"/>
      <div class="flex flex-col mt-4 mb-2 w-full px-6 mt-6">
        <label v-if="!teamMembers || teamMembers.length < 1" class="font-bold text-black opacity-70 mb-3">Ready to add
          your first team
          member? Add them here!</label>
        <label v-else class="font-bold text-black opacity-70 mb-3">Want to add a new member? Add them here!</label>

        <div class="flex flex-row items-center justify-start w-full">
          <label class="mr-4 font-normal">Email</label>
          <input
              v-model="teamMemberEmail"
              class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border flex-grow"
              placeholder="e.g. jane@gmail.com"
              type="text"
          >
          <label class="ml-4 mr-4 font-normal">Role</label>
          <select
              v-model="teamMemberRole"
              class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border flex-grow"
              style="min-width: 120px; max-width: 220px;"
          >
            <!-- <option value="guest" disabled>Guest (View Only) [Coming Soon]</option>-->
            <option selected value="editor">
              Editor
            </option>
          </select>
          <button
              class="ml-4 mr-4 py-3 px-6 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl
              font-bold justify-center align-center"
              type="button"
              @click="addTeamMember(teamMemberEmail, teamMemberRole); teamMemberEmail = '';"
          >
            Add team member
          </button>
        </div>

        <div v-if="error" class="error py-4 px-6 mt-4 text-sm text-white align-center justify-center">
          {{ error }}
        </div>
        <DataTable v-bind="teamsTableParams"/>
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
              hidden
              type="file"
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
    <!-- Delete site -->
    <div
        v-if="user.activeProfile.userId === user.id"
        class="flex flex-col p-6 bg-white shadow rounded-2xl w-full mb-8"
    >
      <div class="flex flex-col mr-auto w-full lg:w-full">
        <h2 class="text-black font-bold text-lg w-full">
          Delete this page
        </h2>
        <p class="text-black opacity-70 font-semibold">Done with this page? Click the button on your right to delete
          this page and all related content.</p>
      </div>
      <button
          class="w-full lg:w-auto mt-4 flex p-3 px-6 text-white text-center bg-red-600 hover:bg-red-700 rounded-2xl font-bold w-1/3 justify-center align-center"
          type="button"
          @click="$modal.hide('leave-page'); $modal.show('delete-page');"
      >
        Delete this page
      </button>
    </div>

    <!-- Leave page -->
    <div
        v-if="user.activeProfile.userId !== user.id"
        class="flex flex-col p-6 bg-white shadow rounded-2xl w-full mb-8"
    >
      <div class="flex flex-col mr-auto w-full lg:w-full">
        <h2 class="text-black font-bold text-lg w-full">
          Leave this page
        </h2>
        <p class="text-black opacity-70 font-semibold">
          Leave this page (only works for pages you've been invited to).
        </p>
      </div>
      <button
          class="w-full lg:w-auto mt-4 flex p-3 px-6 text-white text-center bg-red-600 hover:bg-red-700 rounded-2xl font-bold w-1/3 justify-center align-center"
          type="button"
          @click="$modal.show('leave-page'); $modal.hide('delete-page');"
      >
        Leave this page
      </button>
    </div>

    <modal name="delete-page">
      <!-- Confirm site deletion modal -->
      <div
          class="flex items-center justify-center"
          style="backdrop-filter: saturate(180%) blur(5px);"
          @click="$modal.hide('delete-page')"
      >
        <div class="flex flex-col p-6 mt-6 bg-white rounded-2xl w-full max-w-lg" @click.stop>
          <h2 class="text-black font-semibold text-xl">
            Are you sure?
          </h2>
          <p class="text-gray-800 text-sm">
            Deleting this site is irreversible, please confirm to continue.
          </p>
          <button
              class="mt-4 w-full p-4 text-center text-md text-black bg-red-600 hover:bg-red-700 text-white rounded-2xl font-semibold"
              type="button"
              @click="deletePage"
          >
            Yes, delete this page
          </button>
          <button
              class="mt-4 w-full p-4 text-center text-md text-black bg-gray-400 text-white hover:bg-gray-700 rounded-2xl font-semibold"
              type="button"
              @click="$modal.hide('delete-page')"
          >
            Cancel
          </button>
        </div>
      </div>
    </modal>

    <modal name="leave-page">
      <!-- Confirm site deletion modal -->
      <div
          class="flex items-center justify-center"
          style="backdrop-filter: saturate(180%) blur(5px);"
          @click="$modal.hide('leave-page')"
      >
        <div class="flex flex-col p-6 mt-8 bg-white shadow rounded-2xl w-full max-w-lg" @click.stop>
          <h2 class="text-black font-semibold text-xl">
            Are you sure?
          </h2>
          <button
              class="mt-4 w-full p-4 text-center text-md text-black bg-red-600 hover:bg-red-700 text-white rounded-2xl font-semibold"
              type="button"
              @click="leavePage"
          >
            Yes, leave this page
          </button>
          <button
              class="mt-4 w-full p-4 text-center text-md text-black bg-gray-400 hover:bg-gray-700 text-white rounded-2xl font-semibold"
              type="button"
              @click="$modal.hide('leave-page')"
          >
            Cancel
          </button>
        </div>
      </div>
    </modal>

  </section>
</template>

<script lang="ts">
// @ts-ignore
import DataTable from '@andresouzaabreu/vue-data-table';
import Vue from "vue";
import {StatusCodes} from "http-status-codes";
// eslint-disable-next-line import/named
import {MetaInfo} from "vue-meta";
import ActionsComponentTeamMember from "~/components/team-members/page-team-members/ActionsComponent.vue";
import EventBus from "~/plugins/eventbus";

export default Vue.extend({
  name: 'DashboardSettings',
  components: {
    DataTable
  },
  layout: 'dashboard',
  middleware: 'authenticated',

  data: () => ({
    teamMemberEmail: '' as string,
    teamMemberRole: 'editor' as string,
    teamMembers: [] as ProfileMember[],
    filteredTeamMembers: [] as ProfileMember[],
    showHTML: false,
    loaded: false,
    originalHandle: '',
    user: {
      id: '',
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
        userId: '',
        metadata: {
          privacyMode: false as boolean | null | undefined,
          unlisted: false as boolean | null | undefined,
          coverImage: null as boolean | null | undefined,
          pageHtml: null as boolean | null | undefined,
          shareMenu: true as boolean | null | undefined,
          showAvatar: true as boolean | null | undefined,
          previewImageUrl: '',
          previewTitle: '',
          previewDescription: ''
        },
      }
    },

    error: '' as string,
    passwordError: '',
    showWatermarkNotice: false,
    rendererUrl: process.env.RENDERER_URL,

    profileUsage: {
      published: 0,
      allowed: 0
    },

    alerts: {
      googleLinked: null as boolean | null,
      linktreeImported: null as boolean | null,
    }
  }),

  head(): MetaInfo {
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
    app_name(): string {
      return this.$customSettings.productName;
    },
    teamsTableParams(): Object {
      return {
        showPerPage: false,
        sortingMode: "single",
        showSearchFilter: false,
        showDownloadButton: false,
        showEntriesInfo: false,
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        data: this.filteredTeamMembers,
        columns: [
          {
            key: "email"
          },
          {
            key: "role",
          },
          {
            key: "actions",
            component: ActionsComponentTeamMember,
            sortable: false
          }
        ]
      };
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
    await this.getTeamMembers();
    await this.getUserData();
    if (this.$route.query.googleLinked) {
      this.$data.alerts.googleLinked = this.$route.query.googleLinked === 'true';
    }

    await this.updateProfileUsage();
    this.loaded = true;

    EventBus.$on("getTeamMembersPageOnly", () => {
      this.getTeamMembers();
    });

    EventBus.$on("addTeamMembersPageOnly", ({email, role}: ProfileMember) => {
      this.addTeamMember(email, role);
    });
  },

  methods: {
    async addTeamMember(email: string, role: string): Promise<void> {
      const token = this.$store.getters['auth/getToken'];
      try {
        await this.$axios.post('/team/add', {
          token,
          email,
          role
        });
        this.error = '';
      } catch (err: any) {
        console.log(err.response);
        this.error = err.response.data.error;
      }

      await this.getTeamMembers();
    },
    async getTeamMembers(): Promise<void> {
      if (!this.teamMembers) {
        this.teamMembers = [];
      }

      this.teamMembers.length = 0;

      const token = this.$store.getters['auth/getToken'];

      this.teamMembers = (await this.$axios.post('/team', {
        token,
        pageOnly: true
      })).data;
      this.filteredTeamMembers = this.teamMembers;
    },
    filterTeams(event: any) {
      const target = event.target;
      const filterSearch = target.value.toLowerCase();
      const teams = this.teamMembers;
      if (filterSearch) {
        this.filteredTeamMembers = teams.filter(x => x.email.toLowerCase().includes(filterSearch));
      } else {
        this.filteredTeamMembers = this.teamMembers;
      }
    },
    async leavePage() {
      const profileId = this.user.activeProfile.id;
      const token = this.$store.getters['auth/getToken'];

      await this.$axios.post('/team/remove', {
        token,
        profileId
      });

      await this.$axios.post('/user/set-active-profile', {
        token,
        random: true,
        newProfileId: -1
      });
      window.location.reload();
    },
    async updateProfileUsage() {
      const token = this.$store.getters['auth/getToken'];

      this.profileUsage = await this.$axios.$post('/profile/allowed-pages', {
        token
      }) as { published: number, allowed: number };
    },

    getFormattedProfileUsage() {
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

        this.user.id = userResponse.id;
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

        const filename = this.user.activeProfile.handle + '.json';
        // const disposition = response.headers['content-disposition'];
        // if (disposition && disposition.includes('filename')) {
        //   const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        //   const matches = filenameRegex.exec(disposition);
        //   if (matches != null && matches[1]) {
        //     filename = matches[1].replace(/['"]/g, '');
        //   }
        // }
        const blob = new Blob([JSON.stringify(response.data)], {type: 'application/json'});
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
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
      } catch (err: any) {
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

    async deletePage() {
      this.$nuxt.$loading.start();

      await this.$axios.$post('/profile/delete', {
        token: this.$store.getters['auth/getToken']
      });

      this.$nuxt.$loading.finish();

      window.location.replace("/dashboard");
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

.warning {
  @apply bottom-0 rounded-lg shadow border border-gray-200;
  color: mintcream;
  background-color: #ff9900;
  padding: 7px;
  z-index: 25;
}

.vm--modal {
  background: none;
}
</style>
