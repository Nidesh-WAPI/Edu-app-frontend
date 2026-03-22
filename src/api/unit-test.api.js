import axiosInstance from './axiosInstance';

/**
 * Generate a new unit test question paper.
 * @param {{ syllabusId, classLevelId, subjectId, chapterIds: string[], maxMarks: number }} payload
 */
export const generateUnitTestPaper = (payload) =>
  axiosInstance.post('/unit-test/generate', payload);

/** Get all saved papers for the logged-in customer. */
export const getMyPapers = () =>
  axiosInstance.get('/unit-test/papers');

/** Delete a saved paper (and its evaluation result). */
export const deletePaper = (paperId) =>
  axiosInstance.delete(`/unit-test/papers/${paperId}`);

/**
 * Upload answer sheet images and trigger AI evaluation.
 * @param {string} paperId
 * @param {FormData} formData  — field name: "images", up to 3 image files
 */
export const evaluatePaper = (paperId, formData) =>
  axiosInstance.post(`/unit-test/papers/${paperId}/evaluate`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

/** Fetch the evaluation result for a previously evaluated paper. */
export const getResult = (paperId) =>
  axiosInstance.get(`/unit-test/papers/${paperId}/result`);
