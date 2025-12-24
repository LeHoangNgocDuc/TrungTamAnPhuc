import React, { useState, useEffect } from 'react';

export default function StudentView({ apiUrl, onBack }) {
  const [exams, setExams] = useState([]);
  const [currentExam, setCurrentExam] = useState(null);
  const [studentInfo, setStudentInfo] = useState({ name: '', id: '' });
  const [userAnswers, setUserAnswers] = useState({});
  const [result, setResult] = useState(null);

  // Load danh sách đề khi vào trang
  useEffect(() => {
    fetch(apiUrl + "?action=getExams")
      .then(res => res.json())
      .then(data => setExams(data.data));
  }, []);

  const handleStartExam = (exam) => {
    // Parse cấu trúc đề từ JSON string
    try {
      exam.parsedStructure = JSON.parse(exam.structure);
    } catch (e) {
      alert("Lỗi dữ liệu đề thi!");
      return;
    }
    // Xử lý link PDF để xem được
    exam.previewLink = exam.pdfLink.replace('/view', '/preview');
    setCurrentExam(exam);
  };

  const handleSubmit = async () => {
    if (!studentInfo.name || !studentInfo.id) {
      alert("Vui lòng nhập tên và mã số!");
      return;
    }

    // LOGIC CHẤM ĐIỂM (Client-side cho nhanh)
    const { config, answers: key } = currentExam.parsedStructure;
    let score = 0;
    let totalScore = 10; // Thang 10
    
    // Tính tổng số điểm thành phần (để chia tỉ lệ nếu cần, ở đây làm đơn giản)
    // Giả sử: Phần 1 (3 điểm), Phần 2 (4 điểm), Phần 3 (3 điểm) hoặc chia đều.
    // Để đơn giản: Chấm đếm số ý đúng.
    
    let correctCount = 0;
    let totalQuestionsCount = 0;
    let detailResult = {};

    // 1. Chấm Phần MCQ
    for(let i=1; i<=config.mcq; i++) {
        totalQuestionsCount++;
        const id = `p1_c${i}`;
        if(userAnswers[id] === key[id]) {
            correctCount++;
            detailResult[id] = "Đ";
        } else detailResult[id] = "S";
    }

    // 2. Chấm Phần Đúng/Sai (Mỗi ý nhỏ tính là 1 câu nhỏ)
    for(let i=1; i<=config.tf; i++) {
        ['a','b','c','d'].forEach(sub => {
            totalQuestionsCount++; // Mỗi ý a,b,c,d tính là 1 điểm kiểm tra
            const id = `p2_c${i}_${sub}`;
            if(userAnswers[id] === key[id]) {
                correctCount++;
                detailResult[id] = "Đ";
            } else detailResult[id] = "S";
        });
    }

    // 3. Chấm Phần Trả lời ngắn
    for(let i=1; i<=config.short; i++) {
        totalQuestionsCount++;
        const id = `p3_c${i}`;
        // So sánh chuỗi, bỏ khoảng trắng
        if(userAnswers[id] && key[id] && userAnswers[id].replace(/\s/g,'') === key[id].replace(/\s/g,'')) {
            correctCount++;
            detailResult[id] = "Đ";
        } else detailResult[id] = "S";
    }

    const finalScore = (correctCount / totalQuestionsCount) * 10;
    const roundedScore = Math.round(finalScore * 100) / 100;

    setResult({ score: roundedScore, correct: correctCount, total: totalQuestionsCount });

    // Gửi kết quả về Server
    await fetch(apiUrl + "?action=submitExam", {
      method: 'POST',
      body: JSON.stringify({
        maHS: studentInfo.id,
        tenHS: studentInfo.name,
        maDe: currentExam.id,
        score: roundedScore,
        studentAnswers: userAnswers,
        detailResult: detailResult
      })
    });
  };

  // MÀN HÌNH DANH SÁCH ĐỀ
  if (!currentExam) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-4">← Trang chủ</button>
        <h2 className="text-2xl font-bold mb-4">Danh Sách Đề Thi</h2>
        <div className="grid gap-4">
          {exams.map(ex => (
            <div key={ex.id} className="p-4 bg-white rounded shadow flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{ex.title}</h3>
                <p className="text-gray-500">Mã: {ex.id}</p>
              </div>
              <button onClick={() => handleStartExam(ex)} className="px-4 py-2 bg-blue-600 text-white rounded">
                Làm Bài
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // MÀN HÌNH KẾT QUẢ
  if (result) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-green-50">
        <h1 className="text-5xl font-bold text-green-600 mb-4">{result.score} Điểm</h1>
        <p className="text-xl">Bạn làm đúng {result.correct} / {result.total} ý.</p>
        <button onClick={() => {setResult(null); setCurrentExam(null);}} className="mt-6 px-6 py-2 bg-gray-600 text-white rounded">
          Quay về danh sách
        </button>
      </div>
    );
  }

  // MÀN HÌNH LÀM BÀI (SPLIT SCREEN)
  const { config } = currentExam.parsedStructure;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* TRÁI: PDF */}
      <div className="w-2/3 h-full border-r border-gray-300">
        <iframe src={currentExam.previewLink} className="w-full h-full" title="PDF Viewer"></iframe>
      </div>

      {/* PHẢI: PHIẾU TRẢ LỜI */}
      <div className="w-1/3 h-full overflow-y-auto p-4 bg-gray-50">
        <div className="mb-4 p-4 bg-white rounded shadow">
            <h3 className="font-bold">{currentExam.title}</h3>
            <input className="border p-2 w-full mt-2 mb-2 rounded" placeholder="Họ và tên" onChange={e => setStudentInfo({...studentInfo, name: e.target.value})} />
            <input className="border p-2 w-full rounded" placeholder="Mã số học sinh" onChange={e => setStudentInfo({...studentInfo, id: e.target.value})} />
        </div>

        {/* Render Phần 1: MCQ */}
        {config.mcq > 0 && (
            <div className="mb-6">
                <h4 className="font-bold text-blue-700 mb-2">I. Trắc nghiệm</h4>
                <div className="grid grid-cols-4 gap-2">
                    {Array.from({length: config.mcq}, (_, i) => i+1).map(i => (
                        <div key={`p1-${i}`} className="flex flex-col items-center p-2 bg-white border rounded">
                            <span className="font-bold text-sm mb-1">{i}</span>
                            <div className="grid grid-cols-2 gap-1 w-full">
                                {['A','B','C','D'].map(opt => (
                                    <button 
                                        key={opt}
                                        className={`text-xs p-1 border rounded ${userAnswers[`p1_c${i}`] === opt ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                                        onClick={() => setUserAnswers({...userAnswers, [`p1_c${i}`]: opt})}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Render Phần 2: Đúng Sai */}
        {config.tf > 0 && (
            <div className="mb-6">
                <h4 className="font-bold text-blue-700 mb-2">II. Đúng Sai</h4>
                {Array.from({length: config.tf}, (_, i) => i+1).map(i => (
                    <div key={`p2-${i}`} className="mb-3 p-3 bg-white border rounded">
                        <div className="font-bold mb-2">Câu {i}</div>
                        {['a','b','c','d'].map(sub => (
                            <div key={sub} className="flex justify-between items-center mb-1 text-sm">
                                <span>{sub})</span>
                                <div className="flex space-x-2">
                                    <button 
                                        className={`px-3 py-1 border rounded ${userAnswers[`p2_c${i}_${sub}`] === 'D' ? 'bg-green-500 text-white' : ''}`}
                                        onClick={() => setUserAnswers({...userAnswers, [`p2_c${i}_${sub}`]: 'D'})}
                                    >Đ</button>
                                    <button 
                                        className={`px-3 py-1 border rounded ${userAnswers[`p2_c${i}_${sub}`] === 'S' ? 'bg-red-500 text-white' : ''}`}
                                        onClick={() => setUserAnswers({...userAnswers, [`p2_c${i}_${sub}`]: 'S'})}
                                    >S</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        )}

        {/* Render Phần 3: Trả lời ngắn */}
        {config.short > 0 && (
            <div className="mb-6">
                <h4 className="font-bold text-blue-700 mb-2">III. Trả lời ngắn</h4>
                <div className="grid grid-cols-2 gap-2">
                    {Array.from({length: config.short}, (_, i) => i+1).map(i => (
                        <div key={`p3-${i}`} className="p-2 bg-white border rounded">
                            <span className="font-bold text-sm mr-2">{i}.</span>
                            <input 
                                className="border p-1 w-full text-sm rounded"
                                placeholder="Kết quả..."
                                onBlur={(e) => setUserAnswers({...userAnswers, [`p3_c${i}`]: e.target.value})}
                            />
                        </div>
                    ))}
                </div>
            </div>
        )}

        <button onClick={handleSubmit} className="w-full py-3 bg-green-600 text-white font-bold rounded shadow text-lg hover:bg-green-700">
            NỘP BÀI
        </button>
      </div>
    </div>
  );
}