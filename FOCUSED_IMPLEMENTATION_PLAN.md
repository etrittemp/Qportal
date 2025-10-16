# 🎯 Focused Implementation Plan

**Priority Focus Areas:**
1. State-of-the-art Excel Export
2. CI/CD Pipeline
3. Backend TypeScript Migration

---

## 📊 1. State-of-the-Art Excel Export

### Current State
- ✅ Basic CSV export exists
- ❌ No Excel (.xlsx) export
- ❌ No formatting, styling, or charts
- ❌ No multi-sheet workbooks
- ❌ No data analysis features

### Target: Best-in-Class Excel Export

#### Features to Implement

**A. Advanced Excel Generation (ExcelJS)**
```typescript
// Use ExcelJS library for full Excel control
import ExcelJS from 'exceljs';

Features:
- Multiple worksheets
- Cell formatting (colors, fonts, borders)
- Column auto-sizing
- Freeze panes
- Filters and sorting
- Data validation
- Formulas and calculations
- Charts and graphs
- Conditional formatting
- Images and logos
- Headers and footers
- Print settings
```

**B. Multi-Sheet Structure**
```
Sheet 1: Summary Dashboard
- Total responses count
- Response rate chart
- Completion status pie chart
- Geographic distribution
- Date range
- Key metrics

Sheet 2: Raw Data
- All responses (one row per response)
- All questions as columns
- Formatted dates
- Hyperlinks preserved
- Data validation applied

Sheet 3: Question Breakdown
- Each question with answer distribution
- Charts for each question
- Percentages calculated
- Statistical summaries

Sheet 4: Open-Ended Responses
- All text responses
- Grouped by question
- Word count analysis
- Easy to read formatting

Sheet 5: Metadata
- Questionnaire details
- Export timestamp
- Filters applied
- Data dictionary
```

**C. Advanced Formatting**
```typescript
Features:
1. Professional Styling
   - Corporate theme colors
   - Branded header with logo
   - Consistent fonts (Arial 10pt for data, 14pt bold for headers)
   - Alternating row colors for readability
   - Border around data tables

2. Smart Column Widths
   - Auto-size based on content
   - Min/max width limits
   - Wrap text for long answers
   - Fixed width for dates/numbers

3. Cell Formatting
   - Dates: "DD/MM/YYYY HH:MM"
   - Numbers: Proper decimal places
   - Percentages: "XX.X%"
   - Booleans: Yes/No (not true/false)
   - URLs: Clickable hyperlinks
   - Email: Clickable mailto links

4. Conditional Formatting
   - Highlight incomplete responses (red)
   - Highlight complete responses (green)
   - Color-code satisfaction ratings
   - Flag outliers/anomalies
```

**D. Charts & Visualizations**
```typescript
Auto-generate charts:
1. Response Rate Over Time (Line Chart)
2. Completion Status (Pie Chart)
3. Geographic Distribution (Bar Chart)
4. Top 5 Countries (Column Chart)
5. Per-Question Charts:
   - Radio/Select: Pie or Bar chart
   - Checkbox: Horizontal bar chart
   - Rating: Column chart
   - Number: Histogram
```

**E. Data Analysis Features**
```typescript
1. Pivot Tables (if possible)
   - Summary by country
   - Summary by date range
   - Summary by completion status

2. Formulas
   - Total count: =COUNTA(range)
   - Completion rate: =completed/total
   - Average ratings: =AVERAGE(range)
   - Most common answer: =MODE(range)

3. Named Ranges
   - Easy reference in formulas
   - Better organization

4. Table Formatting
   - Convert data to Excel Tables
   - Enable sorting/filtering
   - Professional appearance
```

**F. Advanced Options**
```typescript
Export Configuration:
- Choose which sheets to include
- Select date range
- Filter by country, status, etc.
- Include/exclude personal data (GDPR)
- Template selection:
  - Executive Summary
  - Full Data Export
  - Analysis Report
  - Raw Data Only
- Custom branding (logo, colors)
- Language selection for headers
```

### Implementation Plan

#### Phase 1: Basic Excel Export (Week 1, Days 1-2)
```bash
# Install dependencies
npm install exceljs --save

# Create service
server/src/services/excelExport.js (will migrate to TS)
```

**Features:**
- [x] Generate basic .xlsx file
- [x] All responses in one sheet
- [x] Proper column headers
- [x] Basic formatting
- [x] Auto-size columns
- [x] Download functionality

#### Phase 2: Multi-Sheet + Formatting (Week 1, Days 3-4)
**Features:**
- [x] Summary sheet with metrics
- [x] Raw data sheet
- [x] Question breakdown sheet
- [x] Professional styling
- [x] Freeze panes
- [x] Filters enabled

#### Phase 3: Charts + Analysis (Week 1, Day 5)
**Features:**
- [x] Auto-generate charts
- [x] Conditional formatting
- [x] Formulas and calculations
- [x] Named ranges

#### Phase 4: Advanced Features (Week 2, Days 1-2)
**Features:**
- [x] Export configuration UI
- [x] Template selection
- [x] Custom branding
- [x] GDPR-compliant exports
- [x] Scheduled exports (optional)

#### Phase 5: Testing & Optimization (Week 2, Day 3)
**Tasks:**
- [x] Test with large datasets (1000+ responses)
- [x] Optimize memory usage
- [x] Test all question types
- [x] Cross-platform compatibility (Windows/Mac)
- [x] Performance benchmarks

### Technical Implementation

#### Backend API Endpoint
```typescript
// server/src/routes/export.ts (after TS migration)

import { Router } from 'express';
import { ExcelExportService } from '../services/excelExport';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Advanced Excel export
router.post('/responses/export/excel', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      questionnaireId,
      filters,
      template,
      includeCharts,
      includePersonalData,
      customBranding
    } = req.body;

    const excelService = new ExcelExportService();

    const workbook = await excelService.generateAdvancedExport({
      questionnaireId,
      filters,
      template,
      includeCharts,
      includePersonalData,
      customBranding
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="questionnaire-export-${Date.now()}.xlsx"`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: 'Failed to generate Excel export' });
  }
});

export default router;
```

#### Excel Service (Comprehensive)
```typescript
// server/src/services/excelExport.ts

import ExcelJS from 'exceljs';
import { supabase } from '../index';

interface ExportOptions {
  questionnaireId: string;
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    country?: string;
    status?: string;
  };
  template?: 'full' | 'summary' | 'raw' | 'analysis';
  includeCharts?: boolean;
  includePersonalData?: boolean;
  customBranding?: {
    logo?: string;
    primaryColor?: string;
    companyName?: string;
  };
}

export class ExcelExportService {

  async generateAdvancedExport(options: ExportOptions): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();

    // Set workbook properties
    workbook.creator = 'EUDA Portal';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.properties.date1904 = false;

    // Fetch data
    const questionnaire = await this.getQuestionnaire(options.questionnaireId);
    const responses = await this.getResponses(options);
    const stats = this.calculateStatistics(responses, questionnaire);

    // Generate sheets based on template
    switch (options.template) {
      case 'summary':
        await this.addSummarySheet(workbook, questionnaire, responses, stats, options);
        break;

      case 'raw':
        await this.addRawDataSheet(workbook, questionnaire, responses, options);
        break;

      case 'analysis':
        await this.addAnalysisSheets(workbook, questionnaire, responses, stats, options);
        break;

      case 'full':
      default:
        // All sheets
        await this.addSummarySheet(workbook, questionnaire, responses, stats, options);
        await this.addRawDataSheet(workbook, questionnaire, responses, options);
        await this.addQuestionBreakdownSheet(workbook, questionnaire, responses, stats, options);
        await this.addOpenEndedSheet(workbook, questionnaire, responses, options);
        await this.addMetadataSheet(workbook, questionnaire, options);
    }

    return workbook;
  }

  private async addSummarySheet(
    workbook: ExcelJS.Workbook,
    questionnaire: any,
    responses: any[],
    stats: any,
    options: ExportOptions
  ) {
    const sheet = workbook.addWorksheet('Summary Dashboard', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 3 }]
    });

    // Add logo if provided
    if (options.customBranding?.logo) {
      const imageId = workbook.addImage({
        base64: options.customBranding.logo,
        extension: 'png',
      });
      sheet.addImage(imageId, 'A1:B3');
    }

    // Title
    const titleRow = sheet.getRow(1);
    titleRow.getCell(3).value = questionnaire.title;
    titleRow.getCell(3).font = { size: 18, bold: true, color: { argb: 'FF6B46C1' } };
    titleRow.height = 30;

    // Subtitle
    sheet.getRow(2).getCell(3).value = `Export Generated: ${new Date().toLocaleString()}`;
    sheet.getRow(2).getCell(3).font = { size: 10, italic: true, color: { argb: 'FF666666' } };

    // Key Metrics (starting row 5)
    let currentRow = 5;

    const metrics = [
      { label: 'Total Responses', value: stats.totalResponses },
      { label: 'Complete', value: stats.complete, percent: (stats.complete / stats.totalResponses * 100).toFixed(1) + '%' },
      { label: 'Partial', value: stats.partial, percent: (stats.partial / stats.totalResponses * 100).toFixed(1) + '%' },
      { label: 'Completion Rate', value: (stats.complete / stats.totalResponses * 100).toFixed(1) + '%' },
      { label: 'Average Time (min)', value: stats.avgCompletionTime?.toFixed(1) || 'N/A' },
      { label: 'Date Range', value: `${stats.firstResponse || 'N/A'} - ${stats.lastResponse || 'N/A'}` }
    ];

    // Metrics header
    const metricsHeaderRow = sheet.getRow(currentRow);
    metricsHeaderRow.getCell(1).value = 'Metric';
    metricsHeaderRow.getCell(2).value = 'Value';
    metricsHeaderRow.font = { bold: true, size: 11 };
    metricsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE9D8FD' }
    };
    currentRow++;

    // Add metrics
    metrics.forEach(metric => {
      const row = sheet.getRow(currentRow);
      row.getCell(1).value = metric.label;
      row.getCell(2).value = metric.value;
      if (metric.percent) {
        row.getCell(3).value = metric.percent;
      }
      currentRow++;
    });

    // Style metrics section
    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(3).width = 15;

    // Add charts if requested
    if (options.includeCharts) {
      currentRow += 2;
      await this.addResponseChart(sheet, stats, currentRow);
    }

    // Add borders
    const dataRange = `A5:C${currentRow}`;
    this.addBorders(sheet, dataRange);
  }

  private async addRawDataSheet(
    workbook: ExcelJS.Workbook,
    questionnaire: any,
    responses: any[],
    options: ExportOptions
  ) {
    const sheet = workbook.addWorksheet('Raw Data', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    // Build headers
    const headers = ['Response ID', 'Submitted At', 'Status', 'Country'];

    if (options.includePersonalData) {
      headers.push('Contact Name', 'Contact Email');
    }

    // Add all questions as columns
    questionnaire.sections.forEach((section: any) => {
      section.questions.forEach((question: any) => {
        headers.push(this.getText(question.question_text, 'en'));
      });
    });

    // Set headers
    const headerRow = sheet.getRow(1);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6B46C1' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    });
    headerRow.height = 25;

    // Add data rows
    responses.forEach((response, index) => {
      const row = sheet.getRow(index + 2);
      let colIndex = 1;

      row.getCell(colIndex++).value = response.id;
      row.getCell(colIndex++).value = new Date(response.submitted_at);
      row.getCell(colIndex++).value = response.completion_status;
      row.getCell(colIndex++).value = response.country;

      if (options.includePersonalData) {
        row.getCell(colIndex++).value = response.contact_name;
        row.getCell(colIndex++).value = response.contact_email;
      }

      // Add answers
      questionnaire.sections.forEach((section: any) => {
        section.questions.forEach((question: any) => {
          const answer = response.responses?.[question.id]?.answer;
          row.getCell(colIndex++).value = this.formatAnswer(answer);
        });
      });

      // Alternating row colors
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        });
      }
    });

    // Auto-size columns
    sheet.columns.forEach((column) => {
      column.width = 20;
    });

    // Add filters
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length }
    };

    // Format date column
    const dateColumn = sheet.getColumn(2);
    dateColumn.numFmt = 'dd/mm/yyyy hh:mm';
  }

  private async addQuestionBreakdownSheet(
    workbook: ExcelJS.Workbook,
    questionnaire: any,
    responses: any[],
    stats: any,
    options: ExportOptions
  ) {
    const sheet = workbook.addWorksheet('Question Analysis');

    let currentRow = 1;

    questionnaire.sections.forEach((section: any) => {
      section.questions.forEach((question: any) => {
        // Question title
        const titleRow = sheet.getRow(currentRow);
        titleRow.getCell(1).value = this.getText(question.question_text, 'en');
        titleRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF6B46C1' } };
        currentRow++;

        // Question type
        sheet.getRow(currentRow).getCell(1).value = `Type: ${question.question_type}`;
        sheet.getRow(currentRow).getCell(1).font = { italic: true, color: { argb: 'FF666666' } };
        currentRow++;

        // Answer distribution
        const answers = this.getAnswerDistribution(responses, question);

        // Headers
        const headerRow = sheet.getRow(currentRow);
        headerRow.getCell(1).value = 'Answer';
        headerRow.getCell(2).value = 'Count';
        headerRow.getCell(3).value = 'Percentage';
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE9D8FD' }
        };
        currentRow++;

        // Data
        answers.forEach(answer => {
          const row = sheet.getRow(currentRow);
          row.getCell(1).value = answer.value;
          row.getCell(2).value = answer.count;
          row.getCell(3).value = answer.percentage + '%';
          currentRow++;
        });

        // Add chart for radio/select/checkbox
        if (options.includeCharts && ['radio', 'select', 'checkbox'].includes(question.question_type)) {
          this.addQuestionChart(sheet, answers, currentRow);
          currentRow += 15; // Space for chart
        }

        currentRow += 2; // Space between questions
      });
    });

    // Auto-size columns
    sheet.getColumn(1).width = 40;
    sheet.getColumn(2).width = 15;
    sheet.getColumn(3).width = 15;
  }

  private async addOpenEndedSheet(
    workbook: ExcelJS.Workbook,
    questionnaire: any,
    responses: any[],
    options: ExportOptions
  ) {
    const sheet = workbook.addWorksheet('Open-Ended Responses');

    // Find all text/textarea questions
    const textQuestions: any[] = [];
    questionnaire.sections.forEach((section: any) => {
      section.questions.forEach((question: any) => {
        if (['text', 'textarea', 'email', 'url'].includes(question.question_type)) {
          textQuestions.push(question);
        }
      });
    });

    let currentRow = 1;

    textQuestions.forEach(question => {
      // Question header
      const headerRow = sheet.getRow(currentRow);
      headerRow.getCell(1).value = this.getText(question.question_text, 'en');
      headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6B46C1' }
      };
      currentRow += 2;

      // Collect all responses for this question
      responses.forEach((response, index) => {
        const answer = response.responses?.[question.id]?.answer;
        if (answer && answer.trim()) {
          const row = sheet.getRow(currentRow);
          row.getCell(1).value = `Response ${index + 1}:`;
          row.getCell(1).font = { bold: true, size: 10 };
          row.getCell(2).value = answer;
          row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
          currentRow++;
        }
      });

      currentRow += 2; // Space between questions
    });

    // Column widths
    sheet.getColumn(1).width = 20;
    sheet.getColumn(2).width = 80;
  }

  private async addMetadataSheet(
    workbook: ExcelJS.Workbook,
    questionnaire: any,
    options: ExportOptions
  ) {
    const sheet = workbook.addWorksheet('Metadata');

    const metadata = [
      ['Questionnaire Title', questionnaire.title],
      ['Questionnaire ID', questionnaire.id],
      ['Description', questionnaire.description],
      ['Status', questionnaire.status],
      ['Created At', questionnaire.created_at],
      ['Export Date', new Date().toISOString()],
      ['Export Template', options.template || 'full'],
      ['Includes Charts', options.includeCharts ? 'Yes' : 'No'],
      ['Includes Personal Data', options.includePersonalData ? 'Yes' : 'No'],
      ['Filters Applied', JSON.stringify(options.filters || {})],
    ];

    let row = 1;
    metadata.forEach(([key, value]) => {
      const currentRow = sheet.getRow(row);
      currentRow.getCell(1).value = key;
      currentRow.getCell(1).font = { bold: true };
      currentRow.getCell(2).value = value;
      row++;
    });

    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 50;
  }

  // Helper methods
  private getText(multiLangObj: any, lang: string = 'en'): string {
    if (!multiLangObj) return '';
    if (typeof multiLangObj === 'string') return multiLangObj;
    return multiLangObj[lang] || multiLangObj.en || '';
  }

  private formatAnswer(answer: any): string {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    if (typeof answer === 'object' && answer !== null) {
      return JSON.stringify(answer);
    }
    return answer?.toString() || '';
  }

  private getAnswerDistribution(responses: any[], question: any) {
    const counts: { [key: string]: number } = {};
    let total = 0;

    responses.forEach(response => {
      const answer = response.responses?.[question.id]?.answer;
      if (answer) {
        if (Array.isArray(answer)) {
          answer.forEach(a => {
            counts[a] = (counts[a] || 0) + 1;
            total++;
          });
        } else {
          counts[answer] = (counts[answer] || 0) + 1;
          total++;
        }
      }
    });

    return Object.entries(counts).map(([value, count]) => ({
      value,
      count,
      percentage: ((count / total) * 100).toFixed(1)
    })).sort((a, b) => b.count - a.count);
  }

  private calculateStatistics(responses: any[], questionnaire: any) {
    const complete = responses.filter(r => r.completion_status === 'Complete').length;
    const partial = responses.filter(r => r.completion_status === 'Partial').length;

    const dates = responses.map(r => new Date(r.submitted_at)).filter(d => !isNaN(d.getTime()));
    const firstResponse = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))).toLocaleDateString() : null;
    const lastResponse = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))).toLocaleDateString() : null;

    return {
      totalResponses: responses.length,
      complete,
      partial,
      firstResponse,
      lastResponse,
      avgCompletionTime: null // Calculate if we track time
    };
  }

  private addBorders(sheet: ExcelJS.Worksheet, range: string) {
    // Implementation for adding borders to a range
  }

  private addResponseChart(sheet: ExcelJS.Worksheet, stats: any, row: number) {
    // Add pie chart for completion status
    // ExcelJS chart support is limited, might need to use formulas + manual chart
  }

  private addQuestionChart(sheet: ExcelJS.Worksheet, answers: any[], row: number) {
    // Add bar chart for answer distribution
  }

  private async getQuestionnaire(id: string) {
    const { data } = await supabase
      .from('questionnaires')
      .select(`
        *,
        sections:questionnaire_sections(
          *,
          questions(*)
        )
      `)
      .eq('id', id)
      .single();
    return data;
  }

  private async getResponses(options: ExportOptions) {
    let query = supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('questionnaire_id', options.questionnaireId)
      .order('submitted_at', { ascending: false });

    if (options.filters?.dateFrom) {
      query = query.gte('submitted_at', options.filters.dateFrom);
    }
    if (options.filters?.dateTo) {
      query = query.lte('submitted_at', options.filters.dateTo);
    }
    if (options.filters?.country) {
      query = query.eq('country', options.filters.country);
    }
    if (options.filters?.status) {
      query = query.eq('completion_status', options.filters.status);
    }

    const { data } = await query;
    return data || [];
  }
}
```

#### Frontend Component (Export Dialog)
```typescript
// src/components/ExcelExportDialog.tsx

import React, { useState } from 'react';
import { Download, FileSpreadsheet, Settings } from 'lucide-react';
import { questionnaireAPI } from '../api';
import { showToast } from '../utils/toast';

interface ExcelExportDialogProps {
  questionnaireId: string;
  questionnaireTitle: string;
  onClose: () => void;
}

const ExcelExportDialog: React.FC<ExcelExportDialogProps> = ({
  questionnaireId,
  questionnaireTitle,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<'full' | 'summary' | 'raw' | 'analysis'>('full');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includePersonalData, setIncludePersonalData] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    country: '',
    status: ''
  });

  const handleExport = async () => {
    try {
      setLoading(true);
      showToast.loading('Generating Excel file...');

      const response = await questionnaireAPI.exportToExcel({
        questionnaireId,
        filters,
        template,
        includeCharts,
        includePersonalData
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${questionnaireTitle.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast.success('Excel file downloaded successfully!');
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      showToast.error('Failed to generate Excel file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Export to Excel</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Template
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'full', label: 'Full Export', desc: 'All sheets with charts' },
                { value: 'summary', label: 'Summary Only', desc: 'Dashboard and metrics' },
                { value: 'raw', label: 'Raw Data', desc: 'Just the response data' },
                { value: 'analysis', label: 'Analysis', desc: 'Question breakdown + charts' }
              ].map(t => (
                <button
                  key={t.value}
                  onClick={() => setTemplate(t.value as any)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    template === t.value
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{t.label}</div>
                  <div className="text-sm text-gray-600 mt-1">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Export Options
            </label>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">Include Charts</div>
                <div className="text-sm text-gray-600">Auto-generate visualizations</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={includePersonalData}
                onChange={(e) => setIncludePersonalData(e.target.checked)}
                className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">Include Personal Data</div>
                <div className="text-sm text-gray-600">Names and emails (GDPR)</div>
              </div>
            </label>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Filters (Optional)
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Export to Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelExportDialog;
```

### Testing Plan

```typescript
// tests/excelExport.test.ts

describe('Excel Export Service', () => {
  test('generates basic workbook', async () => {
    const service = new ExcelExportService();
    const workbook = await service.generateAdvancedExport({
      questionnaireId: 'test-id',
      template: 'full'
    });
    expect(workbook.worksheets.length).toBeGreaterThan(0);
  });

  test('includes all sheets in full export', async () => {
    // Test that all 5 sheets are created
  });

  test('applies proper formatting', async () => {
    // Test styling, colors, fonts
  });

  test('handles large datasets (1000+ responses)', async () => {
    // Performance test
  });

  test('respects GDPR settings', async () => {
    // Test that personal data is excluded when requested
  });
});
```

---

## 🔄 2. CI/CD Pipeline

### Goals
- Automated testing on every push
- Automated builds
- Automated deployments
- Code quality checks
- Security scanning

### GitHub Actions Workflow

#### File Structure
```
.github/
├── workflows/
│   ├── ci.yml                 # Continuous Integration
│   ├── cd-frontend.yml        # Deploy Frontend
│   ├── cd-backend.yml         # Deploy Backend
│   └── codeql.yml            # Security Scanning
└── dependabot.yml            # Dependency Updates
```

#### CI Workflow (.github/workflows/ci.yml)
```yaml
name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  # Frontend Tests
  frontend-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prettier
        run: npm run format:check

      - name: Run TypeScript Check
        run: npm run type-check

      - name: Run Unit Tests
        run: npm run test:coverage

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json

      - name: Build Frontend
        run: npm run build

      - name: Run E2E Tests
        run: npm run test:e2e

  # Backend Tests
  backend-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: server/package-lock.json

      - name: Install dependencies
        working-directory: ./server
        run: npm ci

      - name: Run ESLint
        working-directory: ./server
        run: npm run lint

      - name: Run TypeScript Check
        working-directory: ./server
        run: npm run type-check

      - name: Run Unit Tests
        working-directory: ./server
        run: npm run test:coverage

      - name: Build Backend
        working-directory: ./server
        run: npm run build

  # Security Scanning
  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  # Code Quality
  code-quality:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

#### CD Frontend (.github/workflows/cd-frontend.yml)
```yaml
name: Deploy Frontend

on:
  push:
    branches: [ main ]
    paths:
      - 'src/**'
      - 'public/**'
      - 'index.html'
      - 'package.json'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Notify Deployment
        if: success()
        run: echo "✅ Frontend deployed successfully"
```

#### CD Backend (.github/workflows/cd-backend.yml)
```yaml
name: Deploy Backend

on:
  push:
    branches: [ main ]
    paths:
      - 'server/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: server/package-lock.json

      - name: Install dependencies
        working-directory: ./server
        run: npm ci

      - name: Run tests
        working-directory: ./server
        run: npm test

      - name: Build TypeScript
        working-directory: ./server
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_BACKEND_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: './server'

      - name: Run Database Migrations
        if: success()
        run: echo "Run migrations if needed"
```

---

## 🔧 3. Backend TypeScript Migration

### Migration Plan

#### Phase 1: Setup (Day 1)
```bash
cd server
npm install --save-dev typescript @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken
npx tsc --init
```

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### Updated package.json
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "test": "jest",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.10.5",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.2",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

#### Phase 2: Convert Files (Days 2-5)

**Migration Order:**
1. Types and interfaces first
2. Middleware
3. Utilities
4. Routes (one at a time)
5. Main index file

**Example: Convert auth.js to auth.ts**
```typescript
// server/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        isAdmin: boolean;
      };
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  isAdmin: boolean;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};
```

#### Complete Implementation Timeline

**Week 1:**
- Day 1: Excel Export - Basic implementation
- Day 2: Excel Export - Multi-sheet + formatting
- Day 3: Excel Export - Charts + analysis
- Day 4: Excel Export - Advanced features + UI
- Day 5: Excel Export - Testing + optimization

**Week 2:**
- Day 1-2: CI/CD Setup - GitHub Actions workflows
- Day 3: Backend TypeScript - Setup + types
- Day 4: Backend TypeScript - Convert middleware + utils
- Day 5: Backend TypeScript - Convert routes

**Week 3:**
- Day 1-2: Backend TypeScript - Finish conversion + testing
- Day 3-5: Integration testing, polish, documentation

---

## 📋 Summary & Next Steps

### Deliverables
1. ✅ State-of-the-art Excel export with 5 sheets, charts, formatting
2. ✅ Complete CI/CD pipeline with testing and deployment
3. ✅ Backend fully migrated to TypeScript

### Timeline: 3 Weeks

### Success Metrics
- Excel exports have 5+ sheets with professional formatting
- CI/CD runs on every commit, deploys automatically
- Backend is 100% TypeScript with full type safety
- Test coverage reaches 60%+
- Build time under 2 minutes
- Zero TypeScript errors

**Ready to implement? Let's start with Excel export!** 🚀
