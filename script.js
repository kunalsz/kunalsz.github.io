
  /* ─── typed effect ─── */
  const roles = [
    "backend.",
    "security.",
    "open source.",
    "web3.",
  ];
  let rIdx = 0, cIdx = 0, deleting = false;
  const el = document.getElementById("typed-text");

  function type() {
    const current = roles[rIdx];
    if (!deleting) {
      el.textContent = current.slice(0, ++cIdx);
      if (cIdx === current.length) {
        deleting = true;
        setTimeout(type, 1800);
        return;
      }
    } else {
      el.textContent = current.slice(0, --cIdx);
      if (cIdx === 0) {
        deleting = false;
        rIdx = (rIdx + 1) % roles.length;
        setTimeout(type, 300);
        return;
      }
    }
    setTimeout(type, deleting ? 40 : 70);
  }
  if (el) setTimeout(type, 600);

  /* ─── scroll reveal ─── */
  const reveals = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
  reveals.forEach((r) => io.observe(r));

  /* ─── nav active link ─── */
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a");

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(a => {
          a.style.color = a.getAttribute("href") === "#" + e.target.id
            ? "var(--heading)"
            : "";
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => sectionObserver.observe(s));
