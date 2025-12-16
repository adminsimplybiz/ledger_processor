# Ledger Data Processor Pro

A cutting-edge web application designed to solve the critical data normalization challenge inherent in complex financial ledgers. It transforms messy, hierarchical ledger exports into a standardized, transaction-per-row format ready for immediate financial analysis.

## 🎯 Product Value Proposition

- **Zero Infrastructure Cost**: 100% serverless frontend option, or scalable backend API
- **Maximized Data Privacy**: Financial data can be processed entirely in the browser (client-side mode)
- **Efficiency**: Transforms messy, hierarchical ledger exports into a standardized, transaction-per-row format
- **Modern Tech Stack**: Built with React, TypeScript, FastAPI, and Python

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for modern, responsive UI
- **SheetJS (xlsx)** for client-side Excel processing
- **Create React App** build system

## 📁 Project Structure

```
ledger-processor-pro/
├── src/
│   ├── features/
│   │   └── ledger-processor/
│   │       ├── components/          # UI components
│   │       ├── LedgerProcessor.tsx  # Main feature component
│   │       └── ledgerLogic.ts       # Core transformation logic
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── public/
│   └── index.html
└── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+ (for backend)

### Frontend Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```
   The app will open at `http://localhost:3000`

3. **Build for production**
   ```bash
   npm run build
   ```

## 📖 Usage Guide

### Client-Side Processing (Default)

1. **Upload**: Select your `.xlsx` ledger file via the upload button
2. **Configure**: Verify the default column indices (1 for both Group Name and Cost Centre). Adjust if your ledger uses different columns
3. **Execute**: Click "Run Transformation." The status box will confirm success
4. **Download**: Click "Download Structured Ledger" to receive the output file (`structured_ledger_output.xlsx`)

## 🔧 Core Transformation Logic

The application intelligently handles hierarchical ledger data by performing the following sequence:

1. **File Read**: Skips the first two rows (metadata) and reads the remaining entries
2. **Header Caching (The Shift)**: Iterates sequentially, using non-transactional rows to establish context. It perpetually stores the last non-empty Date and Header Group Name (the memory)
3. **Transaction Filter**: Filters for rows containing "DR" or "CR" in Column D
4. **Amount Normalization**: Converts Credit ("CR") amounts to negative numbers (-1 × Amount) and Debits ("DR") to positive numbers, ensuring a standardized numerical format in the output
5. **Output**: Every filtered transaction is merged with the currently cached header context

## ⚙️ Custom Configuration

The UI allows users to define the indices for two critical columns (zero-based indexing: A=0, B=1, C=2...).

| Output Field | Config Input | Default Index | Role in Transformation |
|-------------|-------------|---------------|----------------------|
| Header Group Name | Config Input 1 | 1 (Column B) | Pulled from the Header Row (cached memory) |
| Cost Centre | Config Input 2 | 1 (Column B) | Pulled from the Detail Row (current transaction row) |

## 🔒 Data Privacy Guarantee

**Client-Side Mode (Default)**: Your data is 100% secure. The Ledger Data Processor Pro processes files entirely in your browser.

- **No Data Transmission**: Uploaded Excel files are read directly into the browser's memory
- **No Server Processing**: The transformation logic executes entirely on the user's local machine
- **No Cloud Storage**: Data is never stored, logged, or sent to any server

**Server-Side Mode (Optional)**: When using the backend API, data is processed on your server. Ensure proper security measures are in place.

## 🚢 Deployment

### Frontend Deployment

#### Vercel / Netlify
1. Import the GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Deployment is automatic with zero configuration

#### GitHub Pages
1. Enable GitHub Pages on the main branch
2. Deploy from the `build` directory after running `npm run build`

### Backend Deployment

#### Traditional Server
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Docker (Coming Soon)
Docker configuration for containerized deployment.

## 🧪 Testing

```bash
# Frontend tests
npm test

# Backend tests (when implemented)
cd backend
pytest
```

## 📝 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines here]

## 📧 Support

[Add support contact information here]

