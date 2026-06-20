import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/sections/contact-form";
import { Mail, MapPin, Phone } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  return {
    title: `${t("contact")} | MERNcrest Solutions`,
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <div className="container-wide section-padding pt-32 min-h-screen">
      <div className="text-center max-w-2xl mx-auto mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent/5 blur-[100px] rounded-full pointer-events-none -z-10" />
        
        <p className="text-accent font-mono text-sm uppercase tracking-wider mb-3">
          Get In Touch
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 font-display text-balance">
          Let's Build Something Great Together
        </h1>
        <p className="text-muted text-lg">
          Whether you have a question, a project idea, or just want to say hi, we'll try our best to get back to you!
        </p>
      </div>

      <div className="glass-card rounded-[2.5rem] overflow-hidden border border-black/5 dark:border-white/5 shadow-2xl relative z-10 flex flex-col lg:flex-row">
        
        {/* Contact Information */}
        <div className="lg:w-2/5 p-10 lg:p-14 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-800 to-purple-900 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/30 blur-[80px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/30 blur-[80px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3" />
          
          <div className="relative z-10">
            <h3 className="text-3xl font-bold mb-8 text-white">Contact Information</h3>
            
            <div className="space-y-8">
              <div className="flex items-start gap-5 group">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 group-hover:scale-110 transition-all">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Our Office</h4>
                  <p className="text-white/70 mt-1 leading-relaxed">87/B Galle Road Kollupity ,<br />Colombo 003, Sri Lanka</p>
                </div>
              </div>
              
              <div className="flex items-start gap-5 group">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 group-hover:scale-110 transition-all">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Email Us</h4>
                  <p className="text-white/70 mt-1 leading-relaxed">merncrestsolution@gmail.com<br />support@merncrest.lk</p>
                </div>
              </div>

              <div className="flex items-start gap-5 group">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 group-hover:scale-110 transition-all">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Call Us</h4>
                  <p className="text-white/70 mt-1 leading-relaxed">+94 713838638</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:w-3/5 p-10 lg:p-14 bg-background/50 dark:bg-black/20 relative">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/5 blur-[50px] rounded-full pointer-events-none" />
          <h3 className="text-3xl font-bold mb-8">Send us a message</h3>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
