document.addEventListener("DOMContentLoaded", () => {
    const ease = "power4.inOut";

    document.querySelectorAll("a").forEach((link) => {
 link.addEventListener("click", (event) => {
            event.preventDefault();
            const href = link.getAttribute("href");
