<template>
  <div class="q-mb-xl">
    <div class="text-center" style="font-size: 30px; color: blue">
      <q-item to="/sign-in" exact>
        <q-item-section> Sign In </q-item-section>
      </q-item>
      <q-item to="/business/register" exact>
        <q-item-section>Business Sign Up </q-item-section>
      </q-item>
      <q-item to="/notary/register" exact>
        <q-item-section>Notary Sign Up </q-item-section>
      </q-item>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    return {
      steps: []
    };
  }
};
</script>
<style lang="scss" scoped>
.howto-title {
  font-size: 28px;
  font-style: normal;
  font-weight: 700;
  line-height: 53px;
  letter-spacing: -0.045em;
  text-align: left;
}
</style>
