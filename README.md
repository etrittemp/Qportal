# EUDA Questionnaire Portal

A complete questionnaire and admin dashboard system for the EUDA Roadmap to Participation project.

## Features

### Questionnaire (`euda-questionnaire.html`)
- Comprehensive multi-section questionnaire
- Client-side data storage using localStorage
- Clean, responsive design
- Form validation
- Success feedback

### Admin Dashboard
- View all submitted responses
- Filter by country, status, or search term
- Download individual responses as JSON
- Download all responses as JSON or CSV
- Delete individual or all responses
- Expandable sections for easy navigation
- Real-time statistics

## Project Structure

```
Qportal/
├── src/
│   ├── AdminDashboard.tsx    # Main dashboard component
│   ├── App.tsx                # React app entry
│   ├── main.tsx              # React DOM entry
│   └── index.css             # Tailwind CSS
├── euda-questionnaire.html   # Standalone questionnaire form
├── index.html                # Dashboard HTML entry
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── README.md                 # This file
```

## Getting Started

### Installation

```bash
npm install
```

### Development

To run the dashboard in development mode:

```bash
npm run dev
```

This will start the Vite development server. You can access:
- **Dashboard**: http://localhost:5173
- **Questionnaire**: http://localhost:5173/euda-questionnaire.html

### Building for Production

```bash
npm run build
```

The build output will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## Deployment

### Option 1: Static Hosting (Netlify, Vercel, GitHub Pages)

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to your hosting service:
   - **Netlify**: Drag and drop the `dist` folder or connect your Git repository
   - **Vercel**: Run `vercel` in the project directory
   - **GitHub Pages**: Push the `dist` folder to a `gh-pages` branch

### Option 2: Manual Deployment

1. Build the project
2. Upload the contents of the `dist/` folder to your web server
3. Ensure both `index.html` (dashboard) and `euda-questionnaire.html` (form) are accessible

### Important Notes

- Both files (questionnaire and dashboard) use **localStorage** for data storage
- This means:
  - Data is stored locally in the user's browser
  - The questionnaire and dashboard must be **accessed from the same domain** for data to sync
  - Data persists across browser sessions but is specific to each browser/device
  - No backend server is required

## Usage

### For Respondents

1. Open `euda-questionnaire.html`
2. Fill out the questionnaire
3. Click "Submit Questionnaire"
4. Data is automatically saved to localStorage

### For Administrators

1. Open the dashboard (main `index.html`)
2. View all submitted responses
3. Filter and search responses
4. Download data as JSON or CSV
5. Manage individual responses

## Data Format

Responses are stored in localStorage with the key `eudaResponses` in the following format:

```json
[
  {
    "id": "1234567890123",
    "timestamp": "2025-10-08T10:30:00.000Z",
    "country": "Albania",
    "contactName": "John Doe",
    "contactEmail": "john@example.com",
    "completionStatus": "Complete",
    "responses": {
      "q1_1": "yes_operational",
      "q1_1_comment": "NDO established in 2020",
      ...
    }
  }
]
```

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- localStorage support required

## Customization

### Styling

- Questionnaire: Edit CSS in the `<style>` tag in `euda-questionnaire.html`
- Dashboard: Uses Tailwind CSS, edit `tailwind.config.js` or component styles

### Form Fields

Add or modify questions in `euda-questionnaire.html`. Ensure each input has a unique `name` attribute for proper data collection.

## Support

For questions or issues, please contact the project maintainers.

## License

[Add your license information here]
