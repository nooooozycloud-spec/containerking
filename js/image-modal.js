(function () {
  const dialog = document.getElementById("image-modal");
  const shell = dialog?.querySelector(".image-modal__shell");
  const dialogImg = dialog?.querySelector(".image-modal__img");
  const viewport = dialog?.querySelector(".image-modal__viewport");
  const closeBtn = dialog?.querySelector(".image-modal__close");
  const stageEl = dialog?.querySelector(".image-modal__stage");
  const captionEl = document.getElementById("image-modal-caption");
  const galleryUi = dialog?.querySelector(".image-modal__gallery-ui");
  const pagerEl = dialog?.querySelector(".image-modal__pager");
  const thumbsEl = dialog?.querySelector(".image-modal__thumbs");
  if (!dialog || !shell || !dialogImg || !closeBtn || !viewport) return;

  /** @type {{ src: string, alt: string, title: string }[] | null} */
  let worksSlides = null;
  let worksIndex = 0;

  let thumbDragActive = false;
  let thumbDragStartX = 0;
  let thumbDragScrollStart = 0;
  let thumbDragDistance = 0;

  const SWIPE_PX = 48;
  let slideActive = false;
  let slidePointerId = null;
  let slideStartX = 0;
  let slideEndX = 0;
  let suppressMainImgClick = false;
  /** viewport が pointer capture すると click が img に届かないことがある（施工事例ギャラリー複数枚時） */
  let slidePointerDownOnMainImg = false;

  function setCaption(text) {
    if (!captionEl) return;
    const t = (text || "").trim();
    if (t) {
      captionEl.textContent = t;
      captionEl.hidden = false;
    } else {
      captionEl.textContent = "";
      captionEl.hidden = true;
    }
  }

  function setWorksGalleryUi(visible) {
    if (!galleryUi) return;
    galleryUi.hidden = !visible;
    if (!visible && thumbsEl) {
      thumbsEl.innerHTML = "";
      thumbDragActive = false;
      thumbsEl.classList.remove("image-modal__thumbs--dragging");
    }
    if (pagerEl) {
      if (!visible) {
        pagerEl.textContent = "";
        pagerEl.hidden = true;
      }
    }
  }

  function setNativeView(on) {
    dialog.classList.toggle("image-modal--native", on);
    if (dialogImg) {
      dialogImg.title = on
        ? "クリックで通常サイズに戻す"
        : "クリックで拡大表示";
    }
    if (!on && stageEl) {
      stageEl.scrollTop = 0;
      stageEl.scrollLeft = 0;
    }
  }

  function scrollActiveThumbIntoView() {
    if (!thumbsEl) return;
    const active = thumbsEl.querySelector(".image-modal__thumb.is-active");
    active?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }

  function goWorkPrev() {
    if (!worksSlides || worksSlides.length < 2) return;
    worksIndex =
      (worksIndex - 1 + worksSlides.length) % worksSlides.length;
    updateWorksView();
  }

  function goWorkNext() {
    if (!worksSlides || worksSlides.length < 2) return;
    worksIndex = (worksIndex + 1) % worksSlides.length;
    updateWorksView();
  }

  function updateWorksView() {
    if (!worksSlides || !worksSlides.length) return;
    setNativeView(false);
    const s = worksSlides[worksIndex];
    dialogImg.src = s.src;
    dialogImg.alt = s.alt || "";
    setCaption(s.title || s.alt || "");
    if (pagerEl && worksSlides.length > 1) {
      pagerEl.textContent = worksIndex + 1 + " / " + worksSlides.length;
      pagerEl.hidden = false;
    } else if (pagerEl) {
      pagerEl.textContent = "";
      pagerEl.hidden = true;
    }
    thumbsEl?.querySelectorAll(".image-modal__thumb").forEach(function (btn, i) {
      btn.classList.toggle("is-active", i === worksIndex);
      btn.setAttribute("aria-selected", i === worksIndex ? "true" : "false");
    });
    scrollActiveThumbIntoView();
  }

  function buildThumbs() {
    if (!thumbsEl || !worksSlides || worksSlides.length < 2) return;
    thumbsEl.innerHTML = "";
    worksSlides.forEach(function (slide, i) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "image-modal__thumb";
      btn.setAttribute("role", "tab");
      btn.setAttribute(
        "aria-label",
        (slide.title || slide.alt || "写真") + "を表示"
      );
      btn.setAttribute(
        "aria-selected",
        i === worksIndex ? "true" : "false"
      );
      const im = document.createElement("img");
      im.src = slide.src;
      im.alt = "";
      im.width = 128;
      im.height = 96;
      im.loading = "lazy";
      im.draggable = false;
      btn.appendChild(im);
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        worksIndex = i;
        updateWorksView();
      });
      thumbsEl.appendChild(btn);
    });
  }

  if (thumbsEl) {
    thumbsEl.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      thumbDragActive = true;
      thumbDragDistance = 0;
      thumbDragStartX = e.clientX;
      thumbDragScrollStart = thumbsEl.scrollLeft;
      thumbsEl.classList.add("image-modal__thumbs--dragging");
      e.preventDefault();
    });

    document.addEventListener("mousemove", function (e) {
      if (!thumbDragActive || !thumbsEl) return;
      const dx = e.clientX - thumbDragStartX;
      thumbsEl.scrollLeft = thumbDragScrollStart - dx;
      thumbDragDistance = Math.abs(dx);
    });

    document.addEventListener("mouseup", function () {
      if (!thumbDragActive) return;
      thumbDragActive = false;
      thumbsEl.classList.remove("image-modal__thumbs--dragging");
    });

    thumbsEl.addEventListener(
      "click",
      function (e) {
        if (thumbDragDistance > 8) {
          e.preventDefault();
          e.stopPropagation();
        }
        thumbDragDistance = 0;
      },
      true
    );
  }

  function openWorksGallery(slides, startIndex) {
    if (!slides || !slides.length) return;
    worksSlides = slides;
    worksIndex = Math.max(0, Math.min(startIndex, slides.length - 1));
    const multi = slides.length > 1;
    dialog.classList.toggle("image-modal--works-multi", multi);
    setWorksGalleryUi(multi);
    if (multi) buildThumbs();
    updateWorksView();
    dialog.showModal();
  }

  function openSimple(src, alt, title) {
    worksSlides = null;
    dialog.classList.remove("image-modal--works-multi");
    setWorksGalleryUi(false);
    setNativeView(false);
    dialogImg.src = src;
    dialogImg.alt = alt || "";
    setCaption((title != null && String(title).trim()) || alt || "");
    dialog.showModal();
  }

  function closeModal() {
    if (slideActive && slidePointerId != null) {
      try {
        viewport.releasePointerCapture(slidePointerId);
      } catch (_) {}
    }
    dialog.close();
    worksSlides = null;
    dialog.classList.remove("image-modal--works-multi");
    slideActive = false;
    slidePointerId = null;
    setWorksGalleryUi(false);
    setNativeView(false);
    setCaption("");
  }

  viewport.addEventListener(
    "pointerdown",
    function (e) {
      if (!worksSlides || worksSlides.length < 2) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (!viewport.contains(e.target)) return;
      slidePointerDownOnMainImg = dialogImg.contains(e.target);
      slideActive = true;
      slidePointerId = e.pointerId;
      slideStartX = e.clientX;
      slideEndX = e.clientX;
      try {
        viewport.setPointerCapture(e.pointerId);
      } catch (_) {}
    },
    true
  );

  viewport.addEventListener(
    "pointermove",
    function (e) {
      if (!slideActive || e.pointerId !== slidePointerId) return;
      slideEndX = e.clientX;
    },
    true
  );

  function endViewportSlide(e) {
    if (!slideActive || e.pointerId !== slidePointerId) return;
    slideActive = false;
    try {
      viewport.releasePointerCapture(slidePointerId);
    } catch (_) {}
    slidePointerId = null;
    const d = slideEndX - slideStartX;
    const onMainImg = slidePointerDownOnMainImg;
    slidePointerDownOnMainImg = false;
    if (Math.abs(d) >= SWIPE_PX) {
      suppressMainImgClick = true;
      if (d > 0) goWorkPrev();
      else goWorkNext();
    } else if (onMainImg) {
      suppressMainImgClick = true;
      setNativeView(!dialog.classList.contains("image-modal--native"));
    }
  }

  viewport.addEventListener("pointerup", endViewportSlide, true);
  viewport.addEventListener("pointercancel", endViewportSlide, true);

  dialog.addEventListener("keydown", function (e) {
    if (!worksSlides || worksSlides.length < 2) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goWorkPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goWorkNext();
    }
  });

  dialogImg.addEventListener("click", function (e) {
    e.stopPropagation();
    if (suppressMainImgClick) {
      suppressMainImgClick = false;
      return;
    }
    setNativeView(!dialog.classList.contains("image-modal--native"));
  });

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
      const grid = card.closest(".card-grid");
      const img = card.querySelector("img");
      if (!img || !img.src || !grid) return;
      const cards = Array.prototype.slice.call(
        grid.querySelectorAll(":scope > .card--photo")
      );
      const slides = cards
        .map(function (c) {
          const im = c.querySelector("img");
          if (!im || !im.src) return null;
          const title =
            c.querySelector(".card__label")?.textContent?.trim() || "";
          return { src: im.src, alt: im.alt || "", title: title };
        })
        .filter(function (s) {
          return s != null;
        });
      const start = slides.findIndex(function (s) {
        return s.src === img.src;
      });
      openWorksGallery(slides, start >= 0 ? start : 0);
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
      img.setAttribute("aria-label", (img.alt || "写真") + "を拡大表示");

      img.addEventListener("click", function () {
        openSimple(img.src, img.alt);
      });

      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          img.click();
        }
      });
    });
})();
