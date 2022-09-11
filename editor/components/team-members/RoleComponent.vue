<template>
  <select
      v-model="role"
      class="text-green-500 bg-green-200"
      style="min-width: 120px; max-width: 161px;"
      @change="onMemberRoleUpdate(data.email, data.role)"
  >
    <option selected value="editor">
      Editor
    </option>
  </select>
</template>
<script lang="ts">
import Vue from 'vue';
import EventBus from "~/plugins/eventbus";

export default Vue.extend({
  name: 'RoleComponent',
  props: {
    data: {
      type: Object as () => ProfileMember,
      required: true
    }
  },
  computed: {
    role(): string {
      return this.data.role;
    }
  },
  methods: {
    onMemberRoleUpdate(email: string, role: string) {

      EventBus.$emit('addTeamMembers', {email, role});
      EventBus.$emit('getTeamMembers');
    },
  }
});
</script>
