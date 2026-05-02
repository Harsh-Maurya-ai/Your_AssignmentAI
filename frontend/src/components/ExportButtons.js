import React, { useState } from 'react';
import axios from 'axios';
import './ExportButtons.css';

const ExportButtons = ({ assignmentId, content, form }) => {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('token');

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    setError('');
    try {
      let response;
      if (assignmentId) {
        response = await axios.get(
          `http://localhost:5000/api/export/pdf/${assignmentId}`,
          {
            headers: { Authorization: `Bearer ${getToken()}` },
            responseType: 'blob',
          }
        );
      } else {
        response = await axios.post(
          `http://localhost:5000/api/export/pdf`,
          form,
          {
            headers: { Authorization: `Bearer ${getToken()}` },
            responseType: 'blob',
          }
        );
      }
      const filename = `${form?.subject || 'Assignment'}_${form?.rollNumber || 'Student'}.pdf`;
      downloadBlob(new Blob([response.data], { type: 'application/pdf' }), filename);
    } catch (err) {
      setError('PDF export failed. Try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportWord = async () => {
    setWordLoading(true);
    setError('');
    try {
      let response;
      if (assignmentId) {
        response = await axios.get(
          `http://localhost:5000/api/export/word/${assignmentId}`,
          {
            headers: { Authorization: `Bearer ${getToken()}` },
            responseType: 'blob',
          }
        );
      } else {
        response = await axios.post(
          `http://localhost:5000/api/export/word`,
          form,
          {
            headers: { Authorization: `Bearer ${getToken()}` },
            responseType: 'blob',
          }
        );
      }
      const filename = `${form?.subject || 'Assignment'}_${form?.rollNumber || 'Student'}.docx`;
      downloadBlob(
        new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
        filename
      );
    } catch (err) {
      setError('Word export failed. Try again.');
    } finally {
      setWordLoading(false);
    }
  };

  return (
    <div className="export-wrap">
      <button
        className="export-btn pdf"
        onClick={handleExportPDF}
        disabled={pdfLoading}
      >
        {pdfLoading ? (
          <span className="export-spinner-row"><span className="export-spinner" /> Generating PDF...</span>
        ) : (
          '📄 Export as PDF'
        )}
      </button>

      <button
        className="export-btn word"
        onClick={handleExportWord}
        disabled={wordLoading}
      >
        {wordLoading ? (
          <span className="export-spinner-row"><span className="export-spinner" /> Generating Word...</span>
        ) : (
          '📝 Export as Word'
        )}
      </button>

      {error && <div className="export-error">⚠️ {error}</div>}
    </div>
  );
};

export default ExportButtons;