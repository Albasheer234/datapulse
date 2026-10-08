// DOM Elements
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");

// Toggle mobile menu
hamburger.addEventListener("click", () => {
  mobileMenu.classList.toggle("active");

  // Animate hamburger to X
  const spans = hamburger.querySelectorAll("span");
  if (mobileMenu.classList.contains("active")) {
    spans[0].style.transform = "rotate(45deg) translate(5px, 5px)";
    spans[1].style.opacity = "0";
    spans[2].style.transform = "rotate(-45deg) translate(7px, -6px)";
  } else {
    spans[0].style.transform = "none";
    spans[1].style.opacity = "1";
    spans[2].style.transform = "none";
  }
});

// Close mobile menu when clicking on a link
const mobileLinks = document.querySelectorAll(".mobile-nav-link");
mobileLinks.forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("active");

    // Reset hamburger animation
    const spans = hamburger.querySelectorAll("span");
    spans[0].style.transform = "none";
    spans[1].style.opacity = "1";
    spans[2].style.transform = "none";
  });
});

// Close mobile menu when clicking outside
document.addEventListener("click", (e) => {
  if (
    !hamburger.contains(e.target) &&
    !mobileMenu.contains(e.target) &&
    mobileMenu.classList.contains("active")
  ) {
    mobileMenu.classList.remove("active");

    // Reset hamburger animation
    const spans = hamburger.querySelectorAll("span");
    spans[0].style.transform = "none";
    spans[1].style.opacity = "1";
    spans[2].style.transform = "none";
  }
});
