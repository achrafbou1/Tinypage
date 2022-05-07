<template>
  <div>
    <button
        :aria-controls="`collapse${_uid}`"
        :aria-expanded="isOpen"
        class="flex items-center space-x-3"
        @click="toggleAccordion()"
    >
      <slot name="title"/>
      <svg
          :class="{
          'rotate-180': isOpen,
          'rotate-0': !isOpen,
        }"
          aria-hidden="true"
          class="w-3 transition-all duration-200 transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 16 10"
          xmlns="http://www.w3.org/2000/svg"
      >
        <path
            d="M15 1.2l-7 7-7-7"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
        />
      </svg>
    </button>

    <div v-show="isOpen" :id="`collapse${_uid}`">
      <slot name="content"/>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      isOpen: false,
    }
  },

  methods: {
    toggleAccordion () {
      this.isOpen = !this.isOpen
    },
  },
}
</script>
