import { Button } from '@/components/ui/button'
import React, { useState } from 'react'

const assignmentsData: {
  id: number
  title: string
  course: string
  type: string
  status: 'Pending' | 'In Progress' | 'Completed'
  grade: string
}[] = [
  {
    id: 1,
    title: 'Math Assignment',
    course: 'Algebra',
    type: 'Video',
    status: 'Pending',
    grade: 'A',
  },
  {
    id: 2,
    title: 'Science Project',
    course: 'Physics',
    type: 'Video',
    status: 'In Progress',
    grade: 'B',
  },
  {
    id: 3,
    title: 'History Essay',
    course: 'World History',
    type: 'Video',
    status: 'Completed',
    grade: 'A+',
  },
  {
    id: 4,
    title: 'English Literature',
    course: 'Literature',
    type: 'Video',
    status: 'Pending',
    grade: 'B+',
  },
  {
    id: 5,
    title: 'Computer Science Assignment',
    course: 'Programming',
    type: 'Video',
    status: 'In Progress',
    grade: 'A',
  },
  {
    id: 6,
    title: 'Chemistry Lab Report',
    course: 'Chemistry',
    type: 'Video',
    status: 'Completed',
    grade: 'A-',
  },
  {
    id: 7,
    title: 'Geography Presentation',
    course: 'Geography',
    type: 'Video',
    status: 'Pending',
    grade: 'B-',
  },
  {
    id: 8,
    title: 'Art Project',
    course: 'Art',
    type: 'Video',
    status: 'In Progress',
    grade: 'A+',
  },
]

const statusClasses = {
  Pending: 'bg-yellow-200 text-yellow-800',
  'In Progress': 'bg-blue-200 text-blue-800',
  Completed: 'bg-green-200 text-green-800',
}

const StatusBadge = ({ status }: { status: keyof typeof statusClasses }) => (
  <span
    className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClasses[status] || ''}`}
  >
    {status}
  </span>
)

interface AssignmentRowProps {
  title: string
  course: string
  type: string
  status: keyof typeof statusClasses
  grade: string
}

const AssignmentRow: React.FC<AssignmentRowProps> = ({
  title,
  course,
  type,
  status,
  grade,
}) => (
  <div className='grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-4'>
    <div>
      <div className='text-xl font-semibold'>{title}</div>
      <div className='text-gray-600'>{course}</div>
    </div>
    <div className='flex items-center justify-between'>
      <span>{type}</span>
      <StatusBadge status={status} />
      <span>
        <Button>Start</Button>
      </span>
    </div>
  </div>
)

const Section = () => {
  const [assignments] = useState(assignmentsData)

  return (
    <div className='p-4'>
      <h1 className='mb-6 text-center text-3xl font-bold'>Section</h1>
      <div className='mx-auto max-w-4xl'>
        {assignments.length > 0 ? (
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-4 font-semibold text-gray-800'>
              <div>Title</div>
              <div className='flex justify-between'>
                <span>Type</span>
                <span>Status</span>
                <span>Action</span>
              </div>
            </div>
            <div
              className='max-h-96 space-y-2 overflow-y-auto'
              style={{
                scrollbarWidth: 'none', // For Firefox
                msOverflowStyle: 'none', // For IE/Edge
              }}
            >
              <style>
                {`
                /* Hide scrollbar for Chrome, Safari, and Edge */
                .max-h-96::-webkit-scrollbar {
                  display: none;
                }
                `}
              </style>
              {assignments.map((assignment) => (
                <AssignmentRow
                  key={assignment.id}
                  title={assignment.title}
                  course={assignment.course}
                  type={assignment.type}
                  grade={assignment.grade}
                  status={assignment.status}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className='text-center text-gray-500'>No assignments available.</p>
        )}
      </div>
    </div>
  )
}

export default Section
