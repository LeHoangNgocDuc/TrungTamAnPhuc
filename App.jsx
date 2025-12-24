import React, { useState, useEffect } from 'react';
import StudentView from './components/StudentView';
import TeacherAdmin from './components/TeacherAdmin';

// THAY URL CỦA BẠN VÀO ĐÂY
const API_URL = "https://script.google.com/macros/s/xxxxxxxxx/exec"; 

export default function App() {
  const [view, setView] = useState('home'); // home, student, teacher
  const [selectedExam, setSelectedExam] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {view === 'home' && (
        <div className="flex flex-col items-center justify-center h-screen space-y-6">
          <h1 className="text-4xl font-bold text-blue-600">Hệ Thống Thi Toán Online</h1>
          <div className="space-x-4">
            <button onClick={() => setView('student')} className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600">
              Vào Thi (Học Sinh)
            </button>
            <button onClick={() => setView('teacher')} className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700">
              Quản Lý (Giáo Viên)
            </button>
          </div>
        </div>
      )}

      {view === 'student' && (
        <StudentView 
          apiUrl={API_URL} 
          onBack={() => setView('home')} 
        />
      )}

      {view === 'teacher' && (
        <TeacherAdmin 
          apiUrl={API_URL} 
          onBack={() => setView('home')} 
        />
      )}
    </div>
  );
}