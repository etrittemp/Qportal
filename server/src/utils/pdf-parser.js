// Wrapper for pdf-parse to avoid serverless initialization issues
// The pdf-parse module tries to read test files during initialization
// when module.parent is null, which fails in Vercel's serverless environment

import Pdf from 'pdf-parse/lib/pdf-parse.js';

// Export the actual parser function directly, bypassing the index.js wrapper
export default Pdf;
