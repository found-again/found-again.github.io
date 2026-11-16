/* ============================================================
   Found Again · website settings
   This is the one file to edit when you add an episode or
   connect the Google Sheet logger. Keep the commas and quotes.
   ============================================================ */
window.FOUND_AGAIN_CONFIG = {

  // 1) Paste the Apps Script "Web app URL" here (README.md, Part A, step 7).
  //    It looks like: https://script.google.com/macros/s/AKfycb.../exec
  //    Leave it as "" and nothing is logged.
  logUrl: "https://script.google.com/macros/s/AKfycbz3wvBFabkzzSWaO3Rojn0JGujfjoAGwEnrCRLHpzXrV8qVHR4fMucvedh23wzT_2fs/exec",

  // 2) A simple shared key. It must match SITE_KEY at the top of apps-script/Code.gs.
  siteKey: "found-again-2026",

  // 3) Episodes people can download. To add one: drop the PDF into pdfs/,
  //    add cover and page images to assets/img/, then copy one of these blocks.
  episodes: [
    {
      number: 1,
      title: "Found Again",
      subtitle: "Aquila's dream · The Bitterroot Valley, Montana, 1898",
      pages: 40,
      file: "pdfs/found-again-ep1.pdf",
      fileSize: "20 MB",
      downloadName: "Found Again - Episode 1 - Found Again.pdf",
      cover: "assets/img/ep1-cover.jpg",
      blurb: "On a cold winter night in 1898, Aquila Dye dreams that two young men come to her farmhouse door. Six family lines, from New Hampshire, Maine, Scotland, Kentucky, and Wales, have ended up in the same green valley, and two missionaries are walking north to find them.",
      gallery: [
        { src: "assets/img/ep1-p03.jpg", thumb: "assets/img/ep1-p03-thumb.jpg", caption: "Page 2 · Two young men at the door" },
        { src: "assets/img/ep1-p13.jpg", thumb: "assets/img/ep1-p13-thumb.jpg", caption: "Page 12 · Six family lines, one valley" },
        { src: "assets/img/ep1-p26.jpg", thumb: "assets/img/ep1-p26-thumb.jpg", caption: "Page 25 · George runs after the elders" },
        { src: "assets/img/ep1-p31.jpg", thumb: "assets/img/ep1-p31-thumb.jpg", caption: "Page 30 · Baptism in the Bitterroot, March 1898" }
      ]
    },
    {
      number: 2,
      title: "They Knew the Prophet",
      subtitle: "Newman and Sally Blodgett · Bath, New Hampshire, 1832",
      pages: 26,
      file: "pdfs/found-again-ep2.pdf",
      fileSize: "12 MB",
      downloadName: "Found Again - Episode 2 - They Knew the Prophet.pdf",
      cover: "assets/img/ep2-cover.jpg",
      blurb: "Newman Blodgett was a builder of bridges who tested a thing before he trusted it. In the spring of 1832 two young missionaries, Orson Pratt and Lyman Johnson, came walking over the hills into Bath. Sally believed first.",
      gallery: [
        { src: "assets/img/ep2-p04.jpg", thumb: "assets/img/ep2-p04-thumb.jpg", caption: "Page 4 · Two young men over the hills" },
        { src: "assets/img/ep2-p13.jpg", thumb: "assets/img/ep2-p13-thumb.jpg", caption: "Page 13 · “I believe it's true”" },
        { src: "assets/img/ep2-p14.jpg", thumb: "assets/img/ep2-p14-thumb.jpg", caption: "Page 14 · Sally goes first" },
        { src: "assets/img/ep2-p21.jpg", thumb: "assets/img/ep2-p21-thumb.jpg", caption: "Page 21 · Joseph Smith and Polly" }
      ]
    }
  ],

  // 4) Episodes in the works (shown without a download). Delete an entry when its book is published.
  comingNext: [
    { number: 3, title: "The Girl Who Believed Alone", subtitle: "Mary Ann Parker · Wales, 1853", status: "In production" },
    { number: 5, title: "Converted by a Book", subtitle: "John and Elizabeth Riddle · Kentucky, 1843", status: "In production" }
  ]
};
