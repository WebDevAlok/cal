import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import API_URL from '../../constant'
import Cookies from 'js-cookie'

export interface AuthResponse {
  refresh_token: string
  access_token: string
  role: string
  email: string
  full_name: string
}

export interface Institute {
  id: number
  name: string
  // Add other properties as needed
}

export const apiService = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL, // Replace with your API base URL
  }),
  endpoints: (builder) => ({
    login: builder.mutation<
      AuthResponse,
      { username: string; password: string; client_id: string }
    >({
      query: (credentials) => ({
        url: '/auth/login/',
        method: 'POST',
        body: credentials,
      }),
      onQueryStarted: async (arg, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled
          Cookies.set('access_token', data.access_token) // Store the correct access token
        } catch (error) {
          console.error('Failed to store access token in cookies', error)
        }
      },
    }),

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

    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/userLogout',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json',
        },
      }),
      onQueryStarted: async (arg, { queryFulfilled }) => {
        try {
          await queryFulfilled
          Cookies.remove('access_token') // Remove the token after logout
        } catch (error) {
          console.error('Failed to remove access token from cookies', error)
        }
      },
    }),

    fetchInstitutesWithAuth: builder.query<{ institutes: Institute[] }, void>({
      query: () => ({
        url: '/institutes/',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
        },
      }),
    }),

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
    fetchCoursesWithAuth: builder.query<
      { courses: { id: number; title: string; description: string }[] },
      void
    >({
      query: () => ({
        url: '/course/courses/',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json',
        },
      }),
    }),
    fetchModulesWithAuth: builder.query<
      { modules: { id: number; title: string; content: string }[] },
      number
    >({
      query: (courseId) => ({
        url: `/course/courses/${courseId}/`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json',
        },
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useSignupMutation,
  useLogoutMutation,
  useFetchInstitutesWithAuthQuery,
  useFetchUsersWithAuthQuery,
  useFetchVideoDetailsWithAuthQuery,
  useCreateVideoDetailsMutation,
  useFetchCoursesWithAuthQuery,
  useFetchModulesWithAuthQuery,
} = apiService
