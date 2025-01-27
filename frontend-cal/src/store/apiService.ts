/**
 * API Service Configuration
 *
 * This file sets up the API services using Redux Toolkit Query for handling API requests.
 * It includes two main API services:
 * 1. apiService - For main application API endpoints
 * 2. anotherApiService - For assessment/activity related endpoints
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import API_URL, { ACTIVITY_URL } from '../../constant'
import Cookies from 'js-cookie'

// Response type for authentication endpoints
export interface AuthResponse {
  refresh_token: string
  access_token: string
  role: string
  email: string
  full_name: string
}

// Institute data type
export interface Institute {
  id: number
  name: string
  // Add other properties as needed
}

// Main API service configuration
export const apiService = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL, // Replace with your API base URL
  }),
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation<
      AuthResponse,
      { email: string; password: string; client_id: string }
    >({
      query: (credentials) => ({
        url: '/auth/login/',
        method: 'POST',
        body: credentials,
      }),
      // Store authentication tokens in cookies after successful login
      onQueryStarted: async (arg, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled
          Cookies.set('access_token', data.access_token) // Store the correct access token
          Cookies.set('user_id', data.user_id)
        } catch (error) {
          console.error('Failed to store access token in cookies', error)
        }
      },
    }),

    // User registration endpoint
    signup: builder.mutation<
      AuthResponse,
      {
        first_name: string
        last_name: string
        email: string
        password: string
        role: string
      }
    >({
      query: (userData) => ({
        url: '/auth/signup/',
        method: 'POST',
        body: userData,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),

    // Logout endpoint
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout/',
        method: 'POST',
        body: {
          "token" : Cookies.get('access_token')
        },
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json',
        },
      }),
      // Remove authentication tokens from cookies after logout
      onQueryStarted: async (arg, { queryFulfilled }) => {
        try {
          await queryFulfilled
          Cookies.remove('access_token') // Remove the token after logout
        } catch (error) {
          console.error('Failed to remove access token from cookies', error)
        }
      },
    }),

    // Institute management endpoints
    fetchInstitutesWithAuth: builder.query<{ institutes: Institute[] }, void>({
      query: () => ({
        url: '/institutes/',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
        },
      }),
    }),

    // User management endpoints
    fetchUsersWithAuth: builder.query<
      { users: { id: number; name: string; email: string }[] },
      void
    >({
      query: () => ({
        url: '/users/',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
        },
      }),
    }),

    // Video management endpoints
    fetchVideoDetailsWithAuth: builder.query<
      { videoDetails: { id: number; title: string; url: string }[] },
      void
    >({
      query: () => ({
        url: '/videos/',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
        },
      }),
    }),

    createVideoDetails: builder.mutation({
      query: (videoData) => ({
        url: '/videos',
        method: 'POST',
        body: videoData,
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json',
        },
      }),
    }),

    // Course management endpoints
    fetchCoursesWithAuth: builder.query<
      {
        courses: {
          course_id: number
          name: string
          description: string
          visibility: string
          created_at: string
        }[]
      },
      void
    >({
      query: () => ({
        url: '/course/courses/',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
        },
      }),
    }),

    // Module management endpoints
    fetchModulesWithAuth: builder.query<{ modules: {}[] }, number>({
      query: (courseId) => ({
        url: `/course/modules/?course_id=${courseId}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json',
        },
      }),
    }),

    // Assessment management endpoints
    fetchAssessmentWithAuth: builder.query<
      { assessment: { id: number; title: string; description: string } },
      number
    >({
      query: (assessmentId) => ({
        url: `/assessment/questions/${assessmentId}/`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
        },
      }),
    }),

    // Section management endpoints
    fetchSectionsWithAuth: builder.query<
      { sections: { id: number; title: string; content: string }[] },
      { courseId: number; moduleId: number }
    >({
      query: ({ courseId, moduleId }) => ({
        url: `/course/sections/?course_id=${courseId}&module_id=${moduleId}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
        },
      }),
    }),

    // Item management endpoints
    fetchItemsWithAuth: builder.query<
      { items: { id: number; name: string; description: string }[] },
      number
    >({
      query: (sectionId) => ({
        url: `/course/items/?section_id=${sectionId}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
        },
      }),
    }),

    // Question management endpoints
    fetchQuestionsWithAuth: builder.query<
      { items: { id: number; name: string; description: string }[] },
      number
    >({
      query: (assessmentId) => ({
        url: `/assessment/questions/?assessment_id=${assessmentId}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
        },
      }),
    }),

    // Progress tracking endpoints
    updateSectionItemProgress: builder.mutation<
      void,
      {
        courseInstanceId: string
        studentId: string
        sectionItemId: string
        cascade: true
      }
    >({
      query: (progressData) => ({
        url: '/course-progress/update-section-item-progress',
        method: 'POST',
        body: progressData,
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json',
        },
      }),
    }),
  }),
})

// Export hooks for using the API endpoints
export const {
  useFetchItemsWithAuthQuery,
  useLoginMutation,
  useFetchAssessmentWithAuthQuery,
  useSignupMutation,
  useLogoutMutation,
  useFetchInstitutesWithAuthQuery,
  useFetchUsersWithAuthQuery,
  useFetchVideoDetailsWithAuthQuery,
  useCreateVideoDetailsMutation,
  useFetchCoursesWithAuthQuery,
  useFetchModulesWithAuthQuery,
  useFetchSectionsWithAuthQuery,
  useFetchQuestionsWithAuthQuery,
  useUpdateSectionItemProgressMutation,
} = apiService

const ANOTHER_API_URL = ACTIVITY_URL // Replace with your new API base URL

export const anotherApiService = createApi({
  reducerPath: 'anotherApi',
  baseQuery: fetchBaseQuery({
    baseUrl: ANOTHER_API_URL,
  }),
  endpoints: (builder) => ({
    // Start assessment endpoint
    startAssessment: builder.mutation<
      void,
      { courseInstanceId: string; assessmentId: string }
    >({
      query: (assessmentData) => ({
        url: '/startAssessment',
        method: 'POST',
        body: {
          ...assessmentData,
          studentId: Cookies.get('user_id'), // Get studentId from cookies
        },
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json',
        },
      }),
      onQueryStarted: async (arg, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled
          Cookies.set('attemptId', data.attemptId) // Store the correct access token
          Cookies.remove('gradingData')
        } catch (error) {
          console.error('Failed to store access token in cookies', error)
        }
      },
    }),

    // Submit assessment endpoint
    submitAssessment: builder.mutation<
      void,
      {
        assessmentId: number
        courseId: number
        attemptId: number
        answers: string
        questionId:number
      }
    >({
      query: (submissionData) => ({
        url: '/submitAssessment',
        method: 'POST',
        body: {
          ...submissionData,
          studentId: Cookies.get('user_id'), // Get studentId from cookies
        },
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json',
        },
      }),
    }),
  }),
})

// Export hooks for assessment endpoints
export const { useStartAssessmentMutation, useSubmitAssessmentMutation } =
  anotherApiService
