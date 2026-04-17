import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';

import { useTranslation } from '../../../i18n/useTranslation';
import { Icons } from '../../../shared/components/ui/Icons';

type LocalizedText = {
  th: string;
  en: string;
};

type Benefit = {
  id: string;
  number: string;
  title: LocalizedText;
  shortTitle: LocalizedText;
  problem: LocalizedText[];
  support: LocalizedText[];
  outcome: LocalizedText[];
  accent: string;
  featured?: boolean;
};

const metrics = [
  {
    value: '10-30 นาที',
    enValue: '10-30 min',
    label: { th: 'เวลาค้นหาเอกสารเดิม', en: 'Typical document search time' },
    result: { th: 'เหลือไม่กี่วินาที', en: 'Reduced to seconds' },
  },
  {
    value: 'PDF จริง',
    enValue: 'Real PDF',
    label: { th: 'ลายเซ็นถูกฝังในไฟล์', en: 'Signature applied to file' },
    result: { th: 'ไม่ใช่แค่ log ในฐานข้อมูล', en: 'Not just a database log' },
  },
  {
    value: 'Audit Trail',
    enValue: 'Audit Trail',
    label: { th: 'ตรวจสอบย้อนหลังได้', en: 'Traceable governance' },
    result: { th: 'รองรับ compliance', en: 'Compliance-ready visibility' },
  },
];

const summaryCards = [
  {
    title: { th: 'เร็วขึ้น', en: 'Faster' },
    detail: { th: 'ค้นหา อนุมัติ และลงนามได้ใน flow เดียว', en: 'Search, approve, and sign in one flow.' },
  },
  {
    title: { th: 'ผิดพลาดน้อยลง', en: 'Fewer mistakes' },
    detail: { th: 'รู้เวอร์ชันล่าสุด ลดเอกสารซ้ำ ลดการใช้ไฟล์ผิด', en: 'Know the latest version and avoid duplicate work.' },
  },
  {
    title: { th: 'ตรวจสอบได้', en: 'Traceable' },
    detail: { th: 'เห็นประวัติผู้แก้ไข ผู้อนุมัติ และผู้ลงนาม', en: 'Track editors, approvers, signers, and actions.' },
  },
];

const benefits: Benefit[] = [
  {
    id: 'productivity',
    number: '01',
    title: {
      th: 'เพิ่มประสิทธิภาพในการทำงาน',
      en: 'Productivity',
    },
    shortTitle: { th: 'ค้นหาเร็วขึ้น', en: 'Faster work' },
    problem: [
      { th: 'ใช้เวลานานในการค้นหาเอกสาร', en: 'Teams spend too much time finding documents.' },
      { th: 'เอกสารกระจายอยู่หลายแหล่ง', en: 'Files are scattered across disconnected locations.' },
      { th: 'ต้องเปิดอ่านหลายไฟล์เพื่อหาข้อมูล', en: 'Users must open many files to find one answer.' },
    ],
    support: [
      { th: 'รวมเอกสารไว้ในศูนย์กลางเดียว', en: 'Documents are centralized in one governed workspace.' },
      { th: 'ค้นหาเอกสารได้รวดเร็ว', en: 'Search is available through metadata and filters.' },
      { th: 'เข้าถึงข้อมูลได้ทันที', en: 'Users can reach the right document immediately.' },
    ],
    outcome: [
      { th: 'ลดเวลาในการค้นหาจาก 10-30 นาที เหลือเพียงไม่กี่วินาที', en: 'Search time drops from 10-30 minutes to seconds.' },
      { th: 'เพิ่มความเร็วในการทำงานของทีม', en: 'Teams move faster through daily document work.' },
      { th: 'ลดเวลาที่สูญเสียไปกับงานที่ไม่จำเป็น', en: 'Less time is lost to low-value document chasing.' },
    ],
    accent: 'var(--color-role-controller)',
  },
  {
    id: 'duplication',
    number: '02',
    title: {
      th: 'ลดงานซ้ำซ้อน',
      en: 'Duplication Reduction',
    },
    shortTitle: { th: 'ลดการทำซ้ำ', en: 'Less duplication' },
    problem: [
      { th: 'ไม่ทราบว่ามีเอกสารเดิมอยู่แล้ว', en: 'Users do not know whether a document already exists.' },
      { th: 'ต้องสร้าง proposal หรือ report ซ้ำ', en: 'Teams recreate proposals or reports unnecessarily.' },
    ],
    support: [
      { th: 'ค้นหาเอกสารเดิมได้ง่าย', en: 'Existing documents are easier to discover.' },
      { th: 'มีระบบจัดหมวดหมู่และ tag', en: 'Categories and tags make reuse practical.' },
      { th: 'นำข้อมูลเดิมกลับมาใช้ซ้ำได้', en: 'Past knowledge can be reused safely.' },
    ],
    outcome: [
      { th: 'ลดการสร้างเอกสารซ้ำ', en: 'Duplicate document creation decreases.' },
      { th: 'ลดภาระงานของทีม', en: 'Teams avoid repeated manual work.' },
      { th: 'เพิ่มประสิทธิภาพในการทำงานร่วมกัน', en: 'Collaboration becomes more consistent.' },
    ],
    accent: 'var(--color-secondary)',
  },
  {
    id: 'accuracy',
    number: '03',
    title: {
      th: 'ความถูกต้องของข้อมูลและเวอร์ชัน',
      en: 'Data Accuracy & Version Control',
    },
    shortTitle: { th: 'ใช้เวอร์ชันถูกต้อง', en: 'Correct version' },
    problem: [
      { th: 'ใช้เอกสารเวอร์ชันผิด', en: 'People use the wrong document version.' },
      { th: 'ไม่ทราบว่าไฟล์ใดเป็นเวอร์ชันล่าสุด', en: 'The latest version is unclear.' },
      { th: 'ไม่มีประวัติการเปลี่ยนแปลง', en: 'Change history is not visible.' },
    ],
    support: [
      { th: 'มีระบบ Version Control', en: 'Version control is built into the document lifecycle.' },
      { th: 'แสดงเวอร์ชันปัจจุบันชัดเจน', en: 'The current version is clear.' },
      { th: 'ดูประวัติและย้อนกลับเวอร์ชันได้', en: 'History and rollback are supported.' },
    ],
    outcome: [
      { th: 'ลดความผิดพลาดจากมนุษย์', en: 'Human error is reduced.' },
      { th: 'เพิ่มความน่าเชื่อถือของข้อมูล', en: 'Information becomes more reliable.' },
      { th: 'สนับสนุนการตัดสินใจที่แม่นยำ', en: 'Decisions are based on the right source.' },
    ],
    accent: 'var(--color-role-manager)',
  },
  {
    id: 'control',
    number: '04',
    title: {
      th: 'การควบคุมเอกสารและการตรวจสอบ',
      en: 'Document Control & Audit',
    },
    shortTitle: { th: 'ตรวจสอบได้', en: 'Traceable control' },
    problem: [
      { th: 'ไม่สามารถตรวจสอบได้ว่าใครแก้ไขอะไร', en: 'It is difficult to know who changed what.' },
      { th: 'ไม่มี audit trail', en: 'Audit trails are missing.' },
      { th: 'ยากต่อการตรวจสอบย้อนหลัง', en: 'Historical review takes too much effort.' },
    ],
    support: [
      { th: 'บันทึกประวัติการใช้งาน', en: 'Important actions are recorded.' },
      { th: 'ติดตามการเปลี่ยนแปลงของเอกสาร', en: 'Document changes are tracked.' },
      { th: 'ตรวจสอบการทำงานย้อนหลังได้', en: 'Operations can be reviewed later.' },
    ],
    outcome: [
      { th: 'เพิ่มความโปร่งใสในการทำงาน', en: 'Operational transparency improves.' },
      { th: 'รองรับการตรวจสอบและ compliance', en: 'Compliance review is easier.' },
      { th: 'เพิ่มความน่าเชื่อถือของระบบ', en: 'System trust increases.' },
    ],
    accent: 'var(--color-role-admin)',
  },
  {
    id: 'signature',
    number: '05',
    title: {
      th: 'การลงลายเซ็นดิจิทัล',
      en: 'Digital Signature',
    },
    shortTitle: { th: 'จุดเด่นหลัก', en: 'Signature proof' },
    problem: [
      { th: 'ต้องพิมพ์เอกสารเพื่อเซ็น', en: 'Documents must be printed for signing.' },
      { th: 'ต้อง scan เอกสารกลับเข้าระบบ', en: 'Signed documents must be scanned back.' },
      { th: 'ติดตามสถานะการลงนามได้ยาก', en: 'Signature status is hard to track.' },
    ],
    support: [
      { th: 'ลงลายเซ็นในไฟล์ PDF จริง', en: 'Signatures are applied to the real PDF file.' },
      { th: 'กำหนดผู้ลงนามและตำแหน่งลายเซ็นได้', en: 'Signers and visible placement are configurable.' },
      { th: 'ตรวจสอบได้ว่าใครลงนามและเมื่อใด', en: 'The system records who signed and when.' },
    ],
    outcome: [
      { th: 'ลดขั้นตอน print และ scan', en: 'Print and scan steps are removed.' },
      { th: 'ลดเวลาในกระบวนการอนุมัติ', en: 'Approval cycles become faster.' },
      { th: 'เพิ่มความถูกต้องและความโปร่งใส', en: 'Accuracy and transparency improve.' },
    ],
    accent: 'var(--color-role-signer)',
    featured: true,
  },
  {
    id: 'workflow',
    number: '06',
    title: {
      th: 'เพิ่มความเร็วของ Workflow',
      en: 'Workflow Speed',
    },
    shortTitle: { th: 'อนุมัติเร็วขึ้น', en: 'Faster cycles' },
    problem: [
      { th: 'กระบวนการอนุมัติล่าช้า', en: 'Approval processes are slow.' },
      { th: 'การทำงานเป็นลำดับใช้เวลานาน', en: 'Sequential work takes too long.' },
    ],
    support: [
      { th: 'อนุมัติเอกสารผ่านระบบออนไลน์', en: 'Documents can be approved online.' },
      { th: 'ลงนามเอกสารได้ทันที', en: 'Assigned users can sign immediately.' },
      { th: 'ไม่ต้องใช้เอกสารกระดาษ', en: 'Paper movement is removed.' },
    ],
    outcome: [
      { th: 'ลดระยะเวลาในวงจรเอกสาร', en: 'Document cycle time decreases.' },
      { th: 'เร่งกระบวนการตัดสินใจ', en: 'Decision-making moves faster.' },
      { th: 'เพิ่มความคล่องตัวในการทำงาน', en: 'Teams gain operational agility.' },
    ],
    accent: 'var(--color-primary)',
  },
  {
    id: 'knowledge',
    number: '07',
    title: {
      th: 'การจัดการองค์ความรู้',
      en: 'Knowledge Management',
    },
    shortTitle: { th: 'รักษาความรู้', en: 'Retain knowledge' },
    problem: [
      { th: 'ความรู้กระจายอยู่ในหลายที่', en: 'Knowledge is scattered across many locations.' },
      { th: 'เสี่ยงต่อการสูญเสียความรู้เมื่อพนักงานลาออก', en: 'Knowledge can disappear when people leave.' },
    ],
    support: [
      { th: 'เก็บเอกสารเป็นศูนย์กลางความรู้', en: 'Documents become a central knowledge base.' },
      { th: 'ค้นหาและใช้งานข้อมูลย้อนหลังได้', en: 'Historical information stays searchable.' },
      { th: 'จัดโครงสร้างข้อมูลอย่างเป็นระบบ', en: 'Information is structured consistently.' },
    ],
    outcome: [
      { th: 'เก็บรักษาองค์ความรู้ขององค์กร', en: 'Organizational knowledge is retained.' },
      { th: 'ลดการพึ่งพาบุคคล', en: 'Teams depend less on individuals.' },
      { th: 'สนับสนุนการเรียนรู้ในองค์กร', en: 'Internal learning becomes easier.' },
    ],
    accent: 'var(--color-role-viewer)',
  },
];

export function ImpactBenefitPage() {
  const { language } = useTranslation();
  const lang = language === 'en' ? 'en' : 'th';
  const featuredBenefit = benefits.find((benefit) => benefit.featured) ?? benefits[0];

  return (
    <main className="impact-page impact-page--public">
      <nav className="impact-public-nav" aria-label="Impact page navigation">
        <Link className="impact-public-nav__brand" to="/impact-benefit">
          <span>ID</span>
          <strong>InsightDocs</strong>
        </Link>
        <Link className="button button--secondary" to="/login">
          {lang === 'th' ? 'เข้าสู่ระบบเดโม' : 'Demo login'}
        </Link>
      </nav>

      <div className="impact-hero">
        <div className="impact-hero__copy">
          <span className="sidebar__eyebrow">Impact & Benefit</span>
          <h1>
            {lang === 'th'
              ? 'เอกสารเร็วขึ้น ถูกต้องขึ้น ตรวจสอบได้'
              : 'Faster, safer, traceable document work'}
          </h1>
          <p>
            {lang === 'th'
              ? 'InsightDocs รวมศูนย์เอกสาร ค้นหาเร็ว คุมเวอร์ชัน อนุมัติ และลงลายเซ็นใน PDF จริง เพื่อให้องค์กรลดเวลา ลดความผิดพลาด และเห็นประวัติทุกขั้นตอน'
              : 'InsightDocs centralizes documents, search, version control, approval, and real PDF signing so teams save time, reduce mistakes, and keep every action traceable.'}
          </p>
          <div className="impact-hero__actions">
            <a className="button" href="#impact-details">
              {lang === 'th' ? 'ดูประโยชน์หลัก' : 'View key benefits'}
            </a>
            <Link className="button button--secondary" to="/login">
              {lang === 'th' ? 'ทดลองใช้งาน' : 'Try the demo'}
            </Link>
          </div>
        </div>

        <div className="impact-hero__panel" aria-label={lang === 'th' ? 'สิ่งที่ระบบเปลี่ยน' : 'What changes'}>
          <div className="impact-hero__panel-icon">
            <Icons.Documents size={28} />
          </div>
          <h2>{lang === 'th' ? 'จากไฟล์กระจัดกระจาย สู่ workflow เดียว' : 'From scattered files to one governed workflow'}</h2>
          <ul>
            {(lang === 'th'
              ? ['ค้นหาเอกสารได้ในไม่กี่วินาที', 'รู้ทันทีว่าเวอร์ชันไหนล่าสุด', 'ลงนามใน PDF จริงและตรวจสอบย้อนหลังได้']
              : ['Find documents in seconds', 'Know the current version immediately', 'Sign real PDFs with traceable history']
            ).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <section className="impact-summary" aria-label={lang === 'th' ? 'สรุปประโยชน์' : 'Impact summary'}>
        {summaryCards.map((card) => (
          <article key={card.title.en}>
            <strong>{card.title[lang]}</strong>
            <span>{card.detail[lang]}</span>
          </article>
        ))}
      </section>

      <div className="impact-metrics" aria-label={lang === 'th' ? 'ตัวชี้วัดประโยชน์' : 'Benefit metrics'}>
        {metrics.map((metric) => (
          <article key={metric.label.en} className="impact-metric">
            <strong>{lang === 'th' ? metric.value : metric.enValue}</strong>
            <span>{metric.label[lang]}</span>
            <small>{metric.result[lang]}</small>
          </article>
        ))}
      </div>

      <div id="impact-details" className="impact-section-heading">
        <span className="sidebar__eyebrow">{lang === 'th' ? '7 มิติของผลกระทบ' : 'Seven Impact Areas'}</span>
        <h2>{lang === 'th' ? 'อ่านง่าย เห็นผลลัพธ์เร็ว' : 'Simple outcomes, clear value'}</h2>
        <p className="muted">
          {lang === 'th'
            ? 'สรุปจากเอกสาร Impact & Benefit ให้เห็นว่าระบบช่วยลดเวลา ลดงานซ้ำ และเพิ่มความโปร่งใสตรงไหน'
            : 'A focused summary of where the system saves time, reduces duplication, and improves governance.'}
        </p>
      </div>

      <div className="impact-benefit-list" aria-label={lang === 'th' ? 'รายละเอียดประโยชน์' : 'Benefit details'}>
        {benefits.map((benefit) => (
          <details
            key={benefit.id}
            className={`impact-benefit ${benefit.featured ? 'impact-benefit--featured' : ''}`}
            style={{ '--impact-accent': benefit.accent } as CSSProperties}
            open={benefit.featured}
          >
            <summary className="impact-benefit__summary">
              <span>{benefit.number}</span>
              <div>
                <h3>{benefit.title[lang]}</h3>
                <strong>{benefit.shortTitle[lang]}</strong>
              </div>
              <small>{lang === 'th' ? 'อ่านรายละเอียด' : 'Read details'}</small>
            </summary>
            <div className="impact-benefit__details">
              <ImpactColumn title={lang === 'th' ? 'ปัญหา' : 'Problem'} tone="danger" items={benefit.problem.map((item) => item[lang])} />
              <ImpactColumn title={lang === 'th' ? 'ระบบช่วยอย่างไร' : 'System support'} tone="support" items={benefit.support.map((item) => item[lang])} />
              <ImpactColumn title={lang === 'th' ? 'ผลลัพธ์' : 'Outcome'} tone="success" items={benefit.outcome.map((item) => item[lang])} />
            </div>
          </details>
        ))}
      </div>

      <div className="impact-signature-spotlight" style={{ '--impact-accent': featuredBenefit.accent } as CSSProperties}>
        <div>
          <span className="sidebar__eyebrow">{lang === 'th' ? 'จุดเด่นหลัก' : 'Signature Advantage'}</span>
          <h2>{featuredBenefit.title[lang]}</h2>
          <p>
            {lang === 'th'
              ? 'ระบบไม่ได้บันทึกแค่สถานะในฐานข้อมูล แต่สร้างผลลัพธ์เป็นไฟล์ PDF ที่มีลายเซ็น มองเห็นตำแหน่งลายเซ็น และตรวจสอบประวัติผู้ลงนามได้'
              : 'The system does not stop at a database status. It produces a signed PDF output, visible placement, and signer history that can be inspected later.'}
          </p>
        </div>
        <div className="impact-signature-spotlight__steps">
          {(lang === 'th'
            ? ['กำหนดผู้ลงนาม', 'เลือกหน้าและตำแหน่ง', 'ลงนามตามลำดับ', 'เก็บ PDF เวอร์ชันที่ลงนาม']
            : ['Assign signers', 'Place page coordinates', 'Sign in order', 'Store signed PDF version']
          ).map((step, index) => (
            <span key={step}>
              <strong>{String(index + 1).padStart(2, '0')}</strong>
              {step}
            </span>
          ))}
        </div>
      </div>

      <blockquote className="impact-quote">
        <p>{lang === 'th' ? 'ค้นหาน้อยลง เข้าใจมากขึ้น' : 'Search Less, Know More'}</p>
        <footer>
          {lang === 'th'
            ? 'InsightDocs ช่วยให้องค์กรทำงานเร็วขึ้น ลดความผิดพลาด เพิ่มความโปร่งใส และควบคุมข้อมูลได้อย่างมีประสิทธิภาพ'
            : 'InsightDocs helps organizations move faster, reduce errors, improve transparency, and control information effectively.'}
        </footer>
      </blockquote>
    </main>
  );
}

function ImpactColumn({ title, tone, items }: { title: string; tone: 'danger' | 'support' | 'success'; items: string[] }) {
  return (
    <div className={`impact-column impact-column--${tone}`}>
      <strong>{title}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
