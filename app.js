"use strict";

const form = document.getElementById("amounts");
const inputs = Array.from(form.querySelectorAll("input"));
const published = window.completionAmounts;
const revision = JSON.stringify(published);
const storageKey = "yemeni-student-campaign-completion";
const centsFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2, maximumFractionDigits: 2
});
const posterCanvas = document.getElementById("poster");
const poster = createCompletionPoster(posterCanvas, (cents) => centsFormat.format(cents / 100));
const validation = document.getElementById("validation");
const download = document.getElementById("download");
const settings = document.getElementById("settings");
const feedback = document.getElementById("feedback");
const status = document.getElementById("completion-status");
const summary = {
  received: document.getElementById("received"),
  pledged: document.getElementById("pledged"),
  combined: document.getElementById("combined"),
  balance: document.getElementById("balance")
};
let state;
let artworkReady = false;

function parseAmount(value, optional) {
  const number = value.trim()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x6f0))
    .replace(/٫/g, ".").replace(/٬/g, ",");
  if (optional && ["", "-", "—"].includes(number)) return null;
  if (!/^(?:\d{1,8}|\d{1,3}(?:,\d{3}){1,2})(?:\.\d{1,2})?$/.test(number)) return NaN;
  const [whole, decimals = ""] = number.replaceAll(",", "").split(".");
  if (Number(whole) > 99_999_999) return NaN;
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}

function fill(values) {
  inputs.forEach((input) => { input.value = values[input.name] ?? ""; });
}

function update() {
  const amounts = {};
  let invalid = false;
  for (const input of inputs) {
    const cents = parseAmount(input.value, input.name === "bank");
    const bad = Number.isNaN(cents) || (input.name === "goal" && cents === 0);
    input.setAttribute("aria-invalid", String(bad));
    invalid ||= bad;
    amounts[input.name] = cents;
  }
  validation.hidden = !invalid;
  settings.disabled = invalid;
  if (invalid) {
    download.disabled = true;
    return false;
  }
  const received = amounts.union + amounts.wechat + amounts.alipay + (amounts.bank ?? 0);
  const combined = received + amounts.pledges;
  const complete = received >= amounts.goal;
  const balance = Math.abs(amounts.goal - received);
  state = { amounts, received, combined, complete, balance };
  const values = { received, pledged: amounts.pledges, combined, balance };
  for (const [key, element] of Object.entries(summary)) {
    element.textContent = centsFormat.format(values[key] / 100);
  }
  document.getElementById("balance-label").textContent = complete ? "الفائض عن الهدف" : "المتبقّي للهدف";
  document.getElementById("progress").value = Math.min(100, received / amounts.goal * 100);
  status.textContent = complete
    ? "بلغ المبلغ المستلم هدف الحملة. إعلان الاكتمال جاهز للتنزيل."
    : "يتاح إعلان الاكتمال عند بلوغ المبلغ المستلم فعليًا هدف الحملة.";
  download.disabled = !artworkReady || !complete;
  if (artworkReady) poster.paint(state);
  return true;
}

function saveDraft() {
  try {
    const values = Object.fromEntries(inputs.map((input) => [input.name, input.value]));
    localStorage.setItem(storageKey, JSON.stringify({ revision, values }));
  } catch {
    feedback.textContent = "تعذّر حفظ التعديلات في هذا المتصفح. يمكنك تنزيل ملف الأرقام.";
  }
}

function downloadFile(blob, name) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

form.addEventListener("submit", (event) => event.preventDefault());
form.addEventListener("input", () => {
  feedback.textContent = "";
  if (update()) saveDraft();
});
document.getElementById("reset").addEventListener("click", () => {
  fill(published);
  update();
  feedback.textContent = "تمت استعادة الأرقام المنشورة.";
  saveDraft();
});
settings.addEventListener("click", () => {
  const values = Object.fromEntries(Object.entries(state.amounts).map(([name, cents]) => [
    name, cents === null ? null : (cents / 100).toFixed(2)
  ]));
  const script = `window.completionAmounts = ${JSON.stringify(values, null, 2)};\n`;
  downloadFile(new Blob([script], { type: "text/javascript;charset=utf-8" }), "campaign.js");
});
download.addEventListener("click", () => {
  try {
    posterCanvas.toBlob((blob) => {
      if (blob) downloadFile(blob, "Yemeni-Student-Campaign-Completed.png");
      else feedback.textContent = "تعذّر تجهيز الصورة. أعد تحميل الصفحة وحاول مرة أخرى.";
    }, "image/png");
  } catch {
    feedback.textContent = "افتح الصفحة من رابط GitHub Pages أو من خادم محلي لتنزيل الصورة.";
  }
});

let initial = published;
try {
  const draft = JSON.parse(localStorage.getItem(storageKey));
  if (draft?.revision === revision && draft.values) initial = draft.values;
} catch {
  // The published values are available with browser storage disabled.
}
fill(initial);
update();
poster.ready.then(() => {
  artworkReady = true;
  update();
}).catch(() => {
  feedback.textContent = "تعذّر تحميل خلفية الإعلان. أعد تحميل الصفحة.";
});
