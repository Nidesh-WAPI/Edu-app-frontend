/**
 * paperActions.js
 * Client-side PDF download + native share for unit test question papers.
 */

import { jsPDF } from 'jspdf';

// ── PDF generation ────────────────────────────────────────────────────────────

export const downloadPaperPDF = (paper) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const pageW  = doc.internal.pageSize.getWidth();
  const pageH  = doc.internal.pageSize.getHeight();
  const margin = 18;
  const maxW   = pageW - margin * 2;

  // ── Header block ──────────────────────────────────────────────────────────
  doc.setFillColor(63, 81, 181); // indigo
  doc.rect(0, 0, pageW, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('UNIT TEST — QUESTION PAPER', pageW / 2, 11, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const meta = paper.meta || {};
  doc.text(
    [
      `Subject: ${meta.subjectName || ''}   |   Class: ${meta.className || ''}   |   Max Marks: ${paper.maxMarks}   |   Time: 2 Hours`,
      `Syllabus: ${meta.syllabusName || ''}   |   Chapters: ${(meta.chapterTitles || []).join(', ')}`,
    ],
    pageW / 2,
    19,
    { align: 'center' }
  );

  doc.setTextColor(0, 0, 0);

  // ── Body text ─────────────────────────────────────────────────────────────
  let y = 40;
  const lineH   = 5;
  const bodyText = paper.paperText || '';

  // Split the pre-formatted paper text into lines
  const rawLines = bodyText.split('\n');

  rawLines.forEach((rawLine) => {
    // Let jsPDF wrap long lines
    const wrapped = doc.splitTextToSize(rawLine, maxW);

    wrapped.forEach((line) => {
      if (y + lineH > pageH - margin) {
        doc.addPage();
        y = margin;
      }

      // Style section headers differently
      const isHeader = line.startsWith('Section ') || line.startsWith('===') || line.startsWith('---');
      if (isHeader && !line.startsWith('===') && !line.startsWith('---')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
      } else {
        doc.setFont('courier', 'normal');
        doc.setFontSize(8.5);
      }

      doc.text(line, margin, y);
      y += lineH;
    });
  });

  // ── Footer on each page ───────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${meta.subjectName || 'Unit Test'}  ·  Page ${i} of ${totalPages}`,
      pageW / 2,
      pageH - 6,
      { align: 'center' }
    );
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  const dateStr = new Date(paper.createdAt || Date.now())
    .toLocaleDateString('en-IN')
    .replace(/\//g, '-');
  const filename = `${(meta.subjectName || 'Unit-Test').replace(/\s+/g, '_')}_${dateStr}.pdf`;
  doc.save(filename);
};

// ── Native share (PDF file on capable devices, text fallback) ─────────────────

export const sharePaper = async (paper, onCopied) => {
  const meta    = paper.meta || {};
  const title   = `${meta.subjectName || 'Unit Test'} — ${meta.className || ''}`;
  const subject = `Unit Test: ${meta.subjectName || ''} | ${paper.maxMarks} marks`;
  const text    = paper.paperText || '';

  // Try sharing as PDF file (supported on Android / newer iOS)
  if (navigator.share) {
    try {
      // Attempt to share a PDF blob
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW  = doc.internal.pageSize.getWidth();
      const pageH  = doc.internal.pageSize.getHeight();
      const margin = 18;
      const maxW   = pageW - margin * 2;
      let y = margin;
      const lineH = 5;
      text.split('\n').forEach((rawLine) => {
        doc.splitTextToSize(rawLine, maxW).forEach((line) => {
          if (y + lineH > pageH - margin) { doc.addPage(); y = margin; }
          doc.setFont('courier', 'normal').setFontSize(8.5);
          doc.text(line, margin, y);
          y += lineH;
        });
      });
      const blob = doc.output('blob');
      const file = new File([blob], `${title.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title, subject, files: [file] });
        return;
      }
    } catch (e) {
      if (e.name === 'AbortError') return; // user cancelled
    }

    // Fallback: share as text
    try {
      await navigator.share({ title, text: `${subject}\n\n${text}` });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }

  // Final fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(`${subject}\n\n${text}`);
    if (onCopied) onCopied();
  } catch {
    // ignore
  }
};
