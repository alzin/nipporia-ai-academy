// backend/src/infrastructure/web/routes/course.routes.ts
import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const courseRouter = (courseController: CourseController): Router => {
    const router = Router();

    // Public (guest-readable) routes. Lesson content is gated per lesson in the use cases.
    router.get('/', optionalAuthenticate, courseController.getAllCourses.bind(courseController));
    router.get('/my-enrollments', authenticate, courseController.getMyEnrollments.bind(courseController));
    router.get('/lessons/:lessonId', optionalAuthenticate, courseController.getLessonById.bind(courseController));
    router.post('/lessons/:lessonId/complete', authenticate, courseController.completeLesson.bind(courseController));
    router.get('/:courseId', optionalAuthenticate, courseController.getCourseById.bind(courseController));
    router.get('/:courseId/lessons', optionalAuthenticate, courseController.getCourseLessons.bind(courseController));
    router.get('/:courseId/enrollment-status', authenticate, courseController.checkEnrollment.bind(courseController));
    router.post('/:courseId/enroll', authenticate, courseController.enrollInCourse.bind(courseController));

    return router;
};

export default courseRouter;
