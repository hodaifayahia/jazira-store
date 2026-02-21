import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/i18n';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  name: string;
}

export default function DocumentViewer({ open, onOpenChange, url, name }: Props) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const isPdf = /\.pdf$/i.test(name || url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl h-[80vh] sm:h-[85vh] flex flex-col p-0 gap-0">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
          <span className="font-cairo text-sm font-medium truncate max-w-[300px]">{name}</span>
          <div className="flex items-center gap-2">
            {!isPdf && (
              <>
                <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} aria-label="Zoom out">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="font-roboto text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(3, z + 0.25))} aria-label="Zoom in">
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" asChild aria-label="Download">
              <a href={url} download={name} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 p-4">
          {isPdf ? (
            <iframe src={url} className="w-full h-full rounded-lg border" title={name} />
          ) : (
            <img
              src={url}
              alt={name}
              className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
