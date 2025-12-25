# 🎯 Data Matcher - AI Automation Hub

A powerful React-based data matching tool with fuzzy matching algorithms for Excel files.

## ✨ Features

### Core Functionality
- **Master File Upload**: Upload your primary dataset for matching
- **Multiple Source Files**: Support for up to 5 source files simultaneously
- **Flexible Field Mapping**: Select which fields to match and map from each source
- **Hybrid Fuzzy Matching**: Token Set + Token Sort + Partial matching algorithms

### Advanced Features
- **Confidence Scoring**: Auto-categorize matches as Auto (≥80%), Review (60-79%), or No Match (<60%)
- **Interactive Confirmation**: Manually confirm or reject matches with visual feedback
- **Alternative Matches**: View and select from top 3 match candidates
- **Smart Filtering**: Filter by status (Auto, Review, No Match, Confirmed)
- **Skip Confirmed**: Re-run matching while preserving confirmed matches
- **Merge with Previous Master**: Incrementally update existing master files

### Export Options
1. **Mapping Results**: Detailed match report with confidence scores
2. **Updated Master**: Master file with appended source data
3. **Merged Master**: Combine with previous master for incremental updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/ai-automation-hub.git
cd ai-automation-hub/data-matcher-react
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

4. **Open browser**
Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 📦 Deployment to GitHub Pages

### Option 1: Automatic Deployment (Recommended)

This project includes GitHub Actions for automatic deployment:

1. **Enable GitHub Pages** in repository settings:
   - Go to Settings > Pages
   - Source: GitHub Actions

2. **Push to main branch**:
```bash
git add .
git commit -m "Deploy data matcher"
git push origin main
```

3. **Access your app**:
Your app will be live at: `https://YOUR_USERNAME.github.io/ai-automation-hub/`

### Option 2: Manual Deployment

```bash
npm run build
# Then manually upload the dist/ folder to your hosting provider
```

## 📖 How to Use

### Step 1: Upload Master File
- Click "Master File" section
- Upload your Excel file (.xlsx or .xls)
- Select the key field for matching (e.g., "Company Name")

### Step 2: Configure Source Files
- Click "Add Source" to add source files (up to 5)
- Upload each source Excel file
- Select the key field in each source
- Check the fields you want to map to the master

### Step 3: Run Matching
- Click "Start Matching"
- Wait for processing to complete
- Review the statistics and results

### Step 4: Review & Confirm
- Filter by status to focus on specific match types
- Click the confirm button (circle icon) to approve matches
- Click alternative matches to select different options
- Use "Skip confirmed" when re-running to preserve approved matches

### Step 5: Export Results
- **Export Mapping**: Get detailed match results with confidence scores
- **Export Master**: Get master file with appended source data
- **Merge Masters**: Combine with previous master file for incremental updates

## 🔧 Configuration

### Matching Thresholds
Edit `src/App.jsx` to adjust confidence thresholds:
```javascript
status: top3[0].score >= 80 ? 'auto' : 
        top3[0].score >= 60 ? 'review' : 
        'nomatch'
```

### Base URL for GitHub Pages
Edit `vite.config.js`:
```javascript
base: '/ai-automation-hub/' // Change to your repo name
```

## 📊 Technical Details

### Matching Algorithm
The tool uses a hybrid fuzzy matching approach:
1. Tokenize both strings (split by whitespace)
2. Calculate token set intersection/union
3. Score based on Jaccard similarity: `(intersection / union) * 100`

### Technology Stack
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **XLSX.js**: Excel file processing
- **Lucide React**: Icons

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

MIT License - Free to use and modify

## 🐛 Troubleshooting

### Build fails
- Ensure Node.js 18+ is installed
- Delete `node_modules` and run `npm install` again
- Check that all files are in correct locations

### GitHub Pages shows 404
- Verify `base` in `vite.config.js` matches your repo name
- Check that GitHub Actions workflow completed successfully
- Ensure GitHub Pages is enabled in repository settings

### Matching is slow
- For large datasets (10k+ rows), matching may take time
- The tool processes in batches to prevent UI freezing
- Consider filtering your data before matching

## 💡 Tips

- Start with smaller datasets to test your field mappings
- Use the "Review" filter to focus on uncertain matches
- Confirm high-confidence matches in batches
- Export frequently to save your work
- Use "Merge Masters" for regular data updates

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the documentation above

---

**Built with ❤️ for data professionals**
