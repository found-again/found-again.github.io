# Found Again · the website

A one-page site where family can see the picture books, sign a guestbook with their
first and last name, and download each episode as a PDF. Every sign-in and download is
recorded in a Google Sheet that only you can see.

**How it fits together**

| Piece | Where it runs | Cost |
| --- | --- | --- |
| The web page, images and PDFs (this folder) | GitHub Pages, at https://found-again.github.io/ | free |
| The guestbook log and the summary counts | A Google Sheet in your Drive | free |
| The bridge between them (`apps-script/Code.gs`) | Google Apps Script, attached to that Sheet | free |

The page asks for a name before the download buttons work, remembers the name in that
browser, and sends a small record to the Sheet for each sign-in, return visit, download,
and "read in your browser" click.

## What is in this folder

```
index.html              the page
assets/config.js        the settings you edit: the logger address and the episode list
assets/styles.css       the look
assets/app.js           the behavior (guestbook, download logging, page viewer)
assets/img/             covers, sample pages, hero image, icons
pdfs/                   the books people download
apps-script/Code.gs     the Google Apps Script that writes to the Sheet
tools/make_images.py    makes the images for an episode from its PDF
```

---

## Part A · Set up the Google Sheet logger (about 10 minutes)

> **Status: done on 15 November 2026.** The Sheet is named `Found Again · Downloads`, the script project is
> `Found Again logger`, and its web app address is already in `assets/config.js`. The steps below stay here
> in case the logger ever has to be rebuilt.

1. Go to <https://sheets.google.com>, start a **blank spreadsheet**, and name it
   `Found Again · Downloads`.
2. In the Sheet's menu choose **Extensions → Apps Script**. A new tab opens with an editor
   showing a file called `Code.gs` that contains only an empty `myFunction`.
3. Select everything in that editor, delete it, and paste in the whole contents of
   `apps-script/Code.gs` from this folder. Press **⌘S** to save. Optionally click
   "Untitled project" at the top left and name it `Found Again logger`.
4. In the toolbar, open the function dropdown (it says `myFunction` or `doPost`), choose
   **`setup`**, then click **Run**.
   - The first time, Google asks you to review permissions. Choose your account. The script asks
     for access to this one spreadsheet only (that is what `@OnlyCurrentDoc` in the code does). If it says
     *Google hasn't verified this app*, click **Advanced**, then **Go to Found Again logger
     (unsafe)**, then **Allow**. That warning appears for every personal script; it is your own
     code running in your own account.
   - Back in the Sheet you now have two tabs: **Log** and **Summary**.
5. Optional check: choose **`testLog`** in the same dropdown and click **Run**. A test row
   appears in the Log tab. Delete it whenever you like.
6. Click **Deploy** (top right) → **New deployment**. Click the gear next to *Select type*
   and choose **Web app**. Fill in:
   - Description: `Found Again logger`
   - Execute as: **Me**
   - Who has access: **Anyone**  ← this one matters; *Anyone with Google account* will not work
   Click **Deploy** and authorize again if asked.
7. Copy the **Web app URL** (it ends in `/exec`). Paste it into a new browser tab: you should
   see `{"ok":true,"message":"The Found Again logger is running..."}`.
8. Open `assets/config.js` in this folder and paste that URL between the quotes after
   `logUrl:`. Save the file.

Later, if you ever change `Code.gs`, the live copy only updates when you choose
**Deploy → Manage deployments → ✎ (edit) → Version: New version → Deploy**. The URL stays the same.

---

## Part B · Put the site online

### Option 1 · GitHub Pages (free; this is how the site is published)

The site lives at **https://found-again.github.io/**. It is served from the repository
`found-again/found-again.github.io` on GitHub. A free organization named `found-again` owns a
repository named `found-again.github.io`, and GitHub publishes any repository named that way at
the matching address.

To publish a change, run these from inside the `3 · Website` folder:

```bash
git add . && git commit -m "Describe the change"
```
```bash
git push
```

The live site updates a minute or two after the push.

How it was first set up (only needed again if the repository is ever rebuilt):

```bash
git init -b main
```
```bash
git add . && git commit -m "Found Again website"
```
```bash
gh repo create found-again/found-again.github.io --public --source=. --push
```

Things to know:
- Free GitHub plans can only publish Pages from a **public** repository, so the files in this
  folder (page, images, PDFs) are viewable by anyone who finds the repository. The names in the
  guestbook are never in the repository; they live only in your Sheet.
- Each PDF must stay under 100 MB. The two current books are 20 MB and 12 MB.
- The `og:image` and `og:url` lines near the top of `index.html` hold the full site address so that
  a shared link shows a picture in texts and group chats. Change them if the address ever changes.
- To use your own domain later, add it under the repository's Settings → Pages → Custom domain and
  point the domain's DNS at GitHub. The github.io address then forwards to it.

### Option 2 · Netlify Drop (no GitHub, drag and drop)

1. Make a free account at <https://app.netlify.com>.
2. Go to <https://app.netlify.com/drop> and drag the whole `3 · Website` folder onto the page.
3. You get an address like `https://quiet-river-123.netlify.app`. Rename it under
   *Site configuration → Change site name*.
4. To update the site later, drag the folder onto the same site's *Deploys* page again.

### Optional · your own address

A domain such as `foundagain.family` costs around $10–15 a year. Both GitHub Pages and Netlify
let you attach one later without changing anything in this folder.

---

## Part C · Updating the site

**A new version of a book.** Replace the file in `pdfs/` using the same file name
(`found-again-ep1.pdf`, `found-again-ep2.pdf`). If the size changed noticeably, update
`fileSize` in `assets/config.js`. Then publish (Option 1: `git add . && git commit -m "Update Episode 1" && git push`;
Option 2: drag the folder again).

**A new episode.**
1. Copy the finished PDF into `pdfs/` as `found-again-ep3.pdf`.
2. Make its images (cover plus the pages you want to show), from inside this folder:
   ```bash
   python3 tools/make_images.py "/path/to/Episode 3 picture book.pdf" ep3 --pages 4,9,15,20
   ```
   The page numbers are the PDF's own page numbers (page 1 is the cover).
3. In `assets/config.js`, copy one of the blocks inside `episodes: [ ... ]`, paste it after the
   last one, and change the number, title, subtitle, pages, file, fileSize, downloadName, cover,
   blurb, and gallery lines. Remove the episode from `comingNext` if it was listed there.
4. Publish.

**Words on the page.** The intro and "About this project" text is in `index.html`; the episode
blurbs are in `assets/config.js`.

---

## Part D · Reading the guestbook

Open the Sheet. The **Log** tab has one row per event:

| Column | Meaning |
| --- | --- |
| Timestamp | When it happened (the Sheet's time zone: File → Settings) |
| First name, Last name | As typed in the guestbook |
| Action | `sign-in` typed a name · `visit` came back later in a new browser session · `download` pressed Download the PDF · `open` pressed Read in your browser |
| Episode | Which book, for downloads and opens |
| Visitor ID | A random code for that browser, so you can tell two people with the same name apart, or the same person on a phone and a laptop |
| Device | Phone or computer, and the browser |

The **Summary** tab has three live tables: everyone who has signed in (first and last seen),
downloads by episode, and who downloaded which episode how many times. They update themselves.

---

## If something is not working

- **The Web app URL shows a Google sign-in page or "You need access".** The deployment's
  *Who has access* must be **Anyone**. Make a new deployment with that setting.
- **People sign in and download, but no rows appear.** Check that `logUrl` in `assets/config.js`
  is the `/exec` address and that you published the site after pasting it. Open the address in
  a browser to confirm the logger answers. Run `testLog` in the editor to confirm the script can
  write to the Sheet.
- **I changed Code.gs and nothing changed.** Deploy → Manage deployments → ✎ → New version.
- **Rows show "Wrong site key".** `siteKey` in `assets/config.js` and `SITE_KEY` in `Code.gs`
  must be the same text.
- **The download button scrolls up instead of downloading.** That is the guestbook asking for a
  name. After Continue, the download starts on its own.

The guestbook is a courtesy, not a lock: anyone who has the direct address of a PDF can open it
without signing in. For a family site that is the right trade: no passwords to forget.
