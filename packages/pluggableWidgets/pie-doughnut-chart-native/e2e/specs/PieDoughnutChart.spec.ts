/* eslint-disable jest/no-disabled-tests */
import { element, by, waitFor } from "detox";
import { expectToMatchScreenshot, launchApp, sessionLogout, tapMenuItem } from "../../../../../detox/src/helpers";

describe("Pie-doughnut chart", () => {
    beforeEach(async () => {
        await launchApp();
        await tapMenuItem("Pie doughnut chart");
    });

    afterEach(async () => {
        await sessionLogout();
    });

    it.skip("renders pie chart correctly", async () => {
        await element(by.text("Pie chart Multiple data points")).tap();
        const matcher = by.id("pieChartMultipleDs");
        await waitFor(element(matcher)).toBeVisible().withTimeout(5000);
        const pieChart = element(matcher);
        await expectToMatchScreenshot(pieChart);
    });

    it.skip("renders doughnut chart correctly", async () => {
        await element(by.text("Doughnut chart Multiple data points")).tap();
        const matcher = by.id("doughnutChartMultipleDs");
        await waitFor(element(matcher)).toBeVisible().withTimeout(5000);
        const doughnutChart = element(matcher);
        await expectToMatchScreenshot(doughnutChart);
    });
});
