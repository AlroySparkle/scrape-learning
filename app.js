import axios from "axios";
import { load } from "cheerio";
import fs from "fs";
import path from "path";

const BASE = "https://example.com";
const DICT_URL = BASE + "/distination";

//respect delay
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!fs.existsSync("icons")) {
  fs.mkdirSync("icons", { recursive: true });
}

//using buffer to download image through arraybuffer and turn it into data
async function downloadImage(url, filename) {
  const filePath = path.join("icons", filename);

  const response = await axios({
    url,
    method: "GET",
    responseType: "arraybuffer",
  });

  fs.writeFileSync(filePath, response.data);
  console.log("Saved:", filePath);
}

async function main() {
  const dictPage = await axios(DICT_URL);
  const $ = load(dictPage.data);

  const catLinks = $(".cat-dictionary-icons span a")
    .map((_, el) => BASE + $(el).attr("href"))
    .get();

  console.log("Found", catLinks.length, "cats");

  for (const link of catLinks) {
    console.log("Fetching:", link);
    await sleep(500);

    const page = await axios(link);
    const $$ = load(page.data);

    // Get ALL images inside unit-image
    const images = $$("td.unit-image img")
      .map((i, el) => ({
        src: $$(el).attr("src"),
        alt: $$(el).attr("alt") || `image_${i}`,
        index: i,
      }))
      .get();

    if (images.length === 0) {
      console.log("No images found on:", link);
      continue;
    }

    for (const img of images) {
      const fullImgUrl = img.src.startsWith("http")
        ? img.src
        : "https:" + img.src;

      // Make filename unique per form
      const safeName = img.alt.replace(/[\\/:*?"<>|]/g, "") + ".png";

      await downloadImage(fullImgUrl, safeName);
    }
  }
}

main().catch(console.error);
