import React, { useEffect, useContext } from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { useSelectedYear, SelectedYearContext } from '@/contexts/SelectedYearContext';
import { useYears } from '@/features/academics/hooks/useYears';

export function YearSelector() {
  // Check if we have the context available
  const context = useContext(SelectedYearContext);
  
  // If no context, don't render
  if (!context) {
    console.log('YearSelector: No context available, not rendering');
    return null;
  }
  
  const { selectedYear, setSelectedYear, setAvailableYears, isAdmin } = context;
  const { data: academicYears = [], isLoading } = useYears();

  // DEBUG: Log values
  console.log('YearSelector DEBUG:', {
    isAdmin,
    selectedYear,
    academicYears,
    isLoading
  });

  // Update available years when data loads
  useEffect(() => {
    if (academicYears.length > 0) {
      setAvailableYears(academicYears);
    }
  }, [academicYears, setAvailableYears]);

  // DEBUG: Always show something for debugging
  if (!isAdmin) {
    console.log('YearSelector: Not showing because isAdmin =', isAdmin);
    // Temporarily show debug info instead of returning null
    return (
      <Box sx={{ color: 'white', mr: 2, fontSize: '0.8rem' }}>
        DEBUG: Not Admin (Role: {JSON.stringify(context)})
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', color: 'white', mr: 2 }}>
        <CircularProgress size={20} color="inherit" />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, minWidth: 200 }}>
      <CalendarIcon sx={{ color: 'white', mr: 1 }} />
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <Select
          value={selectedYear?.id || ''}
          onChange={(e) => {
            const yearId = e.target.value;
            const year = academicYears.find(y => y.id === yearId);
            setSelectedYear(year || null);
          }}
          displayEmpty
          sx={{
            color: 'white',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'white',
            },
            '& .MuiSelect-icon': {
              color: 'white',
            },
          }}
        >
          <MenuItem value="" disabled>
            <Typography variant="body2" color="text.secondary">
              Select Academic Year
            </Typography>
          </MenuItem>
          {academicYears.map((year) => (
            <MenuItem key={year.id} value={year.id}>
              <Box>
                <Typography variant="body2" fontWeight={year.is_active ? 'bold' : 'normal'}>
                  {year.name}
                  {year.is_active && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ ml: 1, color: 'success.main', fontWeight: 'bold' }}
                    >
                      (Active)
                    </Typography>
                  )}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}