from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.course import Course
from backend.app.schemas.course import CourseCreate, CourseResponse


router = APIRouter(
    prefix="/courses",
    tags=["Courses"],
)


@router.post("/", response_model=CourseResponse)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
):
    course = Course(
        title=course_data.title,
        description=course_data.description,
    )

    db.add(course)
    db.commit()
    db.refresh(course)

    return course


@router.get("/", response_model=list[CourseResponse])
def get_courses(
    db: Session = Depends(get_db),
):
    return db.query(Course).all()


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
):
    course = (
        db.query(Course)
        .filter(Course.id == course_id)
        .first()
    )

    if course is None:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    return course