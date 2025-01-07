import { expect, test } from "vitest";
import {
  checkClickhouseConnection,
  countCuratedInferences,
  countFeedbacksForMetric,
  countInferencesForFunction,
  getCuratedInferences,
  queryEpisodeTable,
  queryEpisodeTableBounds,
  queryInferenceTable,
  queryInferenceTableBounds,
} from "./clickhouse";

test("checkClickhouseConnection", async () => {
  const result = await checkClickhouseConnection();
  expect(result).toBe(true);
});

// Test boolean metrics
test("countCuratedInferences for boolean metrics", async () => {
  // JSON Inference level
  const jsonInferenceResult = await countCuratedInferences(
    "dashboard_fixture_extract_entities",
    { type: "json", variants: {} },
    "dashboard_fixture_exact_match",
    { type: "boolean", optimize: "max", level: "inference" },
    0, // threshold not used for boolean
  );
  expect(jsonInferenceResult).toBe(41);

  // JSON Episode level
  const jsonEpisodeResult = await countCuratedInferences(
    "dashboard_fixture_extract_entities",
    { type: "json", variants: {} },
    "dashboard_fixture_exact_match_episode",
    { type: "boolean", optimize: "max", level: "episode" },
    0,
  );
  expect(jsonEpisodeResult).toBe(29);

  // Chat Inference level
  const chatInferenceResult = await countCuratedInferences(
    "dashboard_fixture_write_haiku",
    {
      type: "chat",
      variants: {},
      tools: [],
      tool_choice: "none",
      parallel_tool_calls: false,
    },
    "dashboard_fixture_haiku_score",
    { type: "boolean", optimize: "max", level: "inference" },
    0,
  );
  expect(chatInferenceResult).toBe(80);

  // Chat Episode level
  const chatEpisodeResult = await countCuratedInferences(
    "dashboard_fixture_write_haiku",
    {
      type: "chat",
      variants: {},
      tools: [],
      tool_choice: "none",
      parallel_tool_calls: false,
    },
    "dashboard_fixture_haiku_score_episode",
    { type: "boolean", optimize: "max", level: "episode" },
    0,
  );
  expect(chatEpisodeResult).toBe(9);
});

// Test float metrics
test("countCuratedInferences for float metrics", async () => {
  // JSON Inference level
  const jsonInferenceResult = await countCuratedInferences(
    "dashboard_fixture_extract_entities",
    { type: "json", variants: {} },
    "dashboard_fixture_jaccard_similarity",
    { type: "float", optimize: "max", level: "inference" },
    0.8,
  );
  expect(jsonInferenceResult).toBe(54);

  // JSON Episode level
  const jsonEpisodeResult = await countCuratedInferences(
    "dashboard_fixture_extract_entities",
    { type: "json", variants: {} },
    "dashboard_fixture_jaccard_similarity_episode",
    { type: "float", optimize: "max", level: "episode" },
    0.8,
  );
  expect(jsonEpisodeResult).toBe(35);

  // Chat Inference level
  const chatInferenceResult = await countCuratedInferences(
    "dashboard_fixture_write_haiku",
    {
      type: "chat",
      variants: {},
      tools: [],
      tool_choice: "none",
      parallel_tool_calls: false,
    },
    "dashboard_fixture_haiku_rating",
    { type: "float", optimize: "max", level: "inference" },
    0.8,
  );
  expect(chatInferenceResult).toBe(67);

  // Chat Episode level
  const chatEpisodeResult = await countCuratedInferences(
    "dashboard_fixture_write_haiku",
    {
      type: "chat",
      variants: {},
      tools: [],
      tool_choice: "none",
      parallel_tool_calls: false,
    },
    "dashboard_fixture_haiku_rating_episode",
    { type: "float", optimize: "max", level: "episode" },
    0.8,
  );
  expect(chatEpisodeResult).toBe(11);
});

// Test demonstration metrics
test("countCuratedInferences for demonstration metrics", async () => {
  const jsonResult = await countCuratedInferences(
    "dashboard_fixture_extract_entities",
    { type: "json", variants: {} },
    "unused_metric_name",
    { type: "demonstration", level: "inference" },
    0,
  );
  expect(jsonResult).toBe(100);

  const chatResult = await countCuratedInferences(
    "dashboard_fixture_write_haiku",
    {
      type: "chat",
      variants: {},
      tools: [],
      tool_choice: "none",
      parallel_tool_calls: false,
    },
    "unused_metric_name",
    { type: "demonstration", level: "inference" },
    0,
  );
  expect(chatResult).toBe(493);
});

// Test getCuratedInferences
test("getCuratedInferences retrieves correct data", async () => {
  // Test with boolean metric
  const booleanResults = await getCuratedInferences(
    "dashboard_fixture_extract_entities",
    { type: "json", variants: {} },
    "dashboard_fixture_exact_match",
    { type: "boolean", optimize: "max", level: "inference" },
    0,
    undefined,
  );
  expect(booleanResults.length).toBe(41);

  // Test with float metric
  const floatResults = await getCuratedInferences(
    "dashboard_fixture_write_haiku",
    {
      type: "chat",
      variants: {},
      tools: [],
      tool_choice: "none",
      parallel_tool_calls: false,
    },
    "dashboard_fixture_haiku_rating",
    { type: "float", optimize: "max", level: "inference" },
    0.8,
    undefined,
  );
  expect(floatResults.length).toBe(67);

  // Test with demonstration
  const demoResults = await getCuratedInferences(
    "dashboard_fixture_extract_entities",
    { type: "json", variants: {} },
    "unused_metric_name",
    { type: "demonstration", level: "inference" },
    0,
    20,
  );
  expect(demoResults.length).toBe(20);

  // Test without metric (should return all inferences)
  const allResults = await getCuratedInferences(
    "dashboard_fixture_extract_entities",
    { type: "json", variants: {} },
    null,
    null,
    0,
    undefined,
  );
  expect(allResults.length).toBe(400);
});

// Test countFeedbacksForMetric
test("countFeedbacksForMetric returns correct counts", async () => {
  // Test boolean metrics
  const booleanInferenceCount = await countFeedbacksForMetric(
    "dashboard_fixture_extract_entities",
    { type: "json", variants: {} },
    "dashboard_fixture_exact_match",
    { type: "boolean", optimize: "max", level: "inference" },
  );
  expect(booleanInferenceCount).toBe(99);

  // Test float metrics
  const floatInferenceCount = await countFeedbacksForMetric(
    "dashboard_fixture_write_haiku",
    {
      type: "chat",
      variants: {},
      tools: [],
      tool_choice: "none",
      parallel_tool_calls: false,
    },
    "dashboard_fixture_haiku_rating",
    { type: "float", optimize: "max", level: "inference" },
  );
  expect(floatInferenceCount).toBe(491);

  // Test demonstration
  const demoCount = await countFeedbacksForMetric(
    "dashboard_fixture_extract_entities",
    { type: "json", variants: {} },
    "unused_metric_name",
    { type: "demonstration", level: "inference" },
  );
  expect(demoCount).toBe(100);
});

// Test countInferencesForFunction
test("countInferencesForFunction returns correct counts", async () => {
  const jsonCount = await countInferencesForFunction(
    "dashboard_fixture_extract_entities",
    { type: "json", variants: {} },
  );
  expect(jsonCount).toBe(400);

  const chatCount = await countInferencesForFunction(
    "dashboard_fixture_write_haiku",
    {
      type: "chat",
      variants: {},
      tools: [],
      tool_choice: "none",
      parallel_tool_calls: false,
    },
  );
  expect(chatCount).toBe(494);
});

test("queryInferenceTable", async () => {
  const inferences = await queryInferenceTable({
    page_size: 10,
  });
  expect(inferences.length).toBe(10);

  // Verify IDs are in descending order
  for (let i = 1; i < inferences.length; i++) {
    expect(inferences[i - 1].id > inferences[i].id).toBe(true);
  }

  const inferences2 = await queryInferenceTable({
    before: inferences[inferences.length - 1].id,
    page_size: 10,
  });
  expect(inferences2.length).toBe(10);
});

test("queryInferenceTable pages through all results correctly using before", async () => {
  const PAGE_SIZE = 100;
  let currentPage = await queryInferenceTable({
    page_size: PAGE_SIZE,
  });

  // Keep track of how many full pages we've seen
  let numFullPages = 0;
  let totalElements = 0;

  while (currentPage.length === PAGE_SIZE) {
    totalElements += currentPage.length;

    // Verify each page is the correct size
    expect(currentPage.length).toBe(PAGE_SIZE);
    // Verify IDs are in descending order within each page
    for (let i = 1; i < currentPage.length; i++) {
      expect(currentPage[i - 1].id > currentPage[i].id).toBe(true);
    }

    // Get next page using last item's ID as cursor
    currentPage = await queryInferenceTable({
      before: currentPage[currentPage.length - 1].id,
      page_size: PAGE_SIZE,
    });

    numFullPages++;
  }

  // Add the remaining elements from the last page
  totalElements += currentPage.length;

  // The last page should have fewer items than PAGE_SIZE
  // (unless the total happens to be exactly divisible by PAGE_SIZE)
  expect(currentPage.length).toBeLessThanOrEqual(PAGE_SIZE);

  // Verify total number of elements
  expect(totalElements).toBe(2475);

  // We should have seen at least one full page
  expect(numFullPages).toBeGreaterThan(0);
});

test("queryInferenceTable pages through all results correctly using after", async () => {
  const PAGE_SIZE = 100;

  // First get to the last page to find the earliest ID
  let currentPage = await queryInferenceTable({
    page_size: PAGE_SIZE,
  });

  while (currentPage.length === PAGE_SIZE) {
    currentPage = await queryInferenceTable({
      before: currentPage[currentPage.length - 1].id,
      page_size: PAGE_SIZE,
    });
  }

  // Now we have the earliest ID, let's page forward using after
  const firstId = currentPage[currentPage.length - 1].id;
  currentPage = await queryInferenceTable({
    after: firstId,
    page_size: PAGE_SIZE,
  });

  // Keep track of how many full pages we've seen
  let numFullPages = 0;
  let totalElements = 0;

  while (currentPage.length === PAGE_SIZE) {
    totalElements += currentPage.length;

    // Verify each page is the correct size
    expect(currentPage.length).toBe(PAGE_SIZE);

    // Verify IDs are in descending order within each page
    for (let i = 1; i < currentPage.length; i++) {
      expect(currentPage[i - 1].id > currentPage[i].id).toBe(true);
    }

    // Get next page using first item's ID as cursor
    currentPage = await queryInferenceTable({
      after: currentPage[0].id,
      page_size: PAGE_SIZE,
    });

    numFullPages++;
  }

  // Add the remaining elements from the last page
  totalElements += currentPage.length;

  // The last page should have fewer items than PAGE_SIZE
  // (unless the total happens to be exactly divisible by PAGE_SIZE)
  expect(currentPage.length).toBeLessThanOrEqual(PAGE_SIZE);

  // Verify total number of elements matches the previous test
  expect(totalElements).toBe(2474); // One less than with before because we excluded the first ID

  // We should have seen at least one full page
  expect(numFullPages).toBeGreaterThan(0);
});

test("queryInferenceTable after future timestamp is empty", async () => {
  // Create a future timestamp UUID - this will be larger than any existing ID
  const futureUUID = "ffffffff-ffff-7fff-ffff-ffffffffffff";
  const inferences = await queryInferenceTable({
    after: futureUUID,
    page_size: 10,
  });
  expect(inferences.length).toBe(0);
});

test("queryInferenceTable before past timestamp is empty", async () => {
  // Create a past timestamp UUID - this will be smaller than any existing ID
  const pastUUID = "00000000-0000-7000-0000-000000000000";
  const inferences = await queryInferenceTable({
    before: pastUUID,
    page_size: 10,
  });
  expect(inferences.length).toBe(0);
});

// These are the same because the early inferences are in singleton episodes.
// We might change this for better test coverage in the future.
test("queryInferenceTableBounds", async () => {
  const bounds = await queryInferenceTableBounds();
  expect(bounds.first_id).toBe("0192ced0-9873-70e2-ade5-dc5b8faea232");
  expect(bounds.last_id).toBe("01942e28-4a3c-7873-b94d-402a9cc83f2a");
});

test("queryEpisodeTableBounds", async () => {
  const bounds = await queryEpisodeTableBounds();
  expect(bounds.first_id).toBe("0192ced0-9873-70e2-ade5-dc5b8faea232");
  expect(bounds.last_id).toBe("01942e28-4a3c-7873-b94d-402a9cc83f2a");
});

test("queryEpisodeTable", async () => {
  const episodes = await queryEpisodeTable({
    page_size: 10,
  });
  expect(episodes.length).toBe(10);

  // Verify last_inference_ids are in descending order
  for (let i = 1; i < episodes.length; i++) {
    expect(
      episodes[i - 1].last_inference_id > episodes[i].last_inference_id,
    ).toBe(true);
  }

  // Test pagination with before
  const episodes2 = await queryEpisodeTable({
    before: episodes[episodes.length - 1].last_inference_id,
    page_size: 10,
  });
  expect(episodes2.length).toBe(10);

  // Test pagination with after on the last inference id
  const episodes3 = await queryEpisodeTable({
    after: episodes[0].last_inference_id,
    page_size: 10,
  });
  expect(episodes3.length).toBe(0);

  // Test that before and after together throws error
  await expect(
    queryEpisodeTable({
      before: episodes[0].last_inference_id,
      after: episodes[0].last_inference_id,
      page_size: 10,
    }),
  ).rejects.toThrow("Cannot specify both 'before' and 'after' parameters");

  // Verify each episode has valid data
  for (const episode of episodes) {
    expect(typeof episode.episode_id).toBe("string");
    expect(episode.count).toBeGreaterThan(0);
    expect(episode.start_time).toBeDefined();
    expect(episode.end_time).toBeDefined();
    expect(typeof episode.last_inference_id).toBe("string");
    // Start time should be before or equal to end time
    expect(new Date(episode.start_time) <= new Date(episode.end_time)).toBe(
      true,
    );
  }
});

test("queryEpisodeTable pages through all results correctly using before", async () => {
  const PAGE_SIZE = 100;
  let currentPage = await queryEpisodeTable({
    page_size: PAGE_SIZE,
  });

  // Keep track of how many full pages we've seen
  let numFullPages = 0;
  let totalElements = 0;

  while (currentPage.length === PAGE_SIZE) {
    totalElements += currentPage.length;

    // Verify each page is the correct size
    expect(currentPage.length).toBe(PAGE_SIZE);
    // Verify IDs are in descending order within each page
    for (let i = 1; i < currentPage.length; i++) {
      expect(
        currentPage[i - 1].last_inference_id > currentPage[i].last_inference_id,
      ).toBe(true);
    }

    // Get next page using last item's ID as cursor
    currentPage = await queryEpisodeTable({
      before: currentPage[currentPage.length - 1].last_inference_id,
      page_size: PAGE_SIZE,
    });

    numFullPages++;
  }

  // Add the remaining elements from the last page
  totalElements += currentPage.length;

  // The last page should have fewer items than PAGE_SIZE
  // (unless the total happens to be exactly divisible by PAGE_SIZE)
  expect(currentPage.length).toBeLessThanOrEqual(PAGE_SIZE);

  // Verify total number of elements
  expect(totalElements).toBe(944);

  // We should have seen at least 9 full pages
  expect(numFullPages).toBeGreaterThan(8);
});

test("queryEpisodeTable pages through all results correctly using after", async () => {
  const PAGE_SIZE = 100;

  // First get to the last page to find the earliest ID
  let currentPage = await queryEpisodeTable({
    page_size: PAGE_SIZE,
  });

  while (currentPage.length === PAGE_SIZE) {
    currentPage = await queryEpisodeTable({
      before: currentPage[currentPage.length - 1].last_inference_id,
      page_size: PAGE_SIZE,
    });
  }

  // Now we have the earliest ID, let's page forward using after
  const firstId = currentPage[currentPage.length - 1].last_inference_id;
  currentPage = await queryEpisodeTable({
    after: firstId,
    page_size: PAGE_SIZE,
  });

  // Keep track of how many full pages we've seen
  let numFullPages = 0;
  let totalElements = 0;

  while (currentPage.length === PAGE_SIZE) {
    totalElements += currentPage.length;

    // Verify each page is the correct size
    expect(currentPage.length).toBe(PAGE_SIZE);

    // Verify IDs are in descending order within each page
    for (let i = 1; i < currentPage.length; i++) {
      expect(
        currentPage[i - 1].last_inference_id > currentPage[i].last_inference_id,
      ).toBe(true);
    }

    // Get next page using first item's ID as cursor
    currentPage = await queryEpisodeTable({
      after: currentPage[0].last_inference_id,
      page_size: PAGE_SIZE,
    });

    numFullPages++;
  }

  // Add the remaining elements from the last page
  totalElements += currentPage.length;

  // The last page should have fewer items than PAGE_SIZE
  // (unless the total happens to be exactly divisible by PAGE_SIZE)
  expect(currentPage.length).toBeLessThanOrEqual(PAGE_SIZE);

  // Verify total number of elements matches the previous test
  expect(totalElements).toBe(943); // One less than with before because we excluded the first ID

  // We should have seen at least 9 full pages
  expect(numFullPages).toBeGreaterThan(8);
});
