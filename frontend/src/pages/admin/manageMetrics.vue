<template>
  <q-layout>
    <q-page-container class="container">
      <q-page class="q-py-lg">
        <div class="flex justify-between q-py-md items-center">
          <h1 class="">
            Metrics
          </h1>
        </div>
        <template v-if="loading">
          <div class="renderer">
            <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 100px;" />
          </div>
        </template>
        <template v-else>
          <q-btn-group push>
            <q-btn push label="1 Week" @click="toggleMetricTimeSet('weekly')" />
            <q-btn push label="1 Month" @click="toggleMetricTimeSet('monthly')" />
            <q-btn push label="3 Months" @click="toggleMetricTimeSet('3monthly')" />
            <q-btn push label="1 Year" @click="toggleMetricTimeSet('yearly')" />
          </q-btn-group>
          <div class="columns is-multiline">
            <template v-for="metric in metricsTimeSet">
              <!-- <div :key="metric.key + '_chart'" class="column" :class="(currentMetricTimeSet === 'yearly') ? 'is-12':'is-6'"> -->
              <div :key="metric.key + '_chart'" class="column is-6">
                <template v-if="metric.chartType === 'bar'">
                  <Bar
                    :chart-id="metric.key + 'chartId'"
                    :chart-options="chartOptions"
                    :chart-data="metric.chartData"
                  />
                </template>
                <template v-else-if="metric.chartType === 'line'">
                  <LineChartGenerator
                    :chart-id="metric.key + 'chartId'"
                    :chart-options="chartOptions"
                    :chart-data="metric.chartData"
                  />
                </template>
              </div>
            </template>
          </div>
          <div class="columns is-multiline" style="margin-top: 20px">
            <template v-for="metric in metrics">
              <div :key="metric.key" class="column is-5">{{ metric.name }} </div>
              <div :key="metric.key + 'value'" class="column is-6" style="font-weight: bold">
                {{ metric.value }}
                <template v-if="metric.key === 'totalProNotaries'">
                  <q-btn
                    :key="metric.key + 'btn'"
                    style="margin-left: 12px"
                    color="primary"
                    size="sm"
                    label="Fetch Data"
                    :loading="fetchButtonLoading[metric.key]"
                    @click="fetchMoreMetrics(metric.key)"
                  />
                </template>
              </div>
            </template>
          </div>
        </template>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { $axios } from "boot/axios";
import { Bar, Line as LineChartGenerator } from "vue-chartjs/legacy";

// import {
//  Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement
// } from "chart.js";

// ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement);

import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default {
  name: "ManageMetrics",
  components: { Bar, LineChartGenerator },
  data() {
    return {
      loading: false,
      metrics: [],
      metricsTimeSet: [],
      fetchButtonLoading: {
        totalProNotaries: false
      },
      chartOptions: {
        responsive: true
      },
      currentMetricTimeSet: "weekly"
    };
  },
  async mounted () {
    this.loading = true;
    await this.loadMetrics(this.current);
    this.loading = false;
    this.disableButtons = false;
    await this.toggleMetricTimeSet("weekly");
  },
  methods: {
    async loadMetrics(options) {
      const baseUrl = "admins/fetchMetrics";
      const url = baseUrl;
      const response = await $axios.post(url, options, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.metrics = response.data.metrics;
    },
    async loadMetricsTimeSet(options) {
      const baseUrl = "admins/fetchMetricsTimeSet";
      const url = baseUrl;
      const response = await $axios.post(url, options, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.metricsTimeSet = response.data.metricsTimeSet;
    },
    async fetchMoreMetrics(metricKey) {
      const dataToSend = {};
      dataToSend[metricKey] = true;
      this.fetchButtonLoading[metricKey] = true;
      await this.loadMetrics(dataToSend);
      this.fetchButtonLoading[metricKey] = false;
    },
    async toggleMetricTimeSet(metricTimeSet) {
      this.currentMetricTimeSet = metricTimeSet;
      const dataToSend = {};
      dataToSend.timeset = metricTimeSet;
      this.loadMetricsTimeSet(dataToSend);
    }
  },
};
</script>
