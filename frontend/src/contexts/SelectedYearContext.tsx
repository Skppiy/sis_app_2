import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/auth/AuthContext';

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface SelectedYearContextType {
  selectedYear: AcademicYear | null;
  setSelectedYear: (year: AcademicYear | null) => void;
  availableYears: AcademicYear[];
  setAvailableYears: (years: AcademicYear[]) => void;
  isAdmin: boolean;
}

export const SelectedYearContext = createContext<SelectedYearContextType | undefined>(undefined);

interface SelectedYearProviderProps {
  children: ReactNode;
}

export function SelectedYearProvider({ children }: SelectedYearProviderProps) {
  const { user } = useAuth();
  const [selectedYear, setSelectedYearState] = useState<AcademicYear | null>(null);
  const [availableYears, setAvailableYears] = useState<AcademicYear[]>([]);
  
  // DEBUG: Log user data
  console.log('SelectedYearProvider DEBUG:', { user });
  
  // Check if user has admin role - match backend logic
  const userRole = user?.role?.toLowerCase() || '';
  const isAdmin = userRole.includes('admin') || 
                  userRole.includes('principal') || 
                  userRole.includes('dean') || 
                  userRole.includes('staff');
  
  // DEBUG: Log role checking
  console.log('Role check DEBUG:', { 
    userRole, 
    isAdmin,
    roleIncludes: {
      admin: userRole.includes('admin'),
      principal: userRole.includes('principal'),
      dean: userRole.includes('dean'),
      staff: userRole.includes('staff')
    }
  });

  // Load selected year from localStorage on mount
  useEffect(() => {
    if (isAdmin) {
      const savedYearId = localStorage.getItem('selectedAcademicYearId');
      if (savedYearId && availableYears.length > 0) {
        const savedYear = availableYears.find(year => year.id === savedYearId);
        if (savedYear) {
          setSelectedYearState(savedYear);
          return;
        }
      }
      
      // Default to active year if no saved selection
      const activeYear = availableYears.find(year => year.is_active);
      if (activeYear) {
        setSelectedYearState(activeYear);
      }
    }
  }, [isAdmin, availableYears]);

  const setSelectedYear = (year: AcademicYear | null) => {
    setSelectedYearState(year);
    if (year) {
      localStorage.setItem('selectedAcademicYearId', year.id);
    } else {
      localStorage.removeItem('selectedAcademicYearId');
    }
  };

  return (
    <SelectedYearContext.Provider
      value={{
        selectedYear,
        setSelectedYear,
        availableYears,
        setAvailableYears,
        isAdmin,
      }}
    >
      {children}
    </SelectedYearContext.Provider>
  );
}

export function useSelectedYear() {
  const context = useContext(SelectedYearContext);
  if (context === undefined) {
    // More detailed error for debugging
    console.error('useSelectedYear called outside of SelectedYearProvider. Context is undefined.');
    throw new Error('useSelectedYear must be used within a SelectedYearProvider');
  }
  return context;
}