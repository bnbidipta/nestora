import ContactForm from '@/components/ContactForm';

export const metadata = { title: 'Contact · Nestora' };

export default function Page() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10 text-ink">
      <a href="/" className="font-display text-lg text-ink">Nestora</a>
      <h1 className="mt-8 text-4xl">Contact us</h1>
      <p className="mt-3 text-muted">A question, a problem, or you&apos;re an architect who&apos;d like to review designs? Write to us here.</p>
      <ContactForm />
    </main>
  );
}
