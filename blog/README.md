# Markdown blogs

Drop Markdown files into this folder and open them through the reader:

```text
/blog/index.html?post=your-file.md
```

Each post can start with frontmatter:

```yaml
---
title: your title
date: jul 19, 2025
category: systems
readTime: 6 min read
description: a short introduction.
tags: go, backend, systems
---
```

The reader supports headings, paragraphs, emphasis, links, images, lists, blockquotes, horizontal rules, and fenced code blocks.

For local preview, run this from the project root:

```bash
python3 -m http.server 8000
```
