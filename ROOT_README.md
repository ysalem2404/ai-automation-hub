# 🤖 AI & Automation Hub

A collection of AI-powered automation tools for data processing and analysis.

## 🛠️ Tools

### Data Matcher (React Version - Full Featured) ⭐
**Location**: `/data-matcher-react`

Match and merge Excel data from multiple sources using hybrid fuzzy matching algorithms.

**Features:**
- ✅ Upload master file + up to 5 source files
- ✅ Flexible field mapping with multi-select
- ✅ Hybrid fuzzy matching (Token Set + Token Sort)
- ✅ Interactive confirmation with visual feedback
- ✅ Alternative match selection (top 3 candidates)
- ✅ Smart filtering by status (Auto/Review/No Match/Confirmed)
- ✅ Export mapping results and updated master files
- ✅ Merge with previous master for incremental updates
- ✅ Skip confirmed matches when re-running
- ✅ Real-time statistics dashboard

**[📖 Full Documentation](./data-matcher-react/README.md)**

**[🚀 Deployment Guide](./data-matcher-react/DEPLOYMENT.md)**

### Data Matcher (HTML Version - Simplified)
**Location**: `/data-matcher.html`

Lightweight standalone version with basic matching functionality.

**[Launch Tool](https://ysalem2404.github.io/ai-automation-hub/data-matcher.html)**

## 🚀 Quick Start

### For the React Version (Recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ai-automation-hub.git

# Navigate to the React app
cd ai-automation-hub/data-matcher-react

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### For the HTML Version

Simply open `data-matcher.html` in your browser - no installation needed!

## 📦 What's Included

```
ai-automation-hub/
├── data-matcher-react/          # Full-featured React version
│   ├── src/
│   │   ├── App.jsx              # Main application component
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Tailwind styles
│   ├── .github/workflows/       # GitHub Actions for deployment
│   ├── package.json             # Dependencies
│   ├── vite.config.js           # Build configuration
│   ├── README.md                # Detailed documentation
│   └── DEPLOYMENT.md            # Deployment instructions
├── data-matcher.html            # Standalone HTML version
├── index.html                   # Repository homepage
└── README.md                    # This file
```

## 🎯 Feature Comparison

| Feature | React Version | HTML Version |
|---------|--------------|--------------|
| Multiple Sources (up to 5) | ✅ | ❌ |
| Confirm Buttons | ✅ | ❌ |
| Alternative Matches | ✅ | ❌ |
| Status Filtering | ✅ | ❌ |
| Merge with Previous Master | ✅ | ❌ |
| Skip Confirmed Matches | ✅ | ❌ |
| Installation Required | npm install | None |
| Best For | Production use, teams | Quick tasks, demos |

## 💡 Usage

All tools run **100% in your browser** - no data is sent to any server. Your privacy is protected!

### React Version Workflow

1. **Upload Files**: Master file + source files
2. **Configure**: Select key fields and fields to map
3. **Match**: Run the fuzzy matching algorithm
4. **Review**: Filter and confirm matches
5. **Export**: Get your results in Excel format

### Common Use Cases

- **Data Enrichment**: Add information from multiple sources to a master database
- **Deduplication**: Find and merge duplicate records across systems
- **Data Migration**: Map fields between old and new systems
- **Regular Updates**: Incrementally update master files with new data
- **Data Validation**: Cross-reference data across multiple sources

## 🔧 Development

### Technology Stack

- **React 18**: Modern UI framework
- **Vite**: Lightning-fast build tool
- **Tailwind CSS**: Utility-first styling
- **XLSX.js**: Excel file processing
- **Lucide React**: Beautiful icons

### Local Development

```bash
cd data-matcher-react
npm install
npm run dev
```

Visit `http://localhost:5173` to see your changes live!

## 📝 Documentation

- **[Data Matcher README](./data-matcher-react/README.md)**: Complete feature documentation
- **[Deployment Guide](./data-matcher-react/DEPLOYMENT.md)**: Step-by-step deployment instructions
- **[Contributing Guidelines](./CONTRIBUTING.md)**: How to contribute (coming soon)

## 🚀 Deployment

### GitHub Pages (Automated)

1. Enable GitHub Pages with Source: **GitHub Actions**
2. Push to `main` branch
3. Wait 2-5 minutes for deployment
4. Access at `https://YOUR_USERNAME.github.io/ai-automation-hub/`

See **[DEPLOYMENT.md](./data-matcher-react/DEPLOYMENT.md)** for detailed instructions.

### Alternative Platforms

- **Vercel**: `npm install -g vercel && vercel`
- **Netlify**: `npm install -g netlify-cli && netlify deploy`
- **Your Server**: Upload `dist/` folder after `npm run build`

## 🤝 Contributing

Contributions are welcome! Areas for contribution:

- Additional matching algorithms
- New automation tools
- UI/UX improvements
- Documentation enhancements
- Bug fixes

### How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## 📋 Roadmap

- [ ] Add advanced matching algorithms (Levenshtein, Soundex)
- [ ] Support for CSV files
- [ ] Batch processing for very large datasets
- [ ] Machine learning-based matching suggestions
- [ ] Collaborative matching (team review)
- [ ] API endpoints for programmatic access
- [ ] Additional automation tools

## 📄 License

MIT License - Free to use and modify for personal and commercial projects.

## 🐛 Known Issues

- Very large files (50k+ rows) may cause performance issues
- Browser memory limits apply for file processing
- Some older browsers may not support all features

## 💬 Support

- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact repository owner

## 🌟 Star This Repo!

If you find this useful, please give it a star ⭐ - it helps others discover the project!

---

**Built with ❤️ for data professionals**

Last Updated: December 2024
