import React, { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';

const initialFleet = [
  { id: "car_1", brand: "Rover", model: "XPHWEP", year: 1993, plateNumber: "03813-193-25", currentMileage: 156200, status: "available", insuranceExpiryDate: "2026-08-15", oilChangeMileage: 160000, technicalControlDate: "2026-09-20" }
];

export default function App() {
  const [fleet, setFleet] = useState(initialFleet);
  const [activeTab, setActiveTab] = useState('new-contract');
  const [isLoading, setIsLoading] = useState(false);
  const [contractForm, setContractForm] = useState({ tenantName: '', licenseNumber: '', birthDatePlace: '', licenseIssueDate: '', pricePerDay: 6000, caution: 50000 });
  const [printedContract, setPrintedContract] = useState(null);

  // --- محرك التصحيح المحلي الذكي (بديل الـ AI) ---
  const cleanAndFillData = (rawText) => {
    // محاكاة تنظيف البيانات المحلية
    const lines = rawText.split('\n');
    let name = "";
    let license = "";
    
    // نبحث عن أي رقم طويل (رخصة السياقة)
    const licenseMatch = rawText.match(/\d{18}/);
    if(licenseMatch) license = licenseMatch[0];

    // تنظيف الاسم: نبحث عن كلمات مكتوبة بأحرف كبيرة
    const words = rawText.split(/\s+/);
    name = words.filter(w => w.length > 3 && w === w.toUpperCase()).slice(0, 3).join(' ');

    setContractForm(prev => ({
      ...prev,
      tenantName: name || "الاسم غير واضح",
      licenseNumber: license || "غير محدد",
      birthDatePlace: "يُرجى المراجعة يدوياً",
      licenseIssueDate: "يُرجى المراجعة يدوياً"
    }));
  };

  const handleLocalScan = async (file) => {
    setIsLoading(true);
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng+fra');
      cleanAndFillData(text);
    } catch (e) { alert("خطأ في القراءة المحلية"); }
    finally { setIsLoading(false); }
  };

  const handlePrint = (e) => {
    e.preventDefault();
    setPrintedContract({...contractForm, date: new Date().toLocaleDateString()});
    setTimeout(() => { window.print(); setPrintedContract(null); }, 1000);
  };

  return (
    <div style={{direction: 'rtl', padding: '20px'}}>
      <h2>نظام الكراء المحلي</h2>
      <input type="file" onChange={(e) => handleLocalScan(e.target.files[0])} />
      {isLoading && <p>⏳ جاري المعالجة محلياً...</p>}
      
      <form onSubmit={handlePrint}>
        <input value={contractForm.tenantName} onChange={e=>setContractForm({...contractForm, tenantName:e.target.value})} placeholder="الاسم" />
        <input value={contractForm.licenseNumber} onChange={e=>setContractForm({...contractForm, licenseNumber:e.target.value})} placeholder="الرخصة" />
        <button type="submit">🖨️ طباعة</button>
      </form>
    </div>
  );
}
