# Shaz's DevOps & Security Journey

A professional portfolio website built with Jekyll and the Chirpy theme, showcasing my journey in DevOps engineering, cybersecurity, and continuous learning.

## 🚀 Live Site

**Production:** [https://shahzebmahmood.github.io](https://shahzebmahmood.github.io)

## 🛠 Tech Stack

- **Static Site Generator:** Jekyll 4.4.1
- **Theme:** Chirpy 7.3.1
- **Styling:** Bootstrap 5 + Custom CSS with CSS Variables
- **Icons:** Font Awesome 6
- **Hosting:** GitHub Pages
- **CI/CD:** GitHub Actions

## ✨ Features

### 🏠 Homepage
- **Interactive Hero Section** with animated buttons and theme integration
- **Tech Stack Cards** showcasing expertise in Cloud, Security, and DevOps tools
- **Interactive Career Timeline** with hover effects and responsive design
- **Latest Insights** section displaying recent blog posts
- **Current Focus** highlighting professional and learning activities

### 🎨 Design
- **Full Theme Integration** - All custom components match Chirpy's light/dark modes
- **Responsive Design** - Mobile-first approach with Bootstrap grid
- **Smooth Animations** - CSS keyframe animations and JavaScript interactions
- **Professional Typography** - Lato font family for headings

### 📱 Social Integration
- **GitHub** - Code repositories and contributions
- **LinkedIn** - Professional networking
- **Email** - Direct contact
- **HackTheBox** - Cybersecurity challenges and achievements
- **RSS Feed** - Blog subscription

### 📝 Content Management
- **Blog Posts** with categories: DevOps, Security, Cloud, CTF, HackTheBox
- **Tags System** for content organization
- **Archives** with chronological post listing
- **SEO Optimized** with proper meta tags and structured data

## 🏗 Local Development

### Prerequisites
- **Ruby 3.4.5+** (via Homebrew recommended)
- **Bundler 2.7.1+**
- **Node.js** (for build tools)

### Setup
```bash
# Clone the repository
git clone https://github.com/ShahzebMahmood/shahzebmahmood.github.io.git
cd shahzebmahmood.github.io

# Install dependencies
bundle install

# Serve locally
bundle exec jekyll serve --host 0.0.0.0 --port 4001
```

Visit: `http://localhost:4001`

### Development Commands
```bash
# Clean build
bundle exec jekyll clean && bundle exec jekyll serve --host 0.0.0.0 --port 4001

# Build for production
bundle exec jekyll build

# HTML validation (development)
bundle exec htmlproofer _site --disable-external --allow-hash-href --no-enforce-https

# Update dependencies
bundle update
```

## 📁 Project Structure

```
├── _config.yml              # Jekyll configuration
├── _data/
│   ├── contact.yml          # Social media links
│   └── share.yml            # Sharing options
├── _includes/
│   ├── custom-footer.html   # Custom footer components
│   └── custom-head.html     # Custom head elements
├── _layouts/
│   └── custom-home.html     # Custom homepage layout
├── _posts/                  # Blog posts (Markdown)
│   ├── 2025-01-01-welcome-to-my-portfolio.md
│   ├── 2025-01-02-devops-security-best-practices.md
│   └── ...
├── _tabs/                   # Navigation pages
│   ├── about.md
│   ├── archives.md
│   ├── categories.md
│   └── tags.md
├── assets/
│   ├── css/
│   │   └── loading-animations.css
│   ├── docs/
│   │   └── Shahzeb_Mahmood_Resume.pdf
│   ├── img/
│   │   ├── avatar.png
│   │   └── favicons/
│   └── js/
│       └── loading-animations.js
├── index.html               # Custom homepage with timeline
└── README.md               # This file
```

## 🎯 Key Customizations

### Interactive Timeline
- **Custom Layout** - `_layouts/custom-home.html` for homepage
- **CSS Animations** - Scroll-triggered animations with Intersection Observer
- **Responsive Design** - Mobile-optimized timeline layout
- **Theme Integration** - Uses CSS variables for consistent colors

### Resume Download
- **Animated Button** - Loading spinner during download
- **PDF Integration** - Direct download from `/assets/docs/`
- **Analytics Ready** - Trackable download events

### Social Media Integration
- **Custom Contact Config** - HackTheBox integration via `_data/contact.yml`
- **Icon Customization** - Font Awesome icons for all platforms
- **Proper Link Handling** - External links with security attributes

## 🚀 Deployment

### GitHub Pages (Automatic)
Pushes to `main` branch automatically deploy via GitHub Actions.

### Manual Deployment Commands
```bash
# Build and test
bundle exec jekyll build
bundle exec htmlproofer _site --disable-external --allow-hash-href --no-enforce-https

# Commit and push
git add .
git commit -m "Update site content"
git push origin main
```

## 📊 Content Categories

- **General** - Welcome posts and introductions
- **DevOps** - CI/CD, Infrastructure as Code, automation
- **Security** - Best practices, vulnerability management
- **Cloud** - AWS, Azure, GCP, multi-cloud strategies
- **CTF** - Capture The Flag writeups and methodologies
- **HackTheBox** - Platform challenges and learning paths

## 🔧 Configuration

### Site Settings (`_config.yml`)
```yaml
title: "Shaz's DevOps & Security Journey"
tagline: "Building Secure Infrastructure Through Continuous Learning"
url: "https://shahzebmahmood.github.io"
timezone: America/Toronto
```

### Social Links (`_data/contact.yml`)
- GitHub: https://github.com/ShahzebMahmood
- LinkedIn: https://www.linkedin.com/in/shahzeb-m-70b694166/
- Email: shahzebmahmood3@gmail.com
- HackTheBox: https://app.hackthebox.com/profile/1949647

## 📈 Performance

- **Fast Loading** - Optimized CSS and JavaScript
- **Responsive Images** - Properly sized avatars and icons
- **Clean HTML** - Passes HTML5 validation
- **SEO Optimized** - Structured data and meta tags
- **Mobile First** - Responsive design patterns

## 🔒 Security

- **HTTPS Enforced** - All external links use HTTPS
- **CSP Headers** - Content Security Policy via GitHub Pages
- **No Inline Scripts** - External JavaScript files only
- **Secure Links** - `rel="noopener noreferrer"` for external links

## 📝 Content Writing

### Adding New Posts
1. Create file in `_posts/` with format: `YYYY-MM-DD-title.md`
2. Add front matter:
```yaml
---
title: "Your Post Title"
date: 2025-01-01 12:00:00 -0500
categories: [devops, security]
tags: [automation, kubernetes, security]
---
```

### Adding New Categories
Update navigation in `_tabs/categories.md` and ensure posts use the category name.

## 🤝 Contributing

This is a personal portfolio, but suggestions and improvements are welcome via issues or pull requests.

## 📄 License

This project is open source and available under the [MIT License](https://choosealicense.com/licenses/mit/).

## 👤 Author

**Shahzeb Mahmood**
- **Role:** DevOps Engineer at Seqera Labs
- **Education:** MSc Computer Science with Cybersecurity (University of York)
- **GitHub:** [@ShahzebMahmood](https://github.com/ShahzebMahmood)
- **LinkedIn:** [Shahzeb Mahmood](https://www.linkedin.com/in/shahzeb-m-70b694166/)

---

Built with ❤️ using Jekyll and the Chirpy theme. Hosted on GitHub Pages.