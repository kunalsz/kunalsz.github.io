(function () {
  const params = new URLSearchParams(window.location.search);
  const requestedPost = params.get("post") || "mock-blog.md";
  const postName = /^[a-zA-Z0-9_-]+\.md$/.test(requestedPost) ? requestedPost : "mock-blog.md";
  const articleTitle = document.getElementById("article-title");
  const articleBody = document.getElementById("article-body");
  const contentsNav = document.getElementById("contents-nav");
  const tags = document.getElementById("article-tags");

  function escapeHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function slugify(value) {
    return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
  }

  function inlineMarkdown(value) {
    let html = escapeHtml(value);
    html = html.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />');
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return html;
  }

  function parseMarkdown(markdown) {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const output = [];
    const headings = [];
    let paragraph = [];
    let list = [];
    let quote = [];
    let code = [];
    let inCode = false;
    let language = "";

    const flushParagraph = () => {
      if (paragraph.length) output.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    };
    const flushList = () => {
      if (list.length) output.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
      list = [];
    };
    const flushQuote = () => {
      if (quote.length) output.push(`<blockquote>${inlineMarkdown(quote.join(" "))}</blockquote>`);
      quote = [];
    };
    const flushText = () => { flushParagraph(); flushList(); flushQuote(); };

    lines.forEach((line) => {
      if (line.startsWith("```")) {
        if (inCode) {
          output.push(`<pre><code class="language-${escapeHtml(language)}">${escapeHtml(code.join("\n"))}</code></pre>`);
          code = [];
          language = "";
          inCode = false;
        } else {
          flushText();
          language = line.slice(3).trim();
          inCode = true;
        }
        return;
      }
      if (inCode) {
        code.push(line);
        return;
      }

      const heading = line.match(/^(#{2,3})\s+(.+)$/);
      if (heading) {
        flushText();
        const level = heading[1].length;
        const text = heading[2].trim();
        const id = slugify(text);
        headings.push({ id, text });
        output.push(`<h${level} id="${id}">${inlineMarkdown(text)}</h${level}>`);
        return;
      }
      if (/^[-*_]{3,}$/.test(line.trim())) {
        flushText();
        output.push("<hr />");
        return;
      }
      if (line.startsWith("> ")) {
        flushParagraph();
        flushList();
        quote.push(line.slice(2));
        return;
      }
      const listItem = line.match(/^[-*]\s+(.+)$/);
      if (listItem) {
        flushParagraph();
        flushQuote();
        list.push(listItem[1]);
        return;
      }
      if (!line.trim()) {
        flushText();
        return;
      }
      paragraph.push(line.trim());
    });

    if (inCode) output.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
    flushText();
    return { html: output.join("\n"), headings };
  }

  function parseFrontmatter(markdown) {
    if (!markdown.startsWith("---\n")) return { meta: {}, body: markdown };
    const end = markdown.indexOf("\n---", 4);
    if (end < 0) return { meta: {}, body: markdown };
    const meta = {};
    markdown.slice(4, end).split("\n").forEach((line) => {
      const separator = line.indexOf(":");
      if (separator > 0) meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    });
    return { meta, body: markdown.slice(end + 4).replace(/^\n+/, "") };
  }

  function setupListenControl() {
    const toggle = document.getElementById("listen-toggle");
    const bar = document.getElementById("listen-bar");
    const progress = document.getElementById("listen-progress");
    const time = document.getElementById("listen-time");
    let seconds = 0;
    let timer;
    toggle.addEventListener("click", () => {
      const playing = bar.classList.toggle("is-playing");
      toggle.setAttribute("aria-label", playing ? "Pause article audio" : "Play article audio");
      clearInterval(timer);
      if (!playing) return;
      timer = setInterval(() => {
        seconds = Math.min(seconds + 1, 522);
        time.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} / 08:42`;
        progress.style.width = `${(seconds / 522) * 100}%`;
        if (seconds === 522) {
          clearInterval(timer);
          bar.classList.remove("is-playing");
        }
      }, 1000);
    });
  }

  function setupContents(headings) {
    contentsNav.innerHTML = headings.map((heading) => `<a href="#${heading.id}">${escapeHtml(heading.text)}</a>`).join("");
    const links = [...contentsNav.querySelectorAll("a")];
    const targets = headings.map((heading) => document.getElementById(heading.id));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) links.forEach((link) => link.classList.toggle("active", link.hash === `#${entry.target.id}`));
      });
    }, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });
    targets.forEach((target) => observer.observe(target));
  }

  fetch(`./${postName}`)
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load ${postName}`);
      return response.text();
    })
    .then((markdown) => {
      const parsed = parseFrontmatter(markdown);
      const rendered = parseMarkdown(parsed.body);
      const meta = parsed.meta;
      document.title = `${meta.title || "Blog"} — Kunal Gurtatta`;
      articleTitle.textContent = meta.title || postName.replace(".md", "");
      document.getElementById("article-category").textContent = meta.category || "notes";
      document.getElementById("article-meta").textContent = `${meta.date || ""} · ${meta.readTime || "read"}`;
      document.getElementById("article-description").textContent = meta.description || "";
      articleBody.innerHTML = rendered.html;
      const firstParagraph = articleBody.querySelector("p");
      if (firstParagraph) firstParagraph.classList.add("lead-paragraph");
      tags.innerHTML = (meta.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean)
        .map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
      setupContents(rendered.headings);
      setupListenControl();
    })
    .catch((error) => {
      articleTitle.textContent = "could not load this note";
      articleBody.innerHTML = `<p>${escapeHtml(error.message)}. Check that the Markdown file exists inside the blog folder.</p>`;
    });
})();
