export type Lang = 'ar' | 'fr' | 'en';

export interface MatsyCourse {
  id: string;
  title: Record<Lang, string>;
  category: Record<Lang, string>;
  level: Record<Lang, string>;
  format: Record<Lang, string>;
  badge: Record<Lang, string>;
  image: string;
  imageAlt: Record<Lang, string>;
  tags: string[];
}

export const WHATSAPP_LINK = 'https://wa.me/213554275994';

export const matsyHeroImage = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1800&q=80';

export const matsyCourses: MatsyCourse[] = [
  {
    id: 'course-safety-agent',
    title: {
      ar: 'عون أمن ووقاية المؤسسات',
      fr: 'Agent de Sécurité et Prévention des Établissements',
      en: 'Workplace Safety & Prevention Agent',
    },
    category: {
      ar: 'أمن ووقاية',
      fr: 'Sécurité HSE',
      en: 'HSE Safety',
    },
    level: {
      ar: 'مبتدئ',
      fr: 'Débutant',
      en: 'Beginner',
    },
    format: {
      ar: 'تكوين عن بعد مسجل',
      fr: 'Formation en ligne enregistrée',
      en: 'Online Recorded',
    },
    badge: {
      ar: '🔥 عرض خاص',
      fr: '🔥 Promo',
      en: '🔥 Promo',
    },
    image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=1200&q=80',
    imageAlt: {
      ar: 'مسؤول أمن يرتدي معدات الوقاية في بيئة صناعية',
      fr: 'Agent de sécurité portant un équipement de protection en milieu industriel',
      en: 'Safety officer wearing protective equipment in an industrial environment',
    },
    tags: ['all', 'hse', 'certified', 'special'],
  },
  {
    id: 'course-safety-inspector',
    title: {
      ar: 'مفتش أمن ووقاية المؤسسات',
      fr: 'Inspecteur de Sécurité et Prévention des Établissements',
      en: 'Workplace Safety & Prevention Inspector',
    },
    category: {
      ar: 'أمن ووقاية',
      fr: 'Sécurité HSE',
      en: 'HSE Safety',
    },
    level: {
      ar: 'متوسط',
      fr: 'Intermédiaire',
      en: 'Intermediate',
    },
    format: {
      ar: 'تكوين عن بعد مسجل',
      fr: 'Formation en ligne enregistrée',
      en: 'Online Recorded',
    },
    badge: {
      ar: '⭐ الأكثر طلباً',
      fr: '⭐ Populaire',
      en: '⭐ Popular',
    },
    image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80',
    imageAlt: {
      ar: 'تفتيش سلامة مهنية داخل مؤسسة صناعية',
      fr: 'Inspection de sécurité professionnelle dans un établissement industriel',
      en: 'Professional workplace safety inspection in an industrial facility',
    },
    tags: ['all', 'hse', 'certified', 'special'],
  },
  {
    id: 'course-hajj-umrah-guide',
    title: {
      ar: 'المرشد المحترف للحج والعمرة',
      fr: 'Guide Professionnel du Hajj et Omra',
      en: 'Professional Hajj & Umrah Guide',
    },
    category: {
      ar: 'إرشاد ديني',
      fr: 'Guide Religieux',
      en: 'Religious Guidance',
    },
    level: {
      ar: 'جميع المستويات',
      fr: 'Tous niveaux',
      en: 'All Levels',
    },
    format: {
      ar: 'تكوين عن بعد مسجل',
      fr: 'Formation en ligne enregistrée',
      en: 'Online Recorded',
    },
    badge: {
      ar: '🎁 بونص: مشاركة في قرعة عمرة مجانية',
      fr: '🎁 Bonus: Participation au tirage Omra gratuite',
      en: '🎁 Bonus: Free Umrah Draw Participation',
    },
    image: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80',
    imageAlt: {
      ar: 'صورة للكعبة المشرفة والحجاج في المسجد الحرام',
      fr: 'Vue de la Kaaba et des pèlerins à Masjid al-Haram',
      en: 'View of the Kaaba and pilgrims at Masjid al-Haram',
    },
    tags: ['all', 'religious', 'certified', 'special'],
  },
];

export const matsyFilters: Array<{ id: string; label: Record<Lang, string> }> = [
  { id: 'all', label: { ar: 'الكل', fr: 'Tous', en: 'All' } },
  { id: 'hse', label: { ar: 'أمن ووقاية', fr: 'Sécurité HSE', en: 'HSE Safety' } },
  { id: 'religious', label: { ar: 'إرشاد ديني', fr: 'Guide Religieux', en: 'Religious Guidance' } },
  { id: 'certified', label: { ar: 'تكوين معتمد', fr: 'Formation Certifiée', en: 'Certified Training' } },
  { id: 'special', label: { ar: 'عروض خاصة', fr: 'Promotions', en: 'Special Offers' } },
];
