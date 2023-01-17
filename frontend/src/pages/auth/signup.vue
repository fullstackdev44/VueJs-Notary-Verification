<template>
  <q-page
    class="window-height window-width row justify-center items-center"
    style="
      background: url('https://bluenotary.us/assets/img/red-flower.jpg');
      background-size: cover;
      overflow-x:hidden;
    "
  >
    <div class="flex">
      <div class="flex flex-center" style="max-width:450px; margin:0 auto">
        <div class="flex-center flex q-pa-md">
          <a :href="clickLinkUrl">
            <img
              :src="imageSource"
              style="width: 70px"
            />
          </a>
        </div>
        <SignUpForm :vendor-doc="vendorDoc" :vendor-data-fetched="dataFetched" />
      </div>
    </div>
  </q-page>
</template>

<script>
import SignUpForm from "components/auth/SignUpForm";
import { $axios } from "boot/axios";

export default {
  components: {
    SignUpForm,
  },
  data () {
    return {
      isSubmitting: false,
      dataFetched: false,
      vendorDoc: {}
    };
  },
  computed: {
    clickLinkUrl () {
      let clickLinkUrl = "https://bluenotary.us";
      if (this.vendorDoc?.whitelabel_click_linkurl) {
        clickLinkUrl = this.vendorDoc?.whitelabel_click_linkurl;
      }
      return clickLinkUrl;
    },
    imageSource () {
      if (!this.dataFetched) {
        return "";
      }
      let imageSourceUrl = "https://bluenotary.us/assets/img/logo-a4-b.png";
      if (this.vendorDoc?.whitelabel_imageurl) {
        imageSourceUrl = this.vendorDoc?.whitelabel_imageurl;
      }
      if (this.vendorDoc?.whitelabel_selective?.signup?.whitelabel_imageurl) {
        imageSourceUrl = this.vendorDoc?.whitelabel_selective?.signup?.whitelabel_imageurl;
      }
      return imageSourceUrl;
    }
  },
  async mounted () {
    const url = "/users/me_sign";
    const response = await $axios.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.dataFetched = true;
    console.log("response", response);
    this.vendorDoc = response?.data?.vendorDoc;
  }
};
</script>

<style></style>
