import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AnnouncementBar() {
  const { data } = useQuery({
    queryKey: ['announcement-bar'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('*').in('key', [
        'announcements_enabled', 'announcement_1', 'announcement_2', 'announcement_3', 'announcement_4'
      ]);
      const map: Record<string, string> = {};
      data?.forEach(s => { map[s.key] = s.value || ''; });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const enabled = data?.announcements_enabled === 'true';
  const texts = [data?.announcement_1, data?.announcement_2, data?.announcement_3, data?.announcement_4]
    .filter((t): t is string => !!t && t.trim().length > 0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (texts.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % texts.length);
        setVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, [texts.length]);

  if (!enabled || texts.length === 0) return null;

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="container py-2 text-center">
        <p
          className={`font-cairo text-sm font-medium transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          {texts[currentIndex]}
        </p>
      </div>
    </div>
  );
}
