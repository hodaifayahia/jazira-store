import { ShieldCheck, Users, BookOpen, Layers } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { Lang } from '@/data/matsyCourses';

export default function AboutPage() {
  const { language } = useTranslation();
  const lang = language as Lang;

  const title =
    lang === 'ar' ? 'من نحن' : lang === 'fr' ? 'À propos de nous' : 'About Us';

  const academyName =
    lang === 'ar'
      ? 'أكاديمية مايسي للتدريب و التطوير'
      : lang === 'fr'
      ? 'Matsy Academy Formation & Développement'
      : 'Matsy Academy Training & Development';

  const intro =
    lang === 'ar'
      ? 'نقدم تكويناً احترافياً عن بعد في مجالات الأمن والوقاية والإرشاد الديني، بمحتوى عملي وشهادات معتمدة.'
      : lang === 'fr'
      ? 'Nous proposons des formations professionnelles à distance en sécurité, prévention et guide religieux avec contenu pratique et certification.'
      : 'We provide professional online training in safety, prevention, and religious guidance with practical content and certified pathways.';

  const stats = [
    {
      icon: Users,
      value: '+500',
      label: lang === 'ar' ? 'طالب مسجّل' : lang === 'fr' ? 'Étudiants inscrits' : 'Enrolled Students',
    },
    {
      icon: BookOpen,
      value: '3',
      label: lang === 'ar' ? 'دورات معتمدة' : lang === 'fr' ? 'Formations certifiées' : 'Certified Courses',
    },
    {
      icon: Layers,
      value: '2',
      label: lang === 'ar' ? 'مجال تخصص' : lang === 'fr' ? 'Domaines' : 'Specialization Fields',
    },
  ];

  const accreditation =
    lang === 'ar'
      ? 'مرخصة من وزارة التكوين المهني'
      : lang === 'fr'
      ? 'Agréée par le Ministère de la Formation Professionnelle'
      : 'Accredited by the Ministry of Vocational Training';

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container text-center space-y-4">
          <h1 className="font-cairo text-4xl font-black">{title}</h1>
          <h2 className="font-cairo text-xl font-bold text-primary">{academyName}</h2>
          <p className="font-cairo max-w-3xl mx-auto text-muted-foreground leading-relaxed">{intro}</p>
        </div>
      </section>

      <section className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map(item => (
            <div key={item.label} className="rounded-2xl border bg-card p-5 text-center">
              <item.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="font-roboto text-3xl font-black text-foreground">{item.value}</p>
              <p className="font-cairo text-sm text-muted-foreground mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-16">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
          <p className="font-cairo font-semibold text-foreground">{accreditation}</p>
        </div>
      </section>
    </div>
  );
}
