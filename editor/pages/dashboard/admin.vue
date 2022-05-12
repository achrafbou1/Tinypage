<template>
  <section class="flex flex-col p-8 items-center overflow-x-hidden overflow-y-scroll">
    <div class="flex flex-row items-center justify-start mb-4 space-x-4 mb-4">
      <img class="w-8" src="/icons/High%20voltage.svg">
      <h1 class="text-black font-extrabold tracking-tight text-3xl w-full flex flex-row items-start lg:items-center">
        Admin Settings
      </h1>
    </div>

    <div v-if="error" class="error">
      {{ error }}
    </div>


    <!-- Global Stats -->
    <div class="flex flex-col py-6 bg-white shadow rounded-2xl justify-center items-start w-full mb-8">
      <h2 class="text-black font-bold text-lg w-full px-6 mb-6">
        Global Statistics
      </h2>

      <div v-for="(value, name) in globalStats"
           class="flex flex-col py-2 px-8 cursor-pointer w-full items-start justify-start border border-gray-200 border-t-0 border-l-0 border-r-0"
      >
        {{ name }}: {{ value }}
      </div>
    </div>

    <!--  God Mode Controls -->
    <div class="flex flex-col py-6 bg-white shadow rounded-2xl justify-center items-start w-full mb-8">
      <h2 class="text-black font-bold text-lg w-full px-6 mb-6">
        God Mode Users
      </h2>
      <div class="w-full bg-gray-200" style="height:1px;"/>

      <div class="flex flex-col mt-4 mb-2 w-full px-6 mt-6">
        <div class="flex flex-col items-center justify-start space-y-4 w-full">
          <input
              v-model="godModeEmail"
              aria-label="user email"
              class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full flex-grow"
              placeholder="User Email: e.g. user@example.com"
              type="text"
          >
          <button
              class="w-full flex py-3 px-6 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold justify-center align-center"
              type="button"
              @click="addGodModeUser(godModeEmail); godModeEmail = null;"
          >
            Add User
          </button>
        </div>
      </div>

      <div class="w-full bg-gray-200" style="height:1px;"/>

      <div class="flex flex-row items-center justify-start">
        <h2 class="text-black font-bold text-lg px-6 mb-6 mt-6">
          Users {{ `(${godModeUsers.length})` }}
        </h2>
        <button
            class="py-3 px-6 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold"
            type="button"
            @click="showGodModeUsers = !showGodModeUsers;"
        >
          {{ showGodModeUsers ? 'Hide' : 'Show' }}
        </button>
      </div>

      <div class="w-full bg-gray-200" style="height:1px;"/>
      <div
          v-for="user in godModeUsers"
          v-if="showGodModeUsers"
          :key="user.id"
          class="flex flex-col py-2 px-8 cursor-pointer w-full items-start justify-start border border-gray-200 border-t-0 border-l-0 border-r-0"
      >
        <p class="font-bold text-black text-lg mr-auto">
          Id: {{ user.id }}
        </p>

        <div class="flex flex-row items-center justify-start w-full">
          <div>
            <div
                class="py-1 px-2 mb-1 text-gray-600 text-sm font-extrabold leading-tight"
            >
              Email: {{ user.email }}
            </div>
            <div
                class="py-1 px-2 mb-1 text-gray-600 text-sm font-extrabold leading-tight"
            >
              Created On: {{ new Date(user.createdOn).toUTCString() }}
            </div>
          </div>

          <button
              class="ml-auto py-3 px-6 text-sm text-white text-center bg-red-500 hover:bg-red-700 rounded-2xl font-bold"
              type="button"
              @click="removeGodModeUser(user.email)"
          >
            Remove User
          </button>

        </div>

      </div>
    </div>

    <!-- Banned User Controls -->
    <div class="flex flex-col py-6 bg-white shadow rounded-2xl justify-center items-start w-full mb-8">
      <h2 class="text-black font-bold text-lg w-full px-6 mb-6">
        Banned Users
      </h2>
      <div class="w-full bg-gray-200" style="height:1px;"/>

      <div class="flex flex-col mt-4 mb-2 w-full px-6 mt-6">
        <div class="flex flex-col items-center justify-start space-y-4 w-full">
          <input
              v-model="banUserEmail"
              aria-label="ban user id"
              class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full flex-grow"
              placeholder="User Email: e.g. user@example.com"
              type="text"
          >
          <input
              v-model="banUserReason"
              aria-label="ban user reason"
              class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full flex-grow"
              placeholder="Reason e.g. Phishing"
              type="text"
          >
          <button
              class="w-full flex py-3 px-6 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold justify-center align-center"
              type="button"
              @click="banUser(banUserEmail, banUserReason || undefined); banUserReason = null; banUserEmail = null"
          >
            Ban User
          </button>
        </div>
      </div>

      <div class="w-full bg-gray-200" style="height:1px;"/>

      <div class="flex flex-row items-center justify-start">
        <h2 class="text-black font-bold text-lg px-6 mb-6 mt-6">
          Users {{ loadedBanned ? `(${bannedUsers.length} banned)` : '' }}
        </h2>
        <button
            class="py-3 px-6 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold"
            type="button"
            @click="showBanned = !showBanned; refreshBannedUsersFirstTime()"
        >
          {{ showBanned ? 'Hide' : 'Show' }}
        </button>
      </div>

      <div class="w-full bg-gray-200" style="height:1px;"/>
      <div
          v-for="banned in bannedUsers"
          v-if="showBanned"
          :key="banned.ban.user_id"
          class="flex flex-col py-2 px-8 cursor-pointer w-full items-start justify-start border border-gray-200 border-t-0 border-l-0 border-r-0"
      >
        <p class="font-bold text-black text-lg mr-auto">
          Id: {{ banned.ban.user_id }}
        </p>

        <div class="flex flex-row items-center justify-start w-full">
          <div>
            <div
                class="py-1 px-2 mb-1 text-gray-600 text-sm font-extrabold leading-tight"
            >
              Email: {{ banned.userData.email }}
            </div>
            <div
                v-if="banned.ban.reason"
                class="py-1 px-2 mb-1 text-gray-600 text-sm font-extrabold leading-tight"
            >
              Reason: {{ banned.ban.reason }}
            </div>
            <div
                class="py-1 px-2 mb-1 text-gray-600 text-sm font-extrabold leading-tight"
            >
              Active Profile Id: {{ banned.userData.activeProfileId }}
            </div>
            <div
                class="py-1 px-2 mb-1 text-gray-600 text-sm font-extrabold leading-tight"
            >
              Created On: {{ new Date(banned.userData.createdOn).toUTCString() }}
            </div>
            <div
                class="py-1 px-2 mb-1 text-gray-600 text-sm font-extrabold leading-tight"
            >
              Banned on: {{ new Date(banned.ban.created_on).toUTCString() }}
            </div>
          </div>

          <button
              class="ml-auto py-3 px-6 text-sm text-white text-center bg-red-500 hover:bg-red-700 rounded-2xl font-bold"
              type="button"
              @click="unbanUser(banned.userData.email)"
          >
            Unban User
          </button>

        </div>

      </div>
    </div>

  </section>
</template>

<script lang="ts">
import Vue from "vue";

type ThemeModalIntent = "create" | "edit";

export default Vue.extend({
  name: 'DashboardAdmin',
  layout: 'dashboard',
  middleware: 'authenticated',

  head() {
    return {
      title: 'Admin Settings - ' + this.$customSettings.productName,
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
      godModeEmail: '',
      godModeUsers: [],
      showGodModeUsers: false,

      loadedBanned: false,
      showBanned: false,
      bannedUsers: [] as { ban: DbBanned, userData: SensitiveUser | undefined }[],
      banUserEmail: null as null | string,
      banUserReason: null as null | string,

      error: null as null | string,
      errorIntervalHandler: undefined as any,

      isAdmin: false,

      globalStats: {}
    };
  },

  async mounted() {
    const permGroup = await this.$axios.$post("/admin/perm-group", {
      token: this.$store.getters['auth/getToken']
    });

    this.isAdmin = permGroup["groupName"] === 'admin';

    this.globalStats = await this.$axios.$get("/analytics") as {
      users: number,
      profiles: number,
      profilesPublished: number,
      links: number,
      themes: number
    };

    this.getGodModeUsers().catch();
  },

  methods: {
    async addGodModeUser(email: string) {
      await this.$axios.$post("/admin/set-godmode-user", {
        token: this.$store.getters['auth/getToken'],
        email,
        set: true
      });

      await this.getGodModeUsers();
    },

    async removeGodModeUser(email: string) {
      await this.$axios.$post("/admin/set-godmode-user", {
        token: this.$store.getters['auth/getToken'],
        email,
        set: false
      });

      await this.getGodModeUsers();
    },

    async getGodModeUsers() {
      this.godModeUsers = await this.$axios.$post("/admin/godmode-users", {
        token: this.$store.getters['auth/getToken']
      });
    },

    async refreshBannedUsersFirstTime() {
      if (!this.loadedBanned) {
        await this.refreshBannedUsers();
        this.loadedBanned = true;
      }
    },

    async refreshBannedUsers() {
      let token = this.$store.getters['auth/getToken'];

      this.bannedUsers = (await this.$axios.post('/admin/bans', {
        token
      })).data as { ban: DbBanned, userData: SensitiveUser | undefined }[];
    },

    async banUser(email: string, reason?: string) {
      let token = this.$store.getters['auth/getToken'];

      try {
        await this.$axios.post('/admin/set-banned', {
          token,
          email: email,
          reason: reason,
          banned: true
        });

        await this.refreshBannedUsers();

        console.log(`Banned user: ${email}${reason ? " for reason: " + reason : ""}`);
      } catch (err) {
        this.error = err.response.data.error;

        if (this.errorIntervalHandler !== undefined)
          clearInterval(this.errorIntervalHandler);

        this.errorIntervalHandler = setInterval(() => this.error = '', 5000);
      }
    },

    async unbanUser(email: string) {
      let token = this.$store.getters['auth/getToken'];

      await this.$axios.post('/admin/set-banned', {
        token,
        email: email,
        banned: false
      });

      await this.refreshBannedUsers();

      console.log(`Unbanned user: ${email}`);
    }
  }
});
</script>

<style lang="scss">
.nc-theme {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  margin-right: 10px;
  cursor: pointer;

  &.active {
    box-shadow: inset 0 0 2px 2px #478ecc;
  }

  .nc-inner {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 40px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .edit-icon {
    position: absolute;
    top: 2px;
    right: 5px;
    color: #3e39ab;
  }

  .nc-bottom-inner {
    width: 100%;
    height: 15px;
    margin-top: auto;
  }

  &:hover {
    transform: scale(1.02);
  }

  &:active {
    transform: scale(1);
  }

}

/**
  Animations
 */

.fade-enter-active, .fade-leave-active {
  transition: opacity .25s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

.error {
  @apply bottom-0 rounded-lg shadow border border-gray-200;
  color: mintcream;
  background-color: #ff4a4a;
  padding: 7px;
  z-index: 25;
}
</style>
