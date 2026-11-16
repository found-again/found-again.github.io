/**
 * Found Again · guestbook and download logger
 *
 * Lives inside a Google Sheet (Extensions → Apps Script) and is published as a
 * web app. The website posts one small record for every sign-in, visit,
 * download and "read in browser" click, and each one becomes a row in the
 * "Log" tab. The "Summary" tab turns those rows into per-person counts.
 *
 * One-time setup is in README.md, Part A. In short:
 *   1. Paste this file over the default Code.gs and save.
 *   2. Run the function "setup" once (creates the Log and Summary tabs).
 *   3. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone.
 *   4. Paste the Web app URL into the website's assets/config.js as logUrl.
 */

/**
 * @OnlyCurrentDoc
 * Limits this script to the one spreadsheet it is attached to, so Google's permission
 * screen asks for access to this spreadsheet only and not to all of your Sheets.
 */

var SITE_KEY = 'found-again-2026';   // must match siteKey in the website's assets/config.js
var LOG_SHEET = 'Log';
var SUMMARY_SHEET = 'Summary';
var HEADERS = ['Timestamp', 'First name', 'Last name', 'Action', 'Episode', 'Visitor ID', 'Device'];

/** The website sends its records here. */
function doPost(e) {
  try {
    var body = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var data = JSON.parse(body);
    if (SITE_KEY && data.key !== SITE_KEY) return json_({ ok: false, error: 'Wrong site key' });
    record_(data);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Opening the Web app URL in a browser shows this, which is a handy way to check the deployment. */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action) {                       // optional: log from a plain link, e.g. ...exec?action=download&first=A&last=B&episode=Ep%201
    if (SITE_KEY && p.key !== SITE_KEY) return json_({ ok: false, error: 'Wrong site key' });
    record_(p);
    return json_({ ok: true });
  }
  return json_({ ok: true, message: 'The Found Again logger is running. Rows go to the sheet tab "' + LOG_SHEET + '".' });
}

/** Adds one row to the Log tab. */
function record_(d) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getLogSheet_().appendRow([
      new Date(),
      clean_(d.first),
      clean_(d.last),
      clean_(d.action),
      clean_(d.episode),
      clean_(d.visitorId),
      clean_(d.device)
    ]);
  } finally {
    lock.releaseLock();
  }
}

/** Run this once from the editor (Run ▶ with "setup" selected) to create the tabs. Safe to run again. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  formatLogSheet_(getLogSheet_());
  buildSummary_();
  var blank = ss.getSheetByName('Sheet1');          // the empty tab a new spreadsheet starts with
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
  Logger.log('Done. The "Log" and "Summary" tabs are ready.');
}

/** Run this from the editor to add a sample row and prove the sheet is wired up. */
function testLog() {
  record_({ first: 'Test', last: 'Row', action: 'test', episode: 'Ep 0 · Delete me', visitorId: 'test', device: 'Apps Script editor' });
  Logger.log('A test row was added to the "' + LOG_SHEET + '" tab. Delete it whenever you like.');
}

/* ---------- helpers ---------- */

function getLogSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(LOG_SHEET);
  if (!sheet) sheet = ss.insertSheet(LOG_SHEET, 0);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    formatLogSheet_(sheet);
  }
  return sheet;
}

function formatLogSheet_(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#efe4cf');
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  var widths = [160, 130, 130, 100, 240, 130, 160];
  widths.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });
}

function buildSummary_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SUMMARY_SHEET) || ss.insertSheet(SUMMARY_SHEET, 1);
  sheet.clear();

  var log = "'" + LOG_SHEET + "'!A:G";
  var downloads = "(D = 'download' or D = 'open')";

  // Block 1 · everyone who has signed the guestbook
  sheet.getRange('A1').setValue('Everyone who has signed in');
  sheet.getRange('A2').setFormula(
    '=IFERROR(QUERY(' + log + ', "select B, C, min(A), max(A), count(A) where B is not null group by B, C order by max(A) desc ' +
    'label B \'First name\', C \'Last name\', min(A) \'First seen\', max(A) \'Last seen\', count(A) \'Events\'", 1), "No one yet")');

  // Block 2 · downloads per episode
  sheet.getRange('G1').setValue('Downloads by episode');
  sheet.getRange('G2').setFormula(
    '=IFERROR(QUERY(' + log + ', "select E, count(E) where ' + downloads + ' group by E order by E ' +
    'label E \'Episode\', count(E) \'Downloads\'", 1), "No downloads yet")');

  // Block 3 · who downloaded what, and how many times
  sheet.getRange('J1').setValue('Who downloaded what');
  sheet.getRange('J2').setFormula(
    '=IFERROR(QUERY(' + log + ', "select B, C, E, count(E), max(A) where ' + downloads + ' group by B, C, E order by B, C, E ' +
    'label B \'First name\', C \'Last name\', E \'Episode\', count(E) \'Times\', max(A) \'Last time\'", 1), "No downloads yet")');

  sheet.getRange('A1:N1').setFontWeight('bold').setFontSize(12);
  sheet.getRange('A2:N2').setFontWeight('bold').setBackground('#efe4cf');
  sheet.getRange('C3:D1000').setNumberFormat('yyyy-mm-dd hh:mm');
  sheet.getRange('N3:N1000').setNumberFormat('yyyy-mm-dd hh:mm');
  var widths = { 1: 120, 2: 120, 3: 150, 4: 150, 5: 70, 6: 30, 7: 240, 8: 100, 9: 30, 10: 120, 11: 120, 12: 240, 13: 70, 14: 150 };
  Object.keys(widths).forEach(function (col) { sheet.setColumnWidth(Number(col), widths[col]); });
  sheet.setFrozenRows(2);
}

function clean_(v) {
  return v == null ? '' : String(v).slice(0, 200);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
