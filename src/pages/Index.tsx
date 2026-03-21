import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import CourseCard from '@/components/CourseCard';
import { matsyCourses, matsyHeroImage, type Lang } from '@/data/matsyCourses';
import { useTranslation } from '@/i18n';

const testimonials = [
  {
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    name: { ar: 'آية بن سالم', fr: 'Aya Ben Salem', en: 'Aya Ben Salem' },
    text: {
      ar: 'منصة منظمة جداً، والمحتوى واضح وسهل التطبيق.',
      fr: 'Plateforme très bien organisée, contenu clair et pratique.',
      en: 'Very well organized platform with clear and practical content.',
    },
  },
  {
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    name: { ar: 'محمد الأمين', fr: 'Mohamed El Amine', en: 'Mohamed El Amine' },
    text: {
      ar: 'الدورات المهنية ساعدتني مباشرة في العمل.',
      fr: 'Les formations professionnelles m’ont aidé directement au travail.',
      en: 'The professional courses helped me directly at work.',
    },
  },
  {
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    name: { ar: 'خديجة موساوي', fr: 'Khadidja Moussaoui', en: 'Khadidja Moussaoui' },
    text: {
      ar: 'تجربة تعلم رائعة مع متابعة ممتازة.',
      fr: 'Excellente expérience d’apprentissage avec un très bon suivi.',
      en: 'Excellent learning experience with great follow-up.',
    },
  },
];

export default function IndexPage() {
  const { language } = useTranslation();
  const lang = language as Lang;

  const heroTitle =
    lang === 'ar'
      ? 'أكاديمية مايسي للتدريب و التطوير'
      : lang === 'fr'
      ? 'Matsy Academy Formation & Développement'
      : 'Matsy Academy Training & Development';

  const heroSubtitle =
    lang === 'ar'
      ? 'تكوين مهني معتمد في الأمن والوقاية والإرشاد الديني عن بعد'
      : lang === 'fr'
      ? 'Formations professionnelles certifiées en sécurité et guide religieux, 100% en ligne'
      : 'Certified professional training in safety and religious guidance, fully online';

  const featuredTitle =
    lang === 'ar' ? 'الدورات المميزة' : lang === 'fr' ? 'Formations en vedette' : 'Featured Courses';

  const exploreCourses =
    lang === 'ar' ? 'استكشف الدورات' : lang === 'fr' ? 'Découvrir les formations' : 'Explore Courses';

  const enrollNow = lang === 'ar' ? 'سجّل الآن' : lang === 'fr' ? "S'inscrire" : 'Enroll Now';

  const heroAlt =
    lang === 'ar'
      ? 'طلاب في حفل تخرج أكاديمي'
      : lang === 'fr'
      ? 'Étudiants lors d’une cérémonie de remise de diplômes'
      : 'Students at an academic graduation ceremony';

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden">
        <img src={matsyHeroImage} alt={heroAlt} className="h-[60vh] w-full object-cover" />
        <div className="absolute inset-0 bg-[#1E1E1E]/70" />
        <div className="container absolute inset-0 flex flex-col items-center justify-center text-center text-white">
          <h1 className="font-cairo text-3xl sm:text-5xl font-black leading-tight">{heroTitle}</h1>
          <p className="mt-4 max-w-3xl font-cairo text-sm sm:text-lg text-white/85">{heroSubtitle}</p>
          <div className="mt-6 flex gap-3">
            <Link to="/products"><Button className="font-cairo">{exploreCourses}</Button></Link>
            <Link to="/products"><Button variant="outline" className="font-cairo bg-white/10 text-white border-white/50">{enrollNow}</Button></Link>
          </div>
        </div>
      </section>

      <section className="container py-12 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-cairo text-2xl font-black">{featuredTitle}</h2>
          <Link to="/products"><Button variant="outline" className="font-cairo">{exploreCourses}</Button></Link>
        </div>

        <div className="marquee-rtl">
          <div className="marquee-rtl-track">
            {[...matsyCourses, ...matsyCourses].map((course, i) => (
              <div key={`${course.id}-${i}`} className="w-[320px] shrink-0">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-10">
        <h3 className="font-cairo text-xl font-bold mb-4">
          {lang === 'ar' ? 'آراء المتدربين' : lang === 'fr' ? 'Témoignages' : 'Student Testimonials'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map(item => (
            <div key={item.name.en} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <img src={item.avatar} alt={item.name[lang]} className="w-12 h-12 rounded-full object-cover" />
                <p className="font-cairo font-semibold">{item.name[lang]}</p>
              </div>
              <p className="font-cairo text-sm text-muted-foreground leading-relaxed">{item.text[lang]}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
