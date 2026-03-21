import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { type MatsyCourse, WHATSAPP_LINK, type Lang } from '@/data/matsyCourses';

interface Props {
  course: MatsyCourse;
}

export default function CourseCard({ course }: Props) {
  const { language } = useTranslation();
  const lang = language as Lang;

  const cta = lang === 'ar' ? 'سجّل الآن' : lang === 'fr' ? "S'inscrire" : 'Enroll Now';
  const onlineTag = lang === 'ar' ? 'عن بعد' : lang === 'fr' ? 'En ligne' : 'Online';
  const contactPrice = lang === 'ar' ? 'اتصل بنا للسعر' : lang === 'fr' ? 'Contactez-nous' : 'Contact for Price';
  const whatsappLabel = lang === 'ar' ? 'واتساب' : 'WhatsApp';

  return (
    <article className="group overflow-hidden rounded-3xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={course.image}
          alt={course.imageAlt[lang]}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <div className="absolute top-3 right-3">
          <Badge className="font-cairo bg-[#C9971C] text-black hover:bg-[#C9971C]">{course.category[lang]}</Badge>
        </div>
        <div className="absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-cairo text-white" style={{ backgroundColor: '#9B1C2E' }}>
          {course.badge[lang]}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <h3 className="font-cairo text-base font-bold leading-relaxed line-clamp-2 min-h-[3.3rem]">
          {course.title[lang]}
        </h3>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-cairo">{onlineTag}</Badge>
          <Badge variant="outline" className="font-cairo">{course.level[lang]}</Badge>
        </div>

        <p className="font-cairo text-sm text-muted-foreground">{course.format[lang]}</p>

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <span className="font-cairo text-sm font-semibold text-primary">{contactPrice}</span>
          <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="inline-flex">
            <Button size="sm" variant="outline" className="font-cairo gap-1.5">
              <MessageCircle className="w-4 h-4" /> {whatsappLabel}
            </Button>
          </a>
        </div>

        <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="block">
          <Button className="w-full font-cairo">{cta}</Button>
        </a>
      </div>
    </article>
  );
}
