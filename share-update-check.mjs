import fs from "node:fs";
import path from "node:path";

const file = path.resolve("src/pages/[lang]/walks/[id].astro");
const backup = `${file}.backup-before-share-${Date.now()}`;

let source = fs.readFileSync(file, "utf8");
const beforeLines = source.split(/\r?\n/).length;

const pageTopNeedle = `<div class="page-top">`;
const videoFrameNeedle = `<div class="video-frame">`;
const oldShareQuery = `const shareButton = document.querySelector('[data-share-button]');`;

if (!source.includes(pageTopNeedle)) throw new Error("page-top not found");
if (!source.includes(videoFrameNeedle)) throw new Error("video-frame not found");
if (!source.includes(oldShareQuery)) throw new Error("existing share script not found");

fs.copyFileSync(file, backup);

console.log("Validation OK");
console.log("Original lines:", beforeLines);
console.log("Backup prepared:", backup);
console.log("No source changes made yet.");
