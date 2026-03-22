import axiosInstance from './axiosInstance';

export const generateQuiz = (payload) => axiosInstance.post('/quiz/generate', payload);
export const submitQuiz   = (payload) => axiosInstance.post('/quiz/submit',   payload);
export const getQuizHistory = ()      => axiosInstance.get('/quiz/history');
