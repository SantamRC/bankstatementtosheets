// Notify Bing (and other IndexNow engines) that pages changed.
// Usage: node scripts/indexnow.mjs            → submits every URL in the live sitemap
//        node scripts/indexnow.mjs /banks/chase /pricing   → submits just those paths
// The key is public by design: IndexNow verifies it by fetching /<key>.txt from our site.
const HOST = "bankstatementtosheets.com";
const KEY = "f41940a6e91747d134d7907d7ac23295";
const SITE = `https://${HOST}`;

const keyRes = await fetch(`${SITE}/${KEY}.txt`);
if (!keyRes.ok || (await keyRes.text()).trim() !== KEY) {
  console.error(`[indexnow] key file not live at ${SITE}/${KEY}.txt (status ${keyRes.status}); aborting`);
  process.exit(1);
}

const args = process.argv.slice(2);
const urlList = args.length
  ? args.map((p) => (p.startsWith("http") ? p : `${SITE}${p.startsWith("/") ? "" : "/"}${p}`))
  : [...(await (await fetch(`${SITE}/sitemap.xml`)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
});
console.log(`[indexnow] submitted ${urlList.length} URLs → HTTP ${res.status} ${res.statusText}`);
if (res.status >= 400) {
  console.error(await res.text());
  process.exit(1);
}
