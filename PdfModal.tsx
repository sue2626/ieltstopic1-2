import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';
import { TopicId } from '../types/vocab';
import { TOPIC_INFO } from '../data/allVocab';

interface PdfModalProps {
  topic: TopicId;
  onClose: () => void;
}

export const PdfModal: React.FC<PdfModalProps> = ({ topic, onClose }) => {
  const currentInfo = TOPIC_INFO[topic];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/70 dark:bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-5xl h-[88vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                Tài Liệu Gốc: {currentInfo.title} ({currentInfo.subtitle})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đối chiếu trực tiếp với file PDF gốc được đính kèm.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={currentInfo.pdfUrl}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Tải PDF gốc</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded PDF iframe */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2">
          <iframe
            src={currentInfo.pdfUrl}
            className="w-full h-full rounded-2xl border border-slate-300 dark:border-slate-800 bg-white"
            title={currentInfo.title}
          />
        </div>
      </div>
    </div>
  );
};
