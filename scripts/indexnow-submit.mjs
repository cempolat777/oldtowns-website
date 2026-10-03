import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const HOST = "oldtownswalks.com";
const BASE_URL = `https://${HOST}`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const KEY = "af4a8cbe92224d1a8655d3ae8e955510";
const KEY_LOCATION = `${BASE_URL}/${KEY}.txt`;

const LANGUAGES = [
  "en", "de", "es", "fr", "tr", "it", "nl", "pl", "pt",
  "sv", "ru", "ja", "ko", "zh", "hi", "id", "vi", "ar"
];

const BATCH_SIZE = 10000;
const videosPath = path.resolve("src/data/videos.json");
const statePath = path.resolve(".indexnow-state.json");

if (!fs.existsSync(videosPath)) {
  throw new Error(`Missing videos file: ${videosPath}`);
}

const videos = JSON.parse(fs.readFileSync(videosPath, "utf8"));

function hashVideo(video) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(video))
    .digest("hex");
}

const currentState = {};

for (const video of videos) {
  const id = String(video?.id || "").trim();

  if (!id) {
    continue;
  }

  currentState[id] = {
    hash: hashVideo(video),
    active: video?.active !== false
  };
}

let previousState = {};

if (fs.existsSync(statePath)) {
  try {
    previousState = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    console.warn(
      "IndexNow: previous state could not be read; using current data as baseline."
    );

    fs.writeFileSync(
      statePath,
      `${JSON.stringify(currentState, null, 2)}\n`,
      "utf8"
    );

    process.exit(0);
  }
}

const changedIds = new Set();

for (const [id, current] of Object.entries(currentState)) {
  const previous = previousState[id];

  if (
    !previous ||
    previous.hash !== current.hash ||
    previous.active !== current.active
  ) {
    changedIds.add(id);
  }
}

for (const id of Object.keys(previousState)) {
  if (!currentState[id]) {
    changedIds.add(id);
  }
}

if (changedIds.size === 0) {
  console.log("IndexNow: no changed URLs to submit.");
  process.exit(0);
}

const urls = [];

for (const id of changedIds) {
  const encodedId = encodeURIComponent(id);

  for (const lang of LANGUAGES) {
    urls.push(`${BASE_URL}/${lang}/walks/${encodedId}`);
  }
}

console.log(
  `IndexNow: ${changedIds.size} changed videos produced ${urls.length} URLs.`
);

for (let offset = 0; offset < urls.length; offset += BATCH_SIZE) {
  const batch = urls.slice(offset, offset + BATCH_SIZE);

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: batch
    })
  });

  if (response.status === 403) {
    const body = await response.text();

    if (body.includes("SiteVerificationNotCompleted")) {
      console.warn(
        "IndexNow: site verification is still pending. URLs will be retried on the next run."
      );
      process.exit(0);
    }

    throw new Error(
      `IndexNow failed: HTTP 403${body ? ` - ${body}` : ""}`
    );
  }

  if (!response.ok && response.status !== 202) {
    const body = await response.text();

    throw new Error(
      `IndexNow failed: HTTP ${response.status}${body ? ` - ${body}` : ""}`
    );
  }

  console.log(
    `IndexNow: submitted ${batch.length} URLs (${offset + 1}-${offset + batch.length}) HTTP ${response.status}.`
  );
}

fs.writeFileSync(
  statePath,
  `${JSON.stringify(currentState, null, 2)}\n`,
  "utf8"
);

console.log("IndexNow: submission complete and state saved.");
