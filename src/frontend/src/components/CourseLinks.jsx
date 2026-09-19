import { Link } from 'react-router-dom';
export default function CourseLinks({ courses = [] }) {
  return <p className="small muted">ใช้ในรายวิชา: {courses.length ? courses.map((course, index) => <span key={course.id}>{index > 0 && ' · '}<Link to={`/courses/${course.id}`}>{course.name}</Link></span>) : 'ยังไม่ได้เชื่อมรายวิชา'}</p>;
}
