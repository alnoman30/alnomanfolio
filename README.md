# Abdullah Al Noman | Frontend Developer Portfolio

[![Live site](https://img.shields.io/badge/live-alnoman.vercel.app-black?style=flat-square)](https://alnoman.vercel.app/)
[![License: MIT](https://img.shields.io/badge/code-MIT-blue?style=flat-square)](LICENSE)
[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)

The personal portfolio of Abdullah Al Noman, a freelance frontend developer building fast, responsive, accessible websites and web apps with React.js, Tailwind CSS and Laravel.

**Live site:** [https://alnoman.vercel.app/](https://alnoman.vercel.app/)

![Portfolio preview](https://res.cloudinary.com/dxcqb5aj5/image/upload/v1792931546/abdullah-al-noman_c04epk.png)

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Projects showcased](#projects-showcased)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [SEO and performance](#seo-and-performance)
- [Accessibility](#accessibility)
- [Deployment](#deployment)
- [License](#license)
- [Contact](#contact)

---

## Features

- Single-page layout with Home, About, Skills, Education & Experience, Projects, FAQ and Contact sections
- Project cards with a full-page screenshot that scrolls on hover and a custom "View Work" cursor badge
- "Load More" button for revealing additional projects
- Smooth scroll and entrance animations powered by GSAP
- Sliders powered by Splide
- Separate `contact.html` page
- Fully responsive, mobile-first design
- Respects the `prefers-reduced-motion` setting

## Tech stack

| Area | Tools |
| --- | --- |
| Markup | HTML5 (semantic) |
| Styling | Tailwind CSS, custom CSS |
| Scripting | JavaScript (ES6+) |
| Animation | GSAP |
| Sliders | Splide |
| Images | WebP, AVIF, SVG, Cloudinary (social preview image) |
| Hosting | Vercel |

## Projects showcased

| Project | Stack | Links |
| --- | --- | --- |
| Ultras, e-commerce website | Laravel, PHP | [Source code](https://github.com/alnoman30/Ultras-Ecommerce-Fullstack-Laravel) |
| Clickverse, blog website | Laravel, PHP | [Source code](https://github.com/alnoman30/clickverse-fullstack-laravel) |
| Panto, furniture store website | React.js | [Live demo](https://alnoman-panto-design.vercel.app/) |
| Canvix, agency website | React.js | [Live demo](https://alnoman-canvix-agency.vercel.app/) |
| Task Assistant, task manager app | React.js | [Live demo](https://alnoman-task-assistant.vercel.app/) |

More repositories are on [GitHub](https://github.com/alnoman30?tab=repositories).

## Project structure

```text
.
├── index.html          # Home page (all main sections)
├── contact.html        # Contact page
├── sitemap.xml         # Sitemap for search engines
├── robots.txt          # Crawler rules and sitemap location
├── LICENSE
└── assets/
    ├── css/            # style.css, splide.min.css
    ├── js/             # GSAP, Splide and site scripts
    └── images/
        ├── favicon/    # Favicons and app icons
        ├── projects/   # Project screenshots
        └── skills/     # Skill and technology icons
```

## Getting started

This is a static site, so there is nothing to install to view it.

**1. Clone the repository**

```bash
git clone https://github.com/alnoman30/Al-Noman-Portfolio.git
cd Al-Noman-Portfolio
```

**2. Run it locally**

Open `index.html` in your browser, or serve the folder so root-relative paths such as `/assets/...` resolve correctly:

```bash
# Option A: Node
npx serve .

# Option B: Python
python -m http.server 8000
```

Then visit the address shown in the terminal (for example `http://localhost:3000` or `http://localhost:8000`).

You can also use the VS Code **Live Server** extension.

## SEO and performance

- Unique `<title>`, meta description and canonical URL on each page
- Open Graph tags for rich link previews on Facebook, LinkedIn, Instagram DMs and WhatsApp
- JSON-LD structured data (`WebSite`, `Person`, `ItemList`, `SoftwareApplication` and `SoftwareSourceCode`) describing the site, the author and the projects
- `sitemap.xml` and `robots.txt` included
- Descriptive `alt` text on all meaningful images
- `width` and `height` on images to avoid layout shift
- Lazy-loaded images with `loading="lazy"` and `decoding="async"`
- Modern image formats (WebP and AVIF) where possible

## Accessibility

- Semantic HTML with a logical heading order
- `aria-labelledby` on project cards, so each link has a clear accessible name
- Screen-reader-only text that announces links opening in a new tab
- Decorative elements hidden from assistive technology with `aria-hidden`
- Motion reduced for users who prefer it

## Deployment

The site is deployed on [Vercel](https://vercel.com/). Every push to `main` triggers a new deployment.

To deploy your own copy:

1. Fork or clone this repository
2. Import it into Vercel
3. Use the default static settings, with no build command needed
4. Update the URLs in `index.html`, `contact.html`, `sitemap.xml` and `robots.txt` to your own domain

## License

The source code is licensed under the [MIT License](LICENSE).

The personal photos, project screenshots and written content are © 2026 Abdullah Al Noman, all rights reserved, and are not covered by the MIT License. Please don't reuse them without permission.

## Contact

**Abdullah Al Noman**, freelance frontend developer, available worldwide.

- Email: [alnomaan30@gmail.com](mailto:alnomaan30@gmail.com)
- Portfolio: [alnoman.vercel.app](https://alnoman.vercel.app/)
- LinkedIn: [abdullah-al-noman30](https://www.linkedin.com/in/abdullah-al-noman30/)
- GitHub: [alnoman30](https://github.com/alnoman30)
- Facebook: [alnoman30](https://www.facebook.com/alnoman30/)
- Instagram: [noman.hehe](https://www.instagram.com/noman.hehe/)
