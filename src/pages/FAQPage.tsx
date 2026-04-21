import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HelpCircle, MessageCircle, Phone, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AnimatedSection from '@/components/AnimatedSection';
import { useTranslation } from '@/i18n';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
  const { t } = useTranslation();
  const { data: storeName } = useQuery({
    queryKey: ['store-name'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'store_name').maybeSingle();
      return data?.value || 'SloutionsHub';
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: whatsappNumber } = useQuery({
    queryKey: ['whatsapp-number'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'footer_phone').maybeSingle();
      return data?.value || '';
    },
    staleTime: 10 * 60 * 1000,
  });

  const displayName = storeName || 'SloutionsHub';
  const faqs = Array.from({ length: 10 }, (_, i) => ({
    question: t(`faq.items.${i + 1}.question`),
    answer: t(`faq.items.${i + 1}.answer`),
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27] via-[#1a1145] to-[#0d1440]" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]" />

        <div className="container relative z-10">
          <AnimatedSection>
            <div className="text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/30">
                <HelpCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="font-cairo font-black text-3xl md:text-4xl lg:text-5xl text-white mb-4">
                {t('faq.title')}
              </h1>
              <p className="text-violet-200/70 text-lg">
                {t('faq.subtitle')} {displayName}
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <AnimatedSection>
            <div className="bg-card border border-border/50 rounded-3xl overflow-hidden">
              <Accordion type="single" collapsible className="divide-y divide-border/50">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-0">
                    <AccordionTrigger className="px-6 py-5 text-right hover:no-underline hover:bg-muted/30 transition-colors group [&[data-state=open]>svg]:rotate-180">
                      <span className="font-semibold text-foreground text-base group-hover:text-violet-400 transition-colors text-right flex-1">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-5 text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Help / Contact Section */}
      <section className="py-12 md:py-20">
        <div className="container max-w-4xl">
          <AnimatedSection>
            <div className="bg-gradient-to-br from-card via-card to-violet-900/20 border border-border/50 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2" />

              <div className="relative z-10">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="font-cairo font-bold text-2xl md:text-3xl text-foreground mb-3">
                  {t('faq.help.title')}
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {t('faq.help.description')}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {whatsappNumber && (
                    <a
                      href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="lg" className="font-bold h-14 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 hover:shadow-2xl transition-all group">
                        <MessageCircle className="w-5 h-5 ml-2" />
                        {t('faq.help.whatsapp')}
                      </Button>
                    </a>
                  )}
                  <Link to="/about">
                    <Button size="lg" variant="outline" className="font-bold h-14 px-8 rounded-2xl border-border/50 hover:bg-muted/50 transition-all">
                      <Phone className="w-5 h-5 ml-2" />
                      {t('faq.help.callSupport')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16">
        <div className="container text-center">
          <AnimatedSection>
            <h2 className="font-cairo font-bold text-2xl md:text-3xl text-foreground mb-4">
              {t('faq.cta.title')}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {t('faq.cta.description')}
            </p>
            <Link to="/products">
              <Button size="lg" className="font-bold h-14 px-10 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-xl shadow-violet-500/30 transition-all group">
                {t('faq.cta.button')}
                <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
