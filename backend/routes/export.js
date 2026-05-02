const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Assignment = require('../models/Assignment');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } = require('docx');

// Helper: parse content into sections
function parseSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = { heading: null, lines: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentSection.lines.push('');
      continue;
    }
    // Detect headings: lines in ALL CAPS, or starting with ##, or short lines ending with :
    const isHeading =
      /^#{1,3}\s/.test(trimmed) ||
      (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 60) ||
      /^[A-Z][A-Z\s]{3,}:?$/.test(trimmed);

    if (isHeading) {
      if (currentSection.lines.length > 0 || currentSection.heading) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: trimmed.replace(/^#{1,3}\s*/, '').replace(/:$/, ''),
        lines: []
      };
    } else {
      currentSection.lines.push(trimmed);
    }
  }
  sections.push(currentSection);
  return sections;
}

// ─── PDF EXPORT ───────────────────────────────────────────────
router.get('/pdf/:assignmentId', authMiddleware, async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.assignmentId,
      userId: req.user.id
    });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const doc = new PDFDocument({ margin: 72, size: 'A4' });

    const filename = `${assignment.subject}_${assignment.rollNumber || 'Student'}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // ── Cover Page ──
    doc.moveDown(4);
    doc
      .font('Times-Bold')
      .fontSize(20)
      .fillColor('#000000')
      .text(assignment.topic.toUpperCase(), { align: 'center' });

    doc.moveDown(1);
    doc
      .font('Times-Roman')
      .fontSize(14)
      .text(`A ${assignment.format} Submitted in Partial Fulfillment`, { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(12).text(`of the Requirements for the Subject`, { align: 'center' });

    doc.moveDown(0.5);
    doc.font('Times-Bold').fontSize(13).text(assignment.subject, { align: 'center' });

    doc.moveDown(3);
    doc.font('Times-Roman').fontSize(12);

    const infoLines = [
      ['Submitted By', assignment.studentName || 'Student'],
      ['Roll Number', assignment.rollNumber || 'N/A'],
      ['University', assignment.universityName || 'N/A'],
      ['Date', new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
    ];

    for (const [label, value] of infoLines) {
      doc.text(`${label}: ${value}`, { align: 'center' });
      doc.moveDown(0.3);
    }

    // ── Page break before content ──
    doc.addPage();

    // ── Content ──
    const sections = parseSections(assignment.content);

    for (const section of sections) {
      if (section.heading) {
        doc.moveDown(0.8);
        doc
          .font('Times-Bold')
          .fontSize(13)
          .fillColor('#000000')
          .text(section.heading, { align: 'left' });
        doc.moveDown(0.3);
      }

      const bodyText = section.lines.join('\n').trim();
      if (bodyText) {
        doc
          .font('Times-Roman')
          .fontSize(12)
          .fillColor('#000000')
          .text(bodyText, {
            align: 'justify',
            lineGap: 4,
          });
      }
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'PDF generation failed' });
  }
});

// ─── WORD EXPORT ──────────────────────────────────────────────
router.get('/word/:assignmentId', authMiddleware, async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.assignmentId,
      userId: req.user.id
    });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const children = [];

    // ── Cover Page ──
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '', break: 1 }), new TextRun({ text: '', break: 1 }), new TextRun({ text: '', break: 1 })],
      }),
      new Paragraph({
        text: assignment.topic.toUpperCase(),
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `A ${assignment.format} Submitted in Partial Fulfillment`,
            font: 'Times New Roman',
            size: 28,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `of the Requirements for the Subject`,
            font: 'Times New Roman',
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [
          new TextRun({
            text: assignment.subject,
            font: 'Times New Roman',
            size: 28,
            bold: true,
          }),
        ],
      }),
    );

    const infoLines = [
      ['Submitted By', assignment.studentName || 'Student'],
      ['Roll Number', assignment.rollNumber || 'N/A'],
      ['University', assignment.universityName || 'N/A'],
      ['Date', new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
    ];

    for (const [label, value] of infoLines) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 },
          children: [
            new TextRun({ text: `${label}: `, font: 'Times New Roman', size: 24, bold: true }),
            new TextRun({ text: value, font: 'Times New Roman', size: 24 }),
          ],
        })
      );
    }

    // ── Page break ──
    children.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );

    // ── Content ──
    const sections = parseSections(assignment.content);

    for (const section of sections) {
      if (section.heading) {
        children.push(
          new Paragraph({
            text: section.heading,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: section.heading,
                font: 'Times New Roman',
                size: 28,
                bold: true,
              }),
            ],
          })
        );
      }

      const bodyText = section.lines.join('\n').trim();
      if (bodyText) {
        const paragraphs = bodyText.split('\n\n').filter(Boolean);
        for (const para of paragraphs) {
          children.push(
            new Paragraph({
              spacing: { after: 200, line: 360 },
              children: [
                new TextRun({
                  text: para.replace(/\n/g, ' '),
                  font: 'Times New Roman',
                  size: 24,
                }),
              ],
            })
          );
        }
      }
    }

    const docFile = new Document({
      sections: [{ children }],
    });

    const buffer = await Packer.toBuffer(docFile);

    const filename = `${assignment.subject}_${assignment.rollNumber || 'Student'}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Word generation failed' });
  }
});

// ─── EXPORT FROM RAW CONTENT (for unsaved assignments) ────────
router.post('/pdf', authMiddleware, async (req, res) => {
  try {
    const { content, topic, subject, format, studentName, rollNumber, universityName } = req.body;

    const doc = new PDFDocument({ margin: 72, size: 'A4' });
    const filename = `${subject || 'Assignment'}_${rollNumber || 'Student'}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    doc.moveDown(4);
    doc.font('Times-Bold').fontSize(20).text((topic || 'Assignment').toUpperCase(), { align: 'center' });
    doc.moveDown(1);
    doc.font('Times-Roman').fontSize(13).text(`A ${format || 'Document'}`, { align: 'center' });
    doc.moveDown(3);

    const infoLines = [
      ['Submitted By', studentName || 'Student'],
      ['Roll Number', rollNumber || 'N/A'],
      ['University', universityName || 'N/A'],
      ['Date', new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
    ];
    for (const [label, value] of infoLines) {
      doc.font('Times-Roman').fontSize(12).text(`${label}: ${value}`, { align: 'center' });
      doc.moveDown(0.3);
    }

    doc.addPage();
    const sections = parseSections(content);
    for (const section of sections) {
      if (section.heading) {
        doc.moveDown(0.8);
        doc.font('Times-Bold').fontSize(13).text(section.heading);
        doc.moveDown(0.3);
      }
      const bodyText = section.lines.join('\n').trim();
      if (bodyText) {
        doc.font('Times-Roman').fontSize(12).text(bodyText, { align: 'justify', lineGap: 4 });
      }
    }
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'PDF generation failed' });
  }
});

router.post('/word', authMiddleware, async (req, res) => {
  try {
    const { content, topic, subject, format, studentName, rollNumber, universityName } = req.body;

    const children = [];

    children.push(
      new Paragraph({ children: [new TextRun({ text: '', break: 1 }), new TextRun({ text: '', break: 1 })] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: (topic || 'Assignment').toUpperCase(), font: 'Times New Roman', size: 40, bold: true })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [new TextRun({ text: `A ${format || 'Document'} — ${subject || ''}`, font: 'Times New Roman', size: 28 })],
      }),
    );

    const infoLines = [
      ['Submitted By', studentName || 'Student'],
      ['Roll Number', rollNumber || 'N/A'],
      ['University', universityName || 'N/A'],
      ['Date', new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
    ];
    for (const [label, value] of infoLines) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 },
          children: [
            new TextRun({ text: `${label}: `, font: 'Times New Roman', size: 24, bold: true }),
            new TextRun({ text: value, font: 'Times New Roman', size: 24 }),
          ],
        })
      );
    }

    children.push(new Paragraph({ children: [new PageBreak()] }));

    const sections = parseSections(content);
    for (const section of sections) {
      if (section.heading) {
        children.push(
          new Paragraph({
            spacing: { before: 400, after: 200 },
            children: [new TextRun({ text: section.heading, font: 'Times New Roman', size: 28, bold: true })],
          })
        );
      }
      const bodyText = section.lines.join('\n').trim();
      if (bodyText) {
        const paragraphs = bodyText.split('\n\n').filter(Boolean);
        for (const para of paragraphs) {
          children.push(
            new Paragraph({
              spacing: { after: 200, line: 360 },
              children: [new TextRun({ text: para.replace(/\n/g, ' '), font: 'Times New Roman', size: 24 })],
            })
          );
        }
      }
    }

    const docFile = new Document({ sections: [{ children }] });
    const buffer = await Packer.toBuffer(docFile);

    const filename = `${subject || 'Assignment'}_${rollNumber || 'Student'}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Word generation failed' });
  }
});

module.exports = router;