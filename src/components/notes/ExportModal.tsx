import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { NoteDocument } from '@/types';
import { Download, Copy, Check, FileText, Code2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteDocument;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, note }) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Convert HTML content into simple markdown representation
  const getMarkdownContent = () => {
    let md = `# ${note.title}\n\n`;
    if (note.canvasTitle) {
      md += `> Linked Canvas: [[${note.canvasTitle}]]\n\n`;
    }
    if (note.folder) {
      md += `> Folder: ${note.folder}\n\n`;
    }

    // Basic HTML to markdown converter
    let text = note.content || '';
    text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    text = text.replace(/<ul[^>]*>/gi, '');
    text = text.replace(/<\/ul>/gi, '\n');
    text = text.replace(/<ol[^>]*>/gi, '');
    text = text.replace(/<\/ol>/gi, '\n');
    text = text.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    text = text.replace(/<em>(.*?)<\/em>/gi, '*$1*');
    text = text.replace(/<u>(.*?)<\/u>/gi, '$1');
    text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    text = text.replace(/<div[^>]*data-type="callout"[^>]*data-eyebrow="([^"]*)"[^>]*data-title="([^"]*)"[^>]*>([\s\S]*?)<\/div>/gi, '> [!NOTE] $1\n> **$2**\n> $3\n\n');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');

    md += text;
    return md;
  };

  const handleDownload = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = async () => {
    const md = getMarkdownContent();
    await navigator.clipboard.writeText(md);
    setCopiedFormat('markdown');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(note, null, 2));
    setCopiedFormat('json');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Document"
      description="Download or copy your knowledge note in standard open formats."
    >
      <div className="flex flex-col gap-4">
        {/* Document Meta Preview */}
        <div className="p-3.5 rounded-xl bg-surface border border-border flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="font-sans font-semibold text-xs text-primaryDark truncate">
              {note.title}
            </span>
            <span className="font-mono text-[10px] text-secondaryGray">
              {note.folder || 'General'} · Last updated {new Date(note.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-accent-indigo text-indigo-950 font-bold uppercase">
            {note.canvasTitle || 'DOCUMENT'}
          </span>
        </div>

        {/* Download Formats */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] font-bold text-midGray uppercase tracking-wider">
            Download As
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                handleDownload(
                  `${note.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`,
                  getMarkdownContent(),
                  'text/markdown'
                )
              }
              className="flex items-center gap-2 p-3 rounded-xl bg-bg hover:bg-surface border border-border text-left transition-colors cursor-pointer group"
            >
              <Download className="w-4 h-4 text-secondaryGray group-hover:text-primaryDark" />
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs text-primaryDark">Markdown</span>
                <span className="font-mono text-[10px] text-secondaryGray">.md file</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                handleDownload(
                  `${note.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`,
                  `<!DOCTYPE html><html><head><title>${note.title}</title><meta charset="utf-8"></head><body style="font-family:sans-serif;max-width:800px;margin:40px auto;line-height:1.6;">${note.content}</body></html>`,
                  'text/html'
                )
              }
              className="flex items-center gap-2 p-3 rounded-xl bg-bg hover:bg-surface border border-border text-left transition-colors cursor-pointer group"
            >
              <FileText className="w-4 h-4 text-secondaryGray group-hover:text-primaryDark" />
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs text-primaryDark">HTML Page</span>
                <span className="font-mono text-[10px] text-secondaryGray">.html file</span>
              </div>
            </button>
          </div>
        </div>

        {/* Clipboard Actions */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] font-bold text-midGray uppercase tracking-wider">
            Copy to Clipboard
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center justify-between p-3 rounded-xl bg-bg hover:bg-surface border border-border text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Copy className="w-3.5 h-3.5 text-secondaryGray" />
                <span className="font-sans text-xs font-medium text-primaryDark">Copy Markdown</span>
              </div>
              {copiedFormat === 'markdown' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            </button>

            <button
              type="button"
              onClick={handleCopyJson}
              className="flex items-center justify-between p-3 rounded-xl bg-bg hover:bg-surface border border-border text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-secondaryGray" />
                <span className="font-sans text-xs font-medium text-primaryDark">Copy JSON</span>
              </div>
              {copiedFormat === 'json' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
