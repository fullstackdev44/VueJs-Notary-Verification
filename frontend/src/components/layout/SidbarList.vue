<template>
  <div>
    <q-item
      v-for="item in items"
      :key="item.text"
      v-ripple
      :to="item.link"
      clickable
      exact
      @click="onClick(item)"
    >
      <q-item-section avatar>
        <q-icon color="grey" :name="item.icon || 'folder_open'" />
      </q-item-section>
      <q-item-section>
        <q-item-label>
          {{ item.text || item.name }}
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-separator class="q-my-md" />
  </div>
</template>
<script>
export default {
  props: {
    items: {
      type: Array,
      required: true,
    },
  },
  methods: {
    onClick(item) {
      if (item.action) item.action();
    },
  },
};
</script>
