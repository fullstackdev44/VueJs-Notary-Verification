<template>
  <q-scroll-area style="height: 200px; width: 100%">
    <q-infinite-scroll :offset="250" @load="onLoad">
      <template>
        <slot
          name="view"
          :items="items"
          :meta="meta"
          :others="others"
        >
          <div />
        </slot>
      </template>
      <template v-slot:loading>
        <div class="row justify-center q-my-md" style="height: 50px">
          <q-spinner-dots color="primary" size="40px" />
        </div>
      </template>
    </q-infinite-scroll>
  </q-scroll-area>
</template>

<script>
import InfiniteScrollMixin from "@/mixins/InfiniteScrollMixin";

export default {
  name: "InfiniteLoadingTemplate",
  mixins: [InfiniteScrollMixin],
};
</script>
