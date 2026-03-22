import axiosInstance from './axiosInstance';

export const sendChatMessage = (payload) =>
  axiosInstance.post('/ai/chat', payload);

/**
 * Request a deep-dive learning step for a specific topic.
 *
 * @param {object} payload
 * @param {string} payload.syllabusId
 * @param {string} payload.classLevelId
 * @param {string} payload.subjectId
 * @param {string} payload.topic       — topic name (e.g. "Mitochondria")
 * @param {string} payload.step        — 'explain' | 'examples' | 'quiz' | 'next'
 */
export const requestDeepDive = (payload) =>
  axiosInstance.post('/ai/deep-dive', payload);
