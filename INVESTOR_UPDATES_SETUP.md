# Investor Updates Setup

## Overview
Private investor update documents have been added to the website for direct email linking without appearing in site navigation.

## File Structure
```
idlewood-capital-website/
├── investor-updates/
│   ├── .htaccess                                # Search engine protection
│   └── monroe-road/
│       ├── equity-recapitalization.html         # Equity recap proposal
│       └── q3-2025-update.html                  # Q3 2025 quarterly update
├── assets/images/
│   ├── monroe-road-before-2021.png              # Property before image
│   └── monroe-road-after-2025.png               # Property after image
└── INVESTOR_UPDATES_SETUP.md                    # This file
```

## Access URLs
Once deployed to your website, these documents will be accessible at:

- **Equity Recapitalization**: `https://yourdomain.com/investor-updates/monroe-road/equity-recapitalization.html`
- **Q3 2025 Update**: `https://yourdomain.com/investor-updates/monroe-road/q3-2025-update.html`

## Key Features

### Security & Privacy
- ✅ **Search Engine Protection**: .htaccess file prevents indexing
- ✅ **No Site Navigation**: Documents are not linked from main website
- ✅ **Direct Access Only**: Accessible only via direct URL links
- 🔧 **Optional Password Protection**: .htaccess includes commented auth setup

### Document Features
- ✅ **Professional Formatting**: Optimized for both screen and print/PDF
- ✅ **Smart Margins**: Conditional bottom margins for optimal space usage
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile
- ✅ **Print Optimization**: Perfect for PDF generation via browser print
- ✅ **Consistent Branding**: Idlewood Capital visual identity

## Email Integration
Use these URLs in your investor emails:

```html
<a href="https://yourdomain.com/investor-updates/monroe-road/q3-2025-update.html">
  View Q3 2025 Monroe Road Update
</a>

<a href="https://yourdomain.com/investor-updates/monroe-road/equity-recapitalization.html">
  Review Equity Recapitalization Proposal
</a>
```

## Next Steps

1. **Deploy to Website**: Commit and push these files to your GitHub repository
2. **Test Access**: Verify URLs work after deployment
3. **Update Email Templates**: Use the live URLs in your investor communications

## Additional Security (Optional)

If you want password protection in the future:
1. Uncomment the auth lines in `.htaccess`
2. Create a `.htpasswd` file with encrypted passwords
3. Update the path in `.htaccess` to point to your `.htpasswd` file

For now, the documents rely on "security through obscurity" - they're only accessible via direct links you share with investors.

## Maintenance

- Documents are standalone HTML files
- Images are stored in shared `/assets/images/` folder
- Updates can be made by replacing the HTML files
- New properties can be added with additional folders under `/investor-updates/`