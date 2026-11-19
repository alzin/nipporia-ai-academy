import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import communityReducer from './slices/communitySlice';
import profileReducer from './slices/profileSlice';
import dashboardReducer from './slices/dashboardSlice';
import activityReducer from './slices/activitySlice';
import announcementReducer from './slices/announcementSlice'
import videoReducer from './slices/videoSlice'
import feedbackReducer from './slices/feedbackSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    course: courseReducer,
    community: communityReducer,
    announcements: announcementReducer,
    profile: profileReducer,
    dashboard: dashboardReducer,
    activity: activityReducer,
    videos: videoReducer,
    feedback: feedbackReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
