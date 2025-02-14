import React, { createContext, useContext, useReducer, ReactNode } from 'react';

/* ------------------------------------------------------------------
   Types & Interfaces
------------------------------------------------------------------ */

// User Session Types
interface UserSession {
  id: string | null;
  name: string | null;
  email: string | null;
  isAuthenticated: boolean;
  lastLogin: string | null;
}

// File Upload Types
interface FileUpload {
  currentFile: {
    id: string | null;
    name: string | null;
    size: number | null;
    type: string | null;
    uploadedAt: string | null;
  };
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  error: string | null;
}

// Cleaning Job Types
interface CleaningJob {
  id: string | null;
  fileId: string | null;
  status: 'pending' | 'mapping' | 'cleaning' | 'complete' | 'error';
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  mapping: Record<string, string>;
  results: {
    totalRecords: number;
    cleanedRecords: number;
    duplicatesFound: number;
    errorCount: number;
  };
  error: string | null;
}

// Settings Types
interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    browser: boolean;
    cleaning: boolean;
    updates: boolean;
  };
  dataRetention: number; // in days
  defaultExportFormat: 'csv' | 'xlsx' | 'json';
}

// Combined App State
interface AppState {
  user: UserSession;
  fileUpload: FileUpload;
  cleaningJob: CleaningJob;
  settings: AppSettings;
}

/* ------------------------------------------------------------------
   Action Types
------------------------------------------------------------------ */

type AppAction =
  | { type: 'SET_USER'; payload: Partial<UserSession> }
  | { type: 'CLEAR_USER' }
  | { type: 'UPDATE_FILE_UPLOAD'; payload: Partial<FileUpload> }
  | { type: 'CLEAR_FILE_UPLOAD' }
  | { type: 'UPDATE_CLEANING_JOB'; payload: Partial<CleaningJob> }
  | { type: 'CLEAR_CLEANING_JOB' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'RESET_APP_STATE' };

/* ------------------------------------------------------------------
   Initial State
------------------------------------------------------------------ */

const initialState: AppState = {
  user: {
    id: null,
    name: null,
    email: null,
    isAuthenticated: false,
    lastLogin: null,
  },
  fileUpload: {
    currentFile: {
      id: null,
      name: null,
      size: null,
      type: null,
      uploadedAt: null,
    },
    progress: 0,
    status: 'idle',
    error: null,
  },
  cleaningJob: {
    id: null,
    fileId: null,
    status: 'pending',
    progress: 0,
    startedAt: null,
    completedAt: null,
    mapping: {},
    results: {
      totalRecords: 0,
      cleanedRecords: 0,
      duplicatesFound: 0,
      errorCount: 0,
    },
    error: null,
  },
  settings: {
    theme: 'system',
    notifications: {
      email: true,
      browser: true,
      cleaning: true,
      updates: false,
    },
    dataRetention: 30,
    defaultExportFormat: 'csv',
  },
};

/* ------------------------------------------------------------------
   Context Creation
------------------------------------------------------------------ */

interface AppStateContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

/* ------------------------------------------------------------------
   Reducer
------------------------------------------------------------------ */

function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
      };

    case 'CLEAR_USER':
      return {
        ...state,
        user: initialState.user,
      };

    case 'UPDATE_FILE_UPLOAD':
      return {
        ...state,
        fileUpload: {
          ...state.fileUpload,
          ...action.payload,
        },
      };

    case 'CLEAR_FILE_UPLOAD':
      return {
        ...state,
        fileUpload: initialState.fileUpload,
      };

    case 'UPDATE_CLEANING_JOB':
      return {
        ...state,
        cleaningJob: {
          ...state.cleaningJob,
          ...action.payload,
        },
      };

    case 'CLEAR_CLEANING_JOB':
      return {
        ...state,
        cleaningJob: initialState.cleaningJob,
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };

    case 'RESET_APP_STATE':
      return initialState;

    default:
      return state;
  }
}

/* ------------------------------------------------------------------
   Provider Component
------------------------------------------------------------------ */

interface AppStateProviderProps {
  children: ReactNode;
  initialState?: Partial<AppState>;
}

export function AppStateProvider({
  children,
  initialState: customInitialState,
}: AppStateProviderProps) {
  const [state, dispatch] = useReducer(
    appStateReducer,
    customInitialState
      ? { ...initialState, ...customInitialState }
      : initialState
  );

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

/* ------------------------------------------------------------------
   Custom Hook
------------------------------------------------------------------ */

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

/* ------------------------------------------------------------------
   Action Creators
------------------------------------------------------------------ */

export const appStateActions = {
  setUser: (user: Partial<UserSession>) => ({
    type: 'SET_USER' as const,
    payload: user,
  }),
  clearUser: () => ({
    type: 'CLEAR_USER' as const,
  }),
  updateFileUpload: (fileUpload: Partial<FileUpload>) => ({
    type: 'UPDATE_FILE_UPLOAD' as const,
    payload: fileUpload,
  }),
  clearFileUpload: () => ({
    type: 'CLEAR_FILE_UPLOAD' as const,
  }),
  updateCleaningJob: (cleaningJob: Partial<CleaningJob>) => ({
    type: 'UPDATE_CLEANING_JOB' as const,
    payload: cleaningJob,
  }),
  clearCleaningJob: () => ({
    type: 'CLEAR_CLEANING_JOB' as const,
  }),
  updateSettings: (settings: Partial<AppSettings>) => ({
    type: 'UPDATE_SETTINGS' as const,
    payload: settings,
  }),
  resetAppState: () => ({
    type: 'RESET_APP_STATE' as const,
  }),
};