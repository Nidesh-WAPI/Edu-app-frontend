import axiosInstance from './axiosInstance';

export const getSyllabuses = () =>
  axiosInstance.get('/public/syllabuses');

export const getClasses = (syllabusId) =>
  axiosInstance.get('/public/classes', { params: { syllabus: syllabusId } });

export const getSubjects = (syllabusId, classLevelId) =>
  axiosInstance.get('/public/subjects', { params: { syllabus: syllabusId, classLevel: classLevelId } });

export const getChapters = (syllabusId, classLevelId, subjectId) =>
  axiosInstance.get('/public/chapters', { params: { syllabus: syllabusId, classLevel: classLevelId, subject: subjectId } });
