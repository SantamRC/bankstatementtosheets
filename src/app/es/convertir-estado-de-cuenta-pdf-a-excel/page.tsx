import type { Metadata } from "next";
import Link from "next/link";
import { HREFLANG, pageMeta } from "@/lib/seo/meta";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FinalCTA } from "@/components/landing/Sections";
import { StatementPreview } from "@/components/seo/StatementPreview";
import { Breadcrumbs, Faq, Points, Section, SeoHero, Steps } from "@/components/seo/Blocks";
import { FREE_PAGES } from "@/lib/plans";
import type { BankLayout } from "@/lib/seo/banks";

const path = HREFLANG.excel["es-MX"];

export const metadata: Metadata = pageMeta({
  title: "Convertir estado de cuenta PDF a Excel — verificado al centavo",
  description: `Convierte tu estado de cuenta bancario o de tarjeta en PDF a Excel, CSV o Google Sheets en segundos. Cada movimiento se verifica contra el saldo del estado de cuenta. ${FREE_PAGES} páginas gratis.`,
  path,
  absoluteTitle: true,
  languages: HREFLANG.excel,
  locale: "es_MX",
});

// Typical Mexican statement layout (columns vary by bank and account type).
const MX_LAYOUT: BankLayout = {
  cols: [
    { key: "date", label: "FECHA" },
    { key: "desc", label: "DESCRIPCIÓN" },
    { key: "ref", label: "REFERENCIA" },
    { key: "out", label: "CARGOS" },
    { key: "in", label: "ABONOS" },
    { key: "balance", label: "SALDO" },
  ],
  dateFmt: "DD/MES",
  balance: "every",
};

export default function Page() {
  return (
    <>
      <Navbar />
      <main lang="es">
        <Breadcrumbs home="Inicio" items={[["Estado de cuenta a Excel", path]]} />
        <SeoHero
          eyebrow="Estado de cuenta PDF a Excel"
          title="Convierte tu estado de cuenta a Excel,"
          accent="verificado al centavo."
          intro="Sube el PDF de tu estado de cuenta bancario o de tarjeta de crédito y descarga un Excel limpio: fechas reales, cargos y abonos en columnas separadas y cada movimiento comprobado contra el saldo que imprime tu banco."
          cta={{ primary: "Convertir gratis", secondary: "Ver precios", perks: [`${FREE_PAGES} páginas gratis`, "Sin tarjeta", "No guardamos tus PDF"] }}
        />

        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <StatementPreview region="mx" layout={MX_LAYOUT} bankName="banco" lang="es" />
          <p className="mt-3 text-center text-xs text-muted">Ejemplo ficticio. Funciona con el formato de cualquier banco, digital o escaneado.</p>
        </section>

        <Section kicker="Qué obtienes" title="Un Excel listo para usar">
          <Points
            items={[
              ["Hoja de movimientos", "Fecha, concepto, referencia, categoría, cargo, abono, importe con signo y saldo. Fechas y números reales de Excel, con filtros activados."],
              ["Resumen y categorías", "Saldo inicial y final, total de cargos y abonos, y totales por categoría con fórmulas SUMAR.SI.CONJUNTO que se actualizan solas."],
              ["Referencias SPEI separadas", "Las descripciones largas se limpian: el nombre del beneficiario queda legible y la clave de rastreo o referencia pasa a su propia columna."],
            ]}
          />
        </Section>

        <Section kicker="Cómo funciona" title="Tres pasos, alrededor de un minuto">
          <Steps
            steps={[
              "Descarga el estado de cuenta en PDF desde la banca en línea o la app de tu banco (o usa el que te llegó por correo).",
              "Súbelo al convertidor. La IA lee cada página, incluso escaneos, y verifica cada movimiento contra el saldo.",
              "Revisa y corrige en pantalla si hace falta, y descarga Excel o CSV, o envíalo a Google Sheets.",
            ]}
          />
        </Section>

        <Section kicker="La diferencia" title="Otros convertidores adivinan. Nosotros verificamos.">
          <div className="max-w-3xl space-y-4 leading-relaxed text-ink-soft">
            <p>
              Un convertidor genérico de PDF a Excel copia la tabla tal cual: si se salta un renglón o confunde un cargo con un abono, no te enteras
              hasta que la conciliación no cuadra. Nosotros sumamos cada movimiento y lo comparamos con el saldo que imprime tu banco. Si algo no
              cuadra, te mostramos exactamente qué renglón revisar. Cuando un solo movimiento tiene el cargo y el abono invertidos, lo corregimos solos.
            </p>
            <p>
              Funciona con estados de cuenta de cualquier banco de México y de otros países (por ejemplo BBVA, Banorte, Santander, Banamex, HSBC,
              Scotiabank o Banco Azteca), de cuentas de cheques, débito, ahorro y tarjetas de crédito. No usamos plantillas por banco: un modelo de
              IA lee la página como lo haría una persona. Los nombres de los bancos son marcas de sus dueños; no estamos afiliados a ninguno.
            </p>
            <p>
              <strong className="text-ink">Privacidad:</strong> procesamos tu PDF en memoria y nunca lo guardamos. La tabla extraída se borra a los
              30 días o cuando tú la borres.
            </p>
            <p className="text-sm text-muted">
              Nota: la aplicación todavía está en inglés y los precios se muestran en dólares. Tus descripciones se conservan en español, tal como
              aparecen en el estado de cuenta.
            </p>
          </div>
        </Section>

        <Faq
          title="Preguntas frecuentes"
          items={[
            ["¿Cómo convierto un estado de cuenta PDF a Excel?", "Sube el PDF al convertidor, espera unos segundos a que se extraigan y verifiquen los movimientos, revisa la tabla y descarga el archivo .xlsx. No necesitas instalar nada."],
            ["¿Funciona con estados de cuenta escaneados?", "Sí. Un modelo de IA lee la imagen de cada página, así que también funcionan escaneos y PDF sin texto seleccionable."],
            ["¿Puedo convertir un estado de cuenta de tarjeta de crédito?", "Sí. Las compras y comisiones quedan como cargos y los pagos y bonificaciones como abonos."],
            ["¿Cuánto cuesta?", `Las primeras ${FREE_PAGES} páginas son gratis, sin tarjeta. Después hay planes mensuales desde 9 USD por 150 páginas, o paquetes de 100 páginas que no caducan.`],
            ["¿Puedo convertir varios meses a la vez?", "Sí. Sube varios PDF juntos; cada uno se convierte y verifica por separado y puedes exportarlos en un solo Excel."],
            ["¿Es seguro subir mi estado de cuenta?", "Tu PDF se procesa en memoria y nunca se guarda. Solo conservamos la tabla extraída, que se borra a los 30 días o cuando tú quieras."],
          ]}
        />
        <section className="mx-auto max-w-6xl px-4 pb-10 text-center text-sm text-muted sm:px-6">
          <Link href="/bank-statement-to-excel" hrefLang="en" className="text-brand underline-offset-2 hover:underline">Read this page in English</Link>
        </section>
        <FinalCTA
          t={{
            title: "Deja de capturar estados de cuenta a mano.",
            accent: "Empieza a conciliar.",
            body: `Tus primeras ${FREE_PAGES} páginas son gratis. Sin tarjeta y sin llamadas de ventas: solo sube un PDF.`,
            cta: "Convertir gratis",
          }}
        />
      </main>
      <Footer />
    </>
  );
}
