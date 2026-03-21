import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import CourseCard from '@/components/CourseCard';
import { matsyCourses, matsyFilters, type Lang } from '@/data/matsyCourses';
import { useTranslation } from '@/i18n';

export default function ProductsPage() {
  const { language } = useTranslation();
  const lang = language as Lang;

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const title = lang === 'ar' ? 'دورات أكاديمية مايسي' : lang === 'fr' ? 'Formations Matsy Academy' : 'Matsy Academy Courses';
  const subtitle =
    lang === 'ar'
      ? 'اختر الدورة المناسبة لك وابدأ التكوين عن بعد'
      : lang === 'fr'
      ? 'Choisissez la formation qui vous convient et commencez en ligne'
      : 'Choose the course that fits you and start learning online';

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return matsyCourses.filter(course => {
      const matchesFilter = activeFilter === 'all' || course.tags.includes(activeFilter);
      if (!matchesFilter) return false;
      if (!normalizedSearch) return true;
      const titleMatch = course.title[lang].toLowerCase().includes(normalizedSearch);
      const categoryMatch = course.category[lang].toLowerCase().includes(normalizedSearch);
      return titleMatch || categoryMatch;
    });
  }, [activeFilter, search, lang]);

  const clear = lang === 'ar' ? 'مسح' : lang === 'fr' ? 'Effacer' : 'Clear';
  const noData =
    lang === 'ar'
      ? 'لا توجد دورات مطابقة'
      : lang === 'fr'
      ? 'Aucune formation correspondante'
      : 'No matching courses';

  return (
    <div className="container py-10 space-y-8">
      <header className="space-y-3">
        <h1 className="font-cairo text-3xl font-black">{title}</h1>
        <p className="font-cairo text-muted-foreground">{subtitle}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
        <aside className="space-y-4 rounded-2xl border bg-card p-4 h-fit sticky top-20">
          <h2 className="font-cairo font-bold">
            {lang === 'ar' ? 'الفلاتر' : lang === 'fr' ? 'Filtres' : 'Filters'}
          </h2>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'ابحث عن دورة...' : lang === 'fr' ? 'Rechercher une formation...' : 'Search courses...'}
              className="pr-10 font-cairo"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {matsyFilters.map(filter => (
              <Button
                key={filter.id}
                size="sm"
                variant={activeFilter === filter.id ? 'default' : 'outline'}
                className="font-cairo rounded-full"
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label[lang]}
              </Button>
            ))}
          </div>

          {(search || activeFilter !== 'all') && (
            <Button variant="ghost" className="font-cairo" onClick={() => { setSearch(''); setActiveFilter('all'); }}>
              {clear}
            </Button>
          )}
        </aside>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-cairo text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{filteredCourses.length}</span>{' '}
              {lang === 'ar' ? 'دورات' : lang === 'fr' ? 'formations' : 'courses'}
            </p>
            <Badge className="font-cairo bg-[#C9971C] text-black hover:bg-[#C9971C]">
              {lang === 'ar' ? 'أكاديمية مايسي للتدريب و التطوير' : 'Matsy Academy'}
            </Badge>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center font-cairo text-muted-foreground">{noData}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredCourses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
