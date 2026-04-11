export type SampleDocument = {
  id: string;
  title: string;
  category: string;
  status: string;
  currentVersion: string;
  owner: string;
  controller: string;
  nextAction: string;
  pdfPath: string;
};

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'demo-contract-001',
    title: 'สัญญาว่าจ้างบริการที่ปรึกษา',
    category: 'Legal',
    status: 'Approved',
    currentVersion: 'v3',
    owner: 'ฝ่ายกฎหมาย',
    controller: 'คุณกัญญา',
    nextAction: 'รอจัดผู้ลงนาม 2 คน',
    pdfPath: '/mock-pdfs/consulting-services-contract.pdf',
  },
  {
    id: 'demo-policy-014',
    title: 'ระเบียบการอนุมัติค่าใช้จ่ายปี 2026',
    category: 'Finance',
    status: 'InReview',
    currentVersion: 'v5',
    owner: 'ฝ่ายการเงิน',
    controller: 'คุณภูมิ',
    nextAction: 'รอผู้จัดการพิจารณา',
    pdfPath: '/mock-pdfs/expense-approval-policy-2026.pdf',
  },
  {
    id: 'demo-hr-008',
    title: 'หนังสือแต่งตั้งพนักงานใหม่',
    category: 'HR',
    status: 'Draft',
    currentVersion: 'v2',
    owner: 'ฝ่ายทรัพยากรบุคคล',
    controller: 'คุณอิงฟ้า',
    nextAction: 'รออัปโหลด PDF เวอร์ชันล่าสุด',
    pdfPath: '/mock-pdfs/employee-appointment-letter.pdf',
  },
];
