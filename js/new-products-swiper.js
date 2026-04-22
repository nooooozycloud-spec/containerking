(function () {
  var root = document.querySelector(".new-products-swiper");
  if (!root || typeof Swiper === "undefined") return;

  new Swiper(root, {
    loop: true,
    centeredSlides: true,
    slidesPerView: "auto",
    spaceBetween: 16,
    speed: 450,
    watchSlidesProgress: true,
    pagination: {
      el: root.querySelector(".swiper-pagination"),
      clickable: true,
    },
  });
})();
