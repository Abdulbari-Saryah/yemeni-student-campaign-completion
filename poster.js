"use strict";

function createCompletionPoster(canvas, formatYuan) {
  const context = canvas.getContext("2d");
  const W = canvas.width / 2;
  const H = canvas.height / 2;
  const image = new Image();
  image.src = "blurred-campaign.png";
  const ready = Promise.all([
    image.decode(),
    document.fonts.load('600 30px "Noto Campaign"', "اكتمل المبلغ").catch(() => [])
  ]);

  function box(x, y, width, height, radius, fill, stroke) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fillStyle = fill;
    context.fill();
    if (stroke) {
      context.strokeStyle = stroke;
      context.lineWidth = 2;
      context.stroke();
    }
  }

  function line(x1, x2, y, color) {
    context.strokeStyle = color;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x1, y);
    context.lineTo(x2, y);
    context.stroke();
  }

  function write(value, x, y, { size = 30, weight = 600, color = "#f9ebcf", align = "right", max = 960, numeric = false } = {}) {
    context.font = `${weight} ${size}px "Noto Campaign", Tahoma, Arial, sans-serif`;
    context.textAlign = align;
    context.direction = numeric ? "ltr" : "rtl";
    context.fillStyle = color;
    context.fillText(value, x, y, max);
  }

  function drawHeader(complete) {
    line(165, 238, 61, "#cda369");
    line(842, 915, 61, "#cda369");
    write("حملة دعم الطالب اليمني في الصين", W / 2, 71, { align: "center", color: "#efd19e" });
    box(64, 108, 952, 405, 22, "#355444", "#c2a06a");
    context.save();
    context.clip();
    const scale = 952 / image.naturalWidth;
    const tall = image.naturalHeight * scale;
    context.drawImage(image, 64, 108 + (405 - tall) * 0.43, 952, tall);
    const fade = context.createLinearGradient(64, 0, 1016, 0);
    fade.addColorStop(0, "#1b382ab8");
    fade.addColorStop(.5, "#1b382a33");
    fade.addColorStop(1, "#1b382ab8");
    context.fillStyle = fade;
    context.fillRect(64, 108, 952, 405);
    const insetHeight = 370;
    const insetWidth = image.naturalWidth * insetHeight / image.naturalHeight;
    context.drawImage(image, (W - insetWidth) / 2, 124, insetWidth, insetHeight);
    context.restore();

    context.save();
    context.translate(W / 2, 313);
    context.rotate(-Math.PI / 30);
    box(-265, -86, 530, 172, 19, "#fff0d3", "#1e4838");
    box(-253, -74, 506, 148, 12, "#fff0d3", "#47705c");
    if (complete) {
      context.strokeStyle = "#326b4e";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(0, -38, 21, 0, Math.PI * 2);
      context.moveTo(-9, -38);
      context.lineTo(-2, -30);
      context.lineTo(9, -45);
      context.stroke();
    }
    write(complete ? "اكتمل المبلغ" : "بانتظار اكتمال المبلغ", 0, complete ? 42 : 16, {
      size: complete ? 63 : 43, weight: 900, align: "center", max: 475, color: "#173b2e"
    });
    context.restore();
    write("جزاكم الله خيرًا", W / 2, 610, { size: 79, weight: 900, align: "center", color: "#ffe1a8" });
  }

  function drawStatement(state) {
    const { amounts, received, combined, balance, complete } = state;
    const ink = "#183b2d";
    const muted = "#4a6355";
    box(64, 650, 952, 717, 23, "#fff9ed", "#d6b982");
    write("بيان التبرعات", 984, 702, { size: 42, weight: 850, color: ink });
    write("باليوان الصيني", 96, 699, { size: 24, align: "left", color: muted });

    box(96, 725, 888, 188, 17, "#214b3a");
    const gold = "#f2d6a4";
    write("المستلم فعليًا", 953, 771, { size: 27, weight: 720, color: gold });
    write(formatYuan(received), 953, 842, { size: 65, weight: 900, numeric: true, max: 482 });
    box(439, 756, 1, 84, 0, "#658471");
    write("هدف الحملة", 411, 771, { size: 25, color: gold });
    write(formatYuan(amounts.goal), 411, 827, { size: 39, weight: 790, numeric: true, max: 284 });
    box(128, 874, 824, 13, 6.5, "#416451");
    const bar = 824 * Math.min(1, received / amounts.goal);
    if (bar > 0) box(952 - bar, 874, bar, 13, Math.min(6.5, bar / 2), "#e7be78");

    write("تفاصيل المبالغ المستلمة", 984, 964, { size: 29, weight: 800, color: ink });
    const channels = [
      ["اتحاد الطلاب", amounts.union],
      ["ويشات", amounts.wechat],
      ["أليباي (الجيفوباو)", amounts.alipay],
      ["التحويل البنكي", amounts.bank]
    ];
    channels.forEach(([name, value], index) => {
      const x = index % 2 === 0 ? 548 : 96;
      const y = 983 + Math.floor(index / 2) * 109;
      const right = x + 414;
      box(x, y, 436, 96, 12, "#f5f5eb", "#dfe5d8");
      write(name, right, y + 34, { size: 25, weight: 650, color: muted });
      write(value === null ? "—" : formatYuan(value), right, y + 77, {
        size: 37, weight: 820, color: ink, numeric: true, max: 393
      });
    });

    const reconciliation = [
      ["التعهدات غير المحصّلة", amounts.pledges, "#f5e8ce", "#e6d3ad"],
      ["الإجمالي مع التعهدات", combined, "#f5e8ce", "#e6d3ad"],
      [complete ? "الفائض عن الهدف" : "المتبقّي للهدف", balance, "#e7efe3", "#d6e2d4"]
    ];
    reconciliation.forEach(([name, value, fill, border], index) => {
      const x = 696 - index * 300;
      box(x, 1215, 288, 119, 13, fill, border);
      write(name, x + 267, 1256, { size: 23, weight: 700, color: muted, max: 248 });
      write(formatYuan(value), x + 267, 1308, {
        size: 35, weight: 840, color: ink, numeric: true, max: 248
      });
    });
  }

  function drawThanks() {
    const copy = [
      ["شكرًا لكل من تبرّع، ولكل من شارك النداء ودلّ عليه،", 1427],
      ["ولكل من ساند الطالب وأهله بدعوة صادقة.", 1474]
    ];
    copy.forEach(([value, y]) => write(value, W / 2, y, { align: "center", size: 34, weight: 710 }));
    line(420, 519, 1518, "#b99663");
    line(561, 660, 1518, "#b99663");
    box(536, 1514, 8, 8, 3, "#e3bc7b");
    const prayer = [
      "اللهم تقبّل منهم، وبارك لهم في أرزاقهم وأهليهم،",
      "واخلف عليهم خيرًا، واجعل ما بذلوه في ميزان حسناتهم.",
      "اللهم فرّج كرب الطالب وأهله، وأجزِ كل من أعانهم خير الجزاء."
    ];
    prayer.forEach((value, i) => write(value, W / 2, 1586 + i * 54, {
      align: "center", size: 32, weight: 610, color: "#f3dbaa"
    }));
  }

  return {
    ready,
    paint(state) {
      context.setTransform(2, 0, 0, 2, 0, 0);
      const background = context.createLinearGradient(0, 0, W, H);
      background.addColorStop(0, "#214435");
      background.addColorStop(1, "#112c22");
      context.fillStyle = background;
      context.fillRect(0, 0, W, H);
      drawHeader(state.complete);
      drawStatement(state);
      drawThanks();
    }
  };
}
