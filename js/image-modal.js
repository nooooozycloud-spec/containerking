(function () {
  const dialog = document.getElementById("image-modal");
  const shell = dialog?.querySelector(".image-modal__shell");
  const dialogImg = dialog?.querySelector(".image-modal__img");
  const closeBtn = dialog?.querySelector(".image-modal__close");
  if (!dialog || !shell || !dialogImg || !closeBtn) return;

  function openModal(src, alt) {
    dialogImg.src = src;
    dialogImg.alt = alt || "";
    dialog.showModal();
  }

  function closeModal() {
    dialog.close();
  }

  closeBtn.addEventListener("click", closeModal);

  shell.addEventListener("click", function (e) {
    if (e.target === shell) closeModal();
  });

  document.querySelectorAll(".section--works .card--photo").forEach(function (card) {
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    const label = card.querySelector(".card__label")?.textContent?.trim() || "";
    card.setAttribute(
      "aria-label",
      label ? label + "の写真を拡大表示" : "写真を拡大表示"
    );

    card.addEventListener("click", function () {
      const img = card.querySelector("img");
      if (img) openModal(img.src, img.alt);
    });

    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.click();
      }
    });
  });

  document
    .querySelectorAll(".price-block__media img, .hero__bg img")
    .forEach(function (img) {
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      img.setAttribute(
        "aria-label",
        (img.alt || "写真") + "を拡大表示"
      );

      img.addEventListener("click", function () {
        openModal(img.src, img.alt);
      });

      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          img.click();
        }
      });
    });
})();
