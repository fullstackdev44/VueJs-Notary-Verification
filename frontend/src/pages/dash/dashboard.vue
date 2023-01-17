<template>
  <q-page>
    <div class="landing q-pa-sm q-mx-auto">
      <div class="outer">
        <div class="middle">
          <div class="inner">
            <get-started />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import GetStarted from "@/components/landing/GetStarted";

export default {
  components: {
    GetStarted
  }
};
</script>
