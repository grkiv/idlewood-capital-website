# Idlewood Capital - Asset Organization

This directory contains all website assets organized by type and purpose following web development best practices.

## Directory Structure

```
assets/
├── images/
│   ├── logo.svg              # Main logo (SVG format)
│   ├── logo.png              # Logo fallback (PNG format)
│   ├── hero/                 # Hero section backgrounds
│   ├── portfolio/            # Property images
│   │   └── derita-plaza.jpg  # Derita Plaza aerial photo
│   └── team/                 # Team member photos
│       └── george-headshot.jpg # George R. Kornegay III headshot
└── README.md                 # This documentation file
```

## Usage Guidelines

### Adding New Images

**Portfolio Images:**
- Save property photos in `images/portfolio/`
- Use descriptive filenames: `property-name.jpg`
- Recommended size: 800x600px minimum
- Format: JPG for photos, PNG for graphics

**Team Photos:**
- Save headshots in `images/team/`
- Use format: `firstname-lastname.jpg`
- Recommended size: 400x400px minimum
- Square crop preferred for circular display

**Hero Images:**
- Save background images in `images/hero/`
- Use high resolution: 1920x1080px minimum
- Format: JPG for photos

### File Naming Conventions

- Use lowercase letters
- Use hyphens (-) instead of spaces
- Be descriptive but concise
- Include property/person name
- Examples:
  - `derita-plaza.jpg`
  - `george-kornegay.jpg`
  - `monroe-road-exterior.jpg`

### Optimization

- Compress images before uploading
- Target file sizes:
  - Portfolio images: < 500KB
  - Team photos: < 200KB
  - Hero images: < 1MB
- Use appropriate formats:
  - JPG for photographs
  - PNG for graphics with transparency
  - SVG for logos and icons

## HTML Implementation

When adding new images, use the proper paths:

```html
<!-- Portfolio images -->
<div style="background-image: url('assets/images/portfolio/property-name.jpg');">

<!-- Team photos -->
<img src="assets/images/team/member-name.jpg" alt="Member Name">

<!-- Hero backgrounds -->
<div style="background-image: url('assets/images/hero/background-name.jpg');">
```

## Maintenance

- Regularly review and optimize image sizes
- Remove unused images
- Update file paths if moving files
- Backup assets directory regularly

This organization makes the website:
- ✅ Easier to maintain
- ✅ More professional
- ✅ Scalable for future content
- ✅ Faster to load (organized structure)
- ✅ SEO-friendly (proper file naming)