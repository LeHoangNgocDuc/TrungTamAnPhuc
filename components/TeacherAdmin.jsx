import React, { useState } from 'react';

export default function TeacherAdmin({ apiUrl, onBack }) {
  const [examInfo, setExamInfo] = useState({
    id: '', title: '', pdfLink: '', duration: 90
  });
  
  // Cấu hình số lượng câu hỏi
  const [config, setConfig] = useState({
    mcq: 12,    // Trắc nghiệm 4 lựa chọn (Phần I)
    tf: 4,      // Đúng sai (Phần II - mỗi câu có 4 ý a,b,c,d)
    short: 6    // Trả lời ngắn (Phần III)
  });

  const [answers, setAnswers] = useState({}); // Lưu đáp án
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hàm sinh ra form nhập đáp án dựa trên config
  const renderAnswerInputs = () => {
    let inputs = [];

    // PHẦN 1: TRẮC NGHIỆM
    if (config.mcq > 0) {
      inputs.push(<h3 className="mt-4 font-bold text-lg text-blue-600">Phần I: Trắc nghiệm ({config.mcq} câu)</h3>);
      let grid = [];
      for (let i = 1; i <= config.mcq; i++) {
        grid.push(
          <div key={`mcq-${i}`} className="flex items-center space-x-2 mb-2">
            <span className="w-8 font-bold">{i}.</span>
            <select 
              className="border p-1 rounded"
              onChange={(e) => setAnswers(prev => ({...prev, [`p1_c${i}`]: e.target.value}))}
            >
              <option value="">-</option>
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
            </select>
          </div>
        );
      }
      inputs.push(<div className="grid grid-cols-4 gap-2">{grid}</div>);
    }

    // PHẦN 2: ĐÚNG SAI
    if (config.tf > 0) {
      inputs.push(<h3 className="mt-4 font-bold text-lg text-blue-600">Phần II: Đúng Sai ({config.tf} câu)</h3>);
      for (let i = 1; i <= config.tf; i++) {
        inputs.push(
          <div key={`tf-${i}`} className="mb-3 p-2 border rounded bg-white">
            <div className="font-bold mb-1">Câu {i}:</div>
            <div className="flex space-x-4">
              {['a', 'b', 'c', 'd'].map(sub => (
                <label key={sub} className="flex items-center space-x-1">
                  <span>{sub})</span>
                  <select 
                    className="border p-1 rounded text-sm"
                    onChange={(e) => setAnswers(prev => ({...prev, [`p2_c${i}_${sub}`]: e.target.value}))}
                  >
                    <option value="">-</option>
                    <option value="D">Đ</option>
                    <option value="S">S</option>
                  </select>
                </label>
              ))}
            </div>
          </div>
        );
      }
    }

    // PHẦN 3: TRẢ LỜI NGẮN
    if (config.short > 0) {
      inputs.push(<h3 className="mt-4 font-bold text-lg text-blue-600">Phần III: Trả lời ngắn ({config.short} câu)</h3>);
      let grid = [];
      for (let i = 1; i <= config.short; i++) {
        grid.push(
          <div key={`short-${i}`} className="flex items-center space-x-2 mb-2">
            <span className="w-8 font-bold">{i}.</span>
            <input 
              type="text" 
              placeholder="Đáp án (VD: 10.5)" 
              className="border p-1 rounded w-32"
              onChange={(e) => setAnswers(prev => ({...prev, [`p3_c${i}`]: e.target.value.trim()}))}
            />
          </div>
        );
      }
      inputs.push(<div className="grid grid-cols-3 gap-2">{grid}</div>);
    }

    return inputs;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Gom dữ liệu cấu trúc
    const structureData = {
      config: config,
      answers: answers
    };

    const payload = {
      id: examInfo.id,
      title: examInfo.title,
      pdfLink: examInfo.pdfLink,
      totalQuestions: config.mcq + config.tf + config.short,
      duration: examInfo.duration,
      structure: structureData // JSON quan trọng nhất
    };

    // Gửi lên Google Sheet (Cần dùng fetch với mode 'no-cors' hoặc proxy nếu gặp lỗi CORS, nhưng Apps Script post thường ok)
    // Lưu ý: Apps Script doPost cần xử lý đặc biệt. Ở đây dùng JSONP hoặc gửi form-data là tốt nhất.
    // Để đơn giản cho demo, ta dùng fetch text/plain
    await fetch(apiUrl + "?action=addExam", {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    alert("Đã thêm đề thi thành công!");
    setIsSubmitting(false);
    onBack();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <button onClick={onBack} className="mb-4 text-gray-600 underline">← Quay lại</button>
      <h2 className="text-2xl font-bold mb-6">Thêm Đề Thi Mới</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* CỘT TRÁI: THÔNG TIN CƠ BẢN */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-4">1. Thông tin đề</h3>
          <input className="block w-full border p-2 mb-3 rounded" placeholder="Mã Đề (VD: DE02)" 
            onChange={e => setExamInfo({...examInfo, id: e.target.value})} />
          <input className="block w-full border p-2 mb-3 rounded" placeholder="Tên Đề Thi" 
            onChange={e => setExamInfo({...examInfo, title: e.target.value})} />
          <input className="block w-full border p-2 mb-3 rounded" placeholder="Link PDF (Google Drive công khai)" 
            onChange={e => setExamInfo({...examInfo, pdfLink: e.target.value})} />
          <input className="block w-full border p-2 mb-3 rounded" type="number" placeholder="Thời gian (phút)" value={examInfo.duration}
            onChange={e => setExamInfo({...examInfo, duration: e.target.value})} />
        </div>

        {/* CỘT PHẢI: CẤU HÌNH SỐ CÂU */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-4">2. Cấu trúc đề</h3>
          <div className="flex justify-between items-center mb-2">
            <label>Số câu TN (4 chọn):</label>
            <input type="number" className="border p-1 w-16 text-center" value={config.mcq} 
              onChange={e => setConfig({...config, mcq: parseInt(e.target.value) || 0})} />
          </div>
          <div className="flex justify-between items-center mb-2">
            <label>Số câu Đúng/Sai:</label>
            <input type="number" className="border p-1 w-16 text-center" value={config.tf} 
              onChange={e => setConfig({...config, tf: parseInt(e.target.value) || 0})} />
          </div>
          <div className="flex justify-between items-center mb-2">
            <label>Số câu Trả lời ngắn:</label>
            <input type="number" className="border p-1 w-16 text-center" value={config.short} 
              onChange={e => setConfig({...config, short: parseInt(e.target.value) || 0})} />
          </div>
        </div>
      </div>

      {/* PHẦN NHẬP ĐÁP ÁN */}
      <div className="mt-6 bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-4 text-xl">3. Nhập Đáp Án (Answer Key)</h3>
        <p className="text-sm text-gray-500 mb-4">Nhập đáp án đúng để hệ thống tự chấm.</p>
        
        {renderAnswerInputs()}
      </div>

      <button 
        onClick={handleSubmit} 
        disabled={isSubmitting}
        className="mt-6 w-full py-3 bg-green-600 text-white font-bold rounded shadow hover:bg-green-700 disabled:bg-gray-400"
      >
        {isSubmitting ? "Đang lưu..." : "LƯU ĐỀ THI"}
      </button>
    </div>
  );
}