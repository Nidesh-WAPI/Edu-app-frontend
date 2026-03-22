import axiosInstance from './axiosInstance';

export const sendOtp  = (phone) => axiosInstance.post('/customer/auth/send-otp',   { phone });
export const verifyOtp = (phone, otp) => axiosInstance.post('/customer/auth/verify-otp', { phone, otp });
