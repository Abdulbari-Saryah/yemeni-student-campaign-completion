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
    const muted = "#52685b";
    box(64, 650, 952, 581, 23, "#fff9ed", "#d6b982");
    write("بيان التبرعات", 978, 706, { size: 43, weight: 850, color: ink });
    write("باليوان الصيني", 102, 704, { size: 25, align: "left", color: muted });
    write("المستلم فعليًا", 978, 755, { size: 24, color: muted });
    write(formatYuan(received), 978, 813, { size: 60, weight: 900, color: ink, numeric: true, max: 480 });
    write("هدف الحملة", 102, 755, { size: 24, align: "left", color: muted });
    write(formatYuan(amounts.goal), 102, 805, { size: 40, weight: 760, align: "left", color: ink, numeric: true, max: 330 });
    box(102, 834, 876, 16, 8, "#dfe7da");
    const bar = 876 * Math.min(1, received / amounts.goal);
    if (bar > 0) box(978 - bar, 834, bar, 16, Math.min(8, bar / 2), "#247654");

    const entries = [
      ["اتحاد الطلاب", amounts.union],
      ["ويشات", amounts.wechat],
      ["أليباي (الجيفوباو)", amounts.alipay],
      ["التحويل البنكي", amounts.bank],
      ["التعهدات غير المحصّلة", amounts.pledges],
      ["الإجمالي مع التعهدات", combined],
      [complete ? "الفائض عن الهدف" : "المتبقّي للهدف", balance]
    ];
    entries.forEach(([name, value], i) => {
      const y = 895 + i * 48;
      if (i > 0) line(102, 978, y - 33, "#e1dbca");
      write(name, 975, y, { size: 27, weight: i >= 5 ? 750 : 610, color: ink });
      write(value === null ? "—" : formatYuan(value), 105, y, {
        size: 28, weight: i >= 5 ? 800 : 680, color: ink, align: "left", numeric: true
      });
    });
  }

  function drawThanks() {
    const copy = [
      ["شكرًا لكل من تبرّع، ولكل من شارك النداء ودلّ عليه،", 1291],
      ["ولكل من ساند الطالب وأهله بدعوة صادقة.", 1338]
    ];
    copy.forEach(([value, y]) => write(value, W / 2, y, { align: "center", size: 34, weight: 710 }));
    line(420, 519, 1382, "#b99663");
    line(561, 660, 1382, "#b99663");
    box(536, 1378, 8, 8, 3, "#e3bc7b");
    const prayer = [
      "اللهم تقبّل منهم، وبارك لهم في أرزاقهم وأهليهم،",
      "واخلف عليهم خيرًا، واجعل ما بذلوه في ميزان حسناتهم.",
      "اللهم فرّج كرب الطالب وأهله، وأجزِ كل من أعانهم خير الجزاء."
    ];
    prayer.forEach((value, i) => write(value, W / 2, 1450 + i * 54, {
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
